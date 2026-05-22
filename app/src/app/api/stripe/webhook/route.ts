import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { fulfillOrder } from '@/lib/order-fulfillment'

const DEFAULT_WHATSAPP_NUMBER = '971544408411'

// Stripe webhook — confirms card payments. Configure the endpoint URL and
// signing secret (STRIPE_WEBHOOK_SECRET) in the Stripe dashboard.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = new Stripe(secret)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderNumber = session.metadata?.order_number

    if (orderNumber && session.payment_status === 'paid') {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .maybeSingle()

        // Idempotent: only fulfill the first time the event is processed.
        if (order && order.payment_status !== 'paid') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              stripe_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === 'string' ? session.payment_intent : null,
              updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderNumber)

          const { data: settingsRows } = await supabase.from('settings').select('key, value')
          const settings: Record<string, string> = {}
          for (const row of settingsRows || []) settings[row.key] = row.value
          const whatsappNumber =
            (settings.whatsapp_number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '') ||
            DEFAULT_WHATSAPP_NUMBER

          await fulfillOrder(supabase, order, whatsappNumber)
        }
      } catch (err) {
        console.error('Stripe webhook fulfillment error:', err)
        return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
