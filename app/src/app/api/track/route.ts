import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`track:${getClientIp(request)}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 })
    }

    const { order_number, email } = await request.json()

    if (!order_number || !email) {
      return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, delivery_slot, delivery_date, delivery_emirate, delivery_area, delivery_building, total, items, promo_code, promo_discount, customer_name, customer_email')
      .eq('order_number', order_number.trim().toUpperCase())
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found. Please check your order number.' }, { status: 404 })
    }

    if (!order.customer_email) {
      return NextResponse.json({ error: 'This order has no email on file. Please contact us on WhatsApp.' }, { status: 404 })
    }

    if (order.customer_email.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match this order.' }, { status: 403 })
    }

    // Pull the per-status history so the timeline on /track can render real
    // timestamps. Only `status` + `changed_at` are exposed publicly — actor
    // emails stay internal.
    const { data: historyRows } = await supabase
      .from('order_status_history')
      .select('status, changed_at')
      .eq('order_id', order.id)
      .order('changed_at', { ascending: true })

    return NextResponse.json({
      order_number: order.order_number,
      status: order.status,
      created_at: order.created_at,
      delivery_slot: order.delivery_slot,
      delivery_date: order.delivery_date,
      delivery_emirate: order.delivery_emirate,
      delivery_area: order.delivery_area,
      delivery_building: order.delivery_building,
      total: order.total,
      items: order.items,
      promo_code: order.promo_code,
      promo_discount: order.promo_discount,
      customer_name: order.customer_name,
      history: historyRows || [],
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
