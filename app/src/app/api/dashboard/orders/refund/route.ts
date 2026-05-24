import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAdminAuthed } from '@/lib/admin-auth'
import { getStripe } from '@/lib/stripe'
import { reverseOrderPoints } from '@/lib/loyalty'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RefundBody {
  id?: number | string
  reason?: string
  amount?: number // optional partial refund in AED; default = full refund
}

export async function POST(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Only admins can issue refunds.' }, { status: 403 })
  }
  const body = (await request.json()) as RefundBody
  const orderId = Number(body.id)
  if (!orderId) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured on this environment.' }, { status: 503 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: order, error: loadErr } = await supabase
    .from('orders')
    .select('id, order_number, payment_method, payment_status, total_aed, total, stripe_payment_intent')
    .eq('id', orderId)
    .maybeSingle()
  if (loadErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (order.payment_method !== 'card') {
    return NextResponse.json({ error: 'Only card orders can be refunded via Stripe.' }, { status: 400 })
  }
  if (!order.stripe_payment_intent) {
    return NextResponse.json({ error: 'This order has no Stripe payment to refund.' }, { status: 400 })
  }
  if (order.payment_status === 'refunded') {
    return NextResponse.json({ error: 'This order has already been refunded.' }, { status: 409 })
  }

  const orderTotal = Number(order.total_aed ?? order.total ?? 0)
  // Stripe expects the smallest currency unit. AED has 2 decimals → ×100.
  const amountFils = body.amount && body.amount > 0
    ? Math.round(body.amount * 100)
    : Math.round(orderTotal * 100)
  if (amountFils > Math.round(orderTotal * 100)) {
    return NextResponse.json({ error: 'Refund amount exceeds the order total.' }, { status: 400 })
  }
  const isPartial = amountFils < Math.round(orderTotal * 100)

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent,
      amount: amountFils,
      reason: 'requested_by_customer',
      metadata: {
        order_id: String(order.id),
        order_number: order.order_number,
        admin_note: (body.reason || '').slice(0, 200),
      },
    })

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        payment_status: isPartial ? 'partially_refunded' : 'refunded',
        status: isPartial ? undefined : 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    if (updateErr) {
      // The refund went through on Stripe; flag the DB drift loudly so an
      // operator can reconcile manually rather than retrying the refund.
      console.error('[refund] DB update failed after successful Stripe refund', updateErr, refund.id)
      return NextResponse.json(
        { ok: true, warning: 'Refund succeeded on Stripe but the order row failed to update. Reconcile manually.', refundId: refund.id },
        { status: 200 },
      )
    }

    // Reverse any loyalty-points side-effects: cancel an earned credit
    // and/or restore points the customer redeemed against this order. Only
    // do this for FULL refunds; partial refunds preserve a proportional
    // share which is too noisy to compute automatically.
    if (!isPartial) {
      await reverseOrderPoints(supabase, { orderId: order.id, orderNumber: order.order_number })
    }

    await logAdminAction({
      supabase,
      action: 'order.refund',
      entity: `order:${order.id}`,
      after: { payment_status: isPartial ? 'partially_refunded' : 'refunded', refund_id: refund.id },
      metadata: { order_number: order.order_number, amount_aed: amountFils / 100, partial: isPartial },
    })

    return NextResponse.json({ ok: true, refundId: refund.id, amount: amountFils / 100, partial: isPartial })
  } catch (err) {
    console.error('[refund] Stripe refund failed:', err)
    const message = err instanceof Error ? err.message : 'Refund failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
