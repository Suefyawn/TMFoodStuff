import { NextResponse } from 'next/server'
import { requireDashboardRole, requireDashboardStaff } from '@/lib/dashboard-auth'

export const dynamic = 'force-dynamic'

/** List orders + item counts (same logic as dashboard orders page). */
export async function GET() {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response

  const supabase = auth.session.supabase
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  const list = orders || []

  const ids = list.map((o: any) => o.id).filter(Boolean)
  if (ids.length === 0) {
    return NextResponse.json(
      list.map((o: any) => ({
        ...o,
        customer_name: o.customer_full_name || o.customer_name,
        total: o.total_aed ?? o.total,
        subtotal: o.subtotal_aed ?? o.subtotal,
        vat: o.vat_aed ?? o.vat,
        promo_discount: o.promo_discount_aed ?? o.promo_discount,
        delivery_fee: o.delivery_fee_aed ?? o.delivery_fee,
        item_count: 0,
      }))
    )
  }

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('order_id, quantity')
    .in('order_id', ids)

  const counts = new Map<number, number>()
  for (const it of orderItems || []) {
    const id = Number((it as any).order_id)
    counts.set(id, (counts.get(id) || 0) + (Number((it as any).quantity) || 0))
  }

  const enriched = list.map((o: any) => {
    const countFromItems = counts.get(Number(o.id))
    return {
      ...o,
      customer_name: o.customer_full_name || o.customer_name,
      total: o.total_aed ?? o.total,
      subtotal: o.subtotal_aed ?? o.subtotal,
      vat: o.vat_aed ?? o.vat,
      promo_discount: o.promo_discount_aed ?? o.promo_discount,
      delivery_fee: o.delivery_fee_aed ?? o.delivery_fee,
      item_count: countFromItems ?? 0,
    }
  })

  return NextResponse.json(enriched)
}

export async function PATCH(request: Request) {
  const auth = await requireDashboardRole()
  if (!auth.ok) return auth.response

  const { id, status } = await request.json()
  const supabase = auth.session.supabase
  const orderId = parseInt(id)

  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const prevStatus = existing.status

  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'cancelled' && prevStatus !== 'cancelled') {
    const { error: restockError } = await supabase.rpc('cancel_order_restock', { p_order_id: orderId })
    if (restockError) return NextResponse.json({ error: restockError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
