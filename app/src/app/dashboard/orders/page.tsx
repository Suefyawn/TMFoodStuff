import { createClient } from '@supabase/supabase-js'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

async function getOrders() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  const list = orders || []

  const ids = list.map((o: any) => o.id).filter(Boolean)
  if (ids.length === 0) return list

  // Prefer normalized order_items, fallback to legacy orders.items array if empty.
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('order_id, quantity')
    .in('order_id', ids)

  const counts = new Map<number, number>()
  for (const it of (orderItems || [])) {
    const id = Number((it as any).order_id)
    counts.set(id, (counts.get(id) || 0) + (Number((it as any).quantity) || 0))
  }

  return list.map((o: any) => {
    const countFromItems = counts.get(Number(o.id))
    const legacyCount = Array.isArray(o.items) ? o.items.length : 0
    return {
      ...o,
      customer_name: o.customer_full_name || o.customer_name,
      total: o.total_aed ?? o.total,
      subtotal: o.subtotal_aed ?? o.subtotal,
      vat: o.vat_aed ?? o.vat,
      promo_discount: o.promo_discount_aed ?? o.promo_discount,
      delivery_fee: o.delivery_fee_aed ?? o.delivery_fee,
      item_count: countFromItems ?? legacyCount,
    }
  })
}

export default async function OrdersPage() {
  const orders = await getOrders()
  return <OrdersClient initialOrders={orders} />
}
