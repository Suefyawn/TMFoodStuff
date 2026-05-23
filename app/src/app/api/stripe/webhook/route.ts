import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { fulfillOrder } from '@/lib/order-fulfillment'
import { toLocale } from '@/lib/locale'

// Stripe verifies the signature against the *raw* request body. App Router
// route handlers expose it via `request.text()` so this works without any
// special body-parser config.
export const dynamic = 'force-dynamic'

const DEFAULT_WHATSAPP_NUMBER = '971544408411'

export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    // Acknowledge so Stripe stops redelivering, but skip work.
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as {
    id: string
    payment_status?: string
    metadata?: Record<string, string> | null
  }
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true })
  }

  const orderId = Number(session.metadata?.order_id ?? '')
  if (!orderId) {
    console.error('[Stripe webhook] missing order_id metadata on session', session.id)
    return NextResponse.json({ received: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: order, error: loadErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (loadErr || !order) {
    console.error('[Stripe webhook] order not found', orderId, loadErr)
    return NextResponse.json({ received: true })
  }

  // Stripe retries deliver the same event up to 3 days. Bail out if we've
  // already marked this order paid so we don't double-fulfil.
  if (order.payment_status === 'paid') {
    return NextResponse.json({ received: true, already_fulfilled: true })
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: order.status === 'pending' ? 'confirmed' : order.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
  if (updateErr) {
    console.error('[Stripe webhook] failed to update order', orderId, updateErr)
    return NextResponse.json({ received: true })
  }

  const { data: settingsRows } = await supabase.from('settings').select('key, value')
  const settings: Record<string, string> = {}
  for (const row of settingsRows || []) settings[row.key] = row.value
  const whatsappNumber =
    (settings.whatsapp_number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '') || DEFAULT_WHATSAPP_NUMBER

  const items = Array.isArray(order.items) ? order.items : []
  await fulfillOrder({
    supabase,
    orderNumber: order.order_number,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email || undefined,
    },
    delivery: {
      emirate: order.delivery_emirate,
      area: order.delivery_area,
      building: order.delivery_building || undefined,
      slot: order.delivery_slot,
      notes: order.delivery_notes || undefined,
    },
    totals: {
      subtotal: Number(order.subtotal_aed ?? order.subtotal ?? 0),
      vat: Number(order.vat_aed ?? order.vat ?? 0),
      deliveryFee: Number(order.delivery_fee_aed ?? order.delivery_fee ?? 0),
      promoCode: order.promo_code || undefined,
      promoDiscount: Number(order.promo_discount_aed ?? order.promo_discount ?? 0),
      total: Number(order.total_aed ?? order.total ?? 0),
    },
    lineItems: items.map((i: Record<string, unknown>) => ({
      id: (i.id as number | string) ?? 0,
      name: String(i.name ?? ''),
      emoji: String(i.emoji ?? ''),
      quantity: Number(i.quantity ?? 0),
      price_aed: Number(i.price_aed ?? 0),
    })),
    locale: toLocale(order.locale),
    whatsappNumber,
    paidOnline: true,
    decrementStock: true,
  })

  return NextResponse.json({ received: true, fulfilled: true })
}
