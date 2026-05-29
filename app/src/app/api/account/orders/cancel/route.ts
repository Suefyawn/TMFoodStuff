// Customer-initiated order cancellation. Only their own orders, only while
// the order is still in the early pipeline (pending or confirmed — not after
// it has started processing). Paid card orders go through the standard
// Stripe refund flow before being marked cancelled.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { getStripe } from '@/lib/stripe'
import { reverseOrderPoints } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed'])

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { order_number } = (await request.json()) as { order_number?: string }
  if (!order_number) return NextResponse.json({ error: 'Order number required.' }, { status: 400 })

  const supabase = getServiceRoleClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, status, payment_method, payment_status, total_aed, total, stripe_payment_intent')
    .eq('order_number', order_number)
    .eq('customer_email', customer.email.toLowerCase())
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      {
        error: order.status === 'cancelled'
          ? 'This order is already cancelled.'
          : 'This order can no longer be cancelled — please contact us on WhatsApp.',
      },
      { status: 409 },
    )
  }

  // If they paid by card, issue a Stripe refund first. Only mark the order
  // cancelled if the refund actually succeeds so we never leave a customer
  // with a "cancelled" order but a live charge. We refund only the amount
  // still outstanding (honouring any prior partial refund recorded by an
  // admin) and append the refund to the order_refunds ledger so the
  // accounting stays consistent with the admin refund flow.
  const isPaidCard = order.payment_method === 'card' && order.payment_status === 'paid'
  if (isPaidCard) {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Refunds are temporarily unavailable. Please contact support.' },
        { status: 503 },
      )
    }
    if (!order.stripe_payment_intent) {
      return NextResponse.json(
        { error: 'Cannot self-cancel a paid order with no Stripe payment on file. Please contact support.' },
        { status: 409 },
      )
    }

    const orderTotal = Number(order.total_aed ?? order.total ?? 0)
    const { data: priorRefunds } = await supabase
      .from('order_refunds')
      .select('amount_aed')
      .eq('order_id', order.id)
    const alreadyRefunded = (priorRefunds || []).reduce((s, r) => s + Number(r.amount_aed), 0)
    const remaining = Math.max(0, orderTotal - alreadyRefunded)

    if (remaining > 0.001) {
      let stripeRefundId: string | null = null
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent,
          amount: Math.round(remaining * 100),
          reason: 'requested_by_customer',
          metadata: {
            order_id: String(order.id),
            order_number: order.order_number,
            source: 'customer_self_cancel',
          },
        })
        stripeRefundId = refund.id
      } catch (err) {
        console.error('[self-cancel] Stripe refund failed:', err)
        return NextResponse.json(
          { error: 'We could not process the refund automatically. Please contact support.' },
          { status: 502 },
        )
      }
      await supabase.from('order_refunds').insert({
        order_id: order.id,
        amount_aed: remaining,
        reason: 'Customer self-cancellation',
        refund_type: alreadyRefunded === 0 ? 'full' : 'partial',
        payment_method: 'card',
        stripe_refund_id: stripeRefundId,
        restocked: false,
        created_by: 'customer_self_cancel',
      })
    }
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: isPaidCard ? 'refunded' : order.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Reverse loyalty side-effects (return redeemed points, void any pending
  // earn — though earn only triggers on 'delivered' so usually nothing to
  // undo at this stage).
  await reverseOrderPoints(supabase, { orderId: order.id, orderNumber: order.order_number })

  return NextResponse.json({ ok: true, refunded: isPaidCard })
}
