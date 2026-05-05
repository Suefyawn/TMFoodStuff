import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
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
      .select('order_number, status, created_at, delivery_slot, delivery_emirate, delivery_area, delivery_building, total, items, promo_code, promo_discount, customer_name, customer_email')
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

    return NextResponse.json({
      order_number: order.order_number,
      status: order.status,
      created_at: order.created_at,
      delivery_slot: order.delivery_slot,
      delivery_emirate: order.delivery_emirate,
      delivery_area: order.delivery_area,
      delivery_building: order.delivery_building,
      total: order.total,
      items: order.items,
      promo_code: order.promo_code,
      promo_discount: order.promo_discount,
      customer_name: order.customer_name,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
