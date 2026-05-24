// Process a refund against an order.
//
// Card orders → call Stripe Refunds API and record the refund id. Full
//   refunds also reverse any loyalty points and flip the order to a
//   `refunded` status.
// COD orders → just record the ledger entry. Cash refunds happen outside
//   the system; this gives the admin a record + reconciliation surface.
//
// Optional restocking: when `restock=true`, increment each line-item's
// stock_quantity by its ordered qty. All-or-nothing per refund event.
//
// Every refund is appended to `order_refunds`, which becomes the
// per-order refund history shown on the admin order detail page.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAdminAuthed, getDashboardSession } from '@/lib/admin-auth'
import { getStripe } from '@/lib/stripe'
import { reverseOrderPoints } from '@/lib/loyalty'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RefundBody {
  id?: number | string
  reason?: string
  notes?: string
  amount?: number // partial refund in AED; default = full of remaining
  restock?: boolean
}

interface OrderItem {
  id?: number | string
  product_id?: number | string
  quantity?: number
}

export async function POST(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Only admins can issue refunds.' }, { status: 403 })
  }
  const body = (await request.json()) as RefundBody
  const orderId = Number(body.id)
  if (!orderId) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: order, error: loadErr } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_method, payment_status, total_aed, total, items, stripe_payment_intent')
    .eq('id', orderId)
    .maybeSingle()
  if (loadErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot refund a cancelled order.' }, { status: 400 })
  }

  // Compute how much is still refundable. Honour prior partial refunds.
  const orderTotal = Number(order.total_aed ?? order.total ?? 0)
  const { data: priorRefunds } = await supabase
    .from('order_refunds')
    .select('amount_aed')
    .eq('order_id', orderId)
  const alreadyRefunded = (priorRefunds || []).reduce((s, r) => s + Number(r.amount_aed), 0)
  const remaining = Math.max(0, orderTotal - alreadyRefunded)
  if (remaining <= 0) {
    return NextResponse.json({ error: 'This order is already fully refunded.' }, { status: 409 })
  }

  const requestedAmount = body.amount && body.amount > 0 ? body.amount : remaining
  if (requestedAmount > remaining + 0.001) {
    return NextResponse.json({
      error: `Refund amount (${requestedAmount.toFixed(2)}) exceeds remaining refundable balance (${remaining.toFixed(2)}).`,
    }, { status: 400 })
  }
  const isFullRefund = Math.abs(requestedAmount - remaining) < 0.01
  const paymentMethod: 'card' | 'cod' = order.payment_method === 'card' ? 'card' : 'cod'

  // ── Card path: call Stripe ────────────────────────────────────────────
  let stripeRefundId: string | null = null
  if (paymentMethod === 'card') {
    if (!order.stripe_payment_intent) {
      return NextResponse.json({ error: 'No Stripe payment intent on this order — refund manually in Stripe Dashboard.' }, { status: 400 })
    }
    if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') {
      return NextResponse.json({ error: 'Card order is not in a paid state — cannot refund through Stripe.' }, { status: 400 })
    }
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured on this environment.' }, { status: 503 })
    }
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        amount: Math.round(requestedAmount * 100),
        reason: 'requested_by_customer',
        metadata: {
          order_id: String(order.id),
          order_number: order.order_number,
          admin_note: (body.reason || '').slice(0, 200),
        },
      })
      stripeRefundId = refund.id
    } catch (err) {
      console.error('[refund] Stripe refund failed:', err)
      const message = err instanceof Error ? err.message : 'Refund failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // ── Record in the refund ledger ───────────────────────────────────────
  const session = await getDashboardSession()
  const actor = session.state === 'ok' ? session.email : 'unknown'

  const { data: refundRow, error: insertErr } = await supabase
    .from('order_refunds')
    .insert({
      order_id: orderId,
      amount_aed: requestedAmount,
      reason: body.reason || null,
      notes: body.notes || null,
      refund_type: isFullRefund && alreadyRefunded === 0 ? 'full' : 'partial',
      payment_method: paymentMethod,
      stripe_refund_id: stripeRefundId,
      restocked: !!body.restock,
      created_by: actor,
    })
    .select('id')
    .single()
  if (insertErr || !refundRow) {
    console.error('[refund] ledger insert failed after refund:', insertErr)
    return NextResponse.json({
      ok: true,
      warning: stripeRefundId
        ? 'Refund went through but the ledger write failed. Reconcile manually.'
        : 'Refund recording failed.',
      stripe_refund_id: stripeRefundId,
    }, { status: 200 })
  }

  // ── Optional restock ──────────────────────────────────────────────────
  if (body.restock) {
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []
    for (const it of items) {
      const productId = it.product_id ?? it.id
      const qty = Number(it.quantity) || 0
      if (!productId || qty <= 0) continue
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .maybeSingle()
      if (product) {
        await supabase
          .from('products')
          .update({ stock_quantity: (Number(product.stock_quantity) || 0) + qty })
          .eq('id', productId)
      }
    }
  }

  // ── Update the order header ───────────────────────────────────────────
  // Full refund → flip to 'refunded' status + reverse loyalty points.
  // Partial refund → payment_status moves to 'partially_refunded' but
  // status stays so the order can still be delivered if appropriate.
  const newPaymentStatus = isFullRefund && alreadyRefunded === 0
    ? (paymentMethod === 'card' ? 'refunded' : order.payment_status)
    : 'partially_refunded'
  const newStatus = isFullRefund && alreadyRefunded === 0 ? 'refunded' : order.status

  await supabase
    .from('orders')
    .update({
      payment_status: newPaymentStatus,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (isFullRefund && alreadyRefunded === 0) {
    // Append to the per-order timeline so /track + /account/orders both show
    // the refund.
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'refunded',
      actor_email: actor,
    })
    // Reverse loyalty side-effects only for full refunds; partial refunds
    // are too noisy to apportion automatically.
    await reverseOrderPoints(supabase, { orderId: order.id, orderNumber: order.order_number })
  }

  await logAdminAction({
    supabase,
    action: 'order.refund',
    entity: `order:${order.id}`,
    after: {
      payment_status: newPaymentStatus,
      status: newStatus,
      refund_id: stripeRefundId,
    },
    metadata: {
      order_number: order.order_number,
      amount_aed: requestedAmount,
      refund_type: isFullRefund && alreadyRefunded === 0 ? 'full' : 'partial',
      payment_method: paymentMethod,
      restocked: !!body.restock,
      reason: body.reason,
    },
  })

  return NextResponse.json({
    ok: true,
    refund_id: refundRow.id,
    stripe_refund_id: stripeRefundId,
    amount: requestedAmount,
    partial: !(isFullRefund && alreadyRefunded === 0),
    remaining_aed: Math.max(0, remaining - requestedAmount),
  })
}
