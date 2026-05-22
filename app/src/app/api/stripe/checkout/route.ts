import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// Creates a Stripe Checkout Session for an already-placed card order.
// The charge amount comes only from the server-recomputed order total.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: 'Online payment is not configured.' }, { status: 503 })
  }

  if (!rateLimit(`stripe-checkout:${getClientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const { orderNumber } = await request.json()
    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, total_aed, total, payment_method, payment_status, customer_email')
      .eq('order_number', orderNumber.trim())
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.payment_method !== 'card') {
      return NextResponse.json({ error: 'This order is not a card order' }, { status: 400 })
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'This order has already been paid' }, { status: 400 })
    }

    const amountFils = Math.round(Number(order.total_aed ?? order.total ?? 0) * 100)
    if (!Number.isFinite(amountFils) || amountFils <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
    }

    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aed',
            unit_amount: amountFils,
            product_data: { name: `TMFoodStuff Order #${order.order_number}` },
          },
        },
      ],
      customer_email: order.customer_email || undefined,
      metadata: { order_number: order.order_number },
      success_url: `${SITE_URL}/checkout?paid=${encodeURIComponent(order.order_number)}`,
      cancel_url: `${SITE_URL}/checkout?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }
}
