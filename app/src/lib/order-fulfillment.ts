import type { SupabaseClient } from '@supabase/supabase-js'
import { sendOrderConfirmation, sendAdminOrderAlert, toLocale, type OrderEmailData } from './email'
import { notifyOrderPlaced } from './notify'

// Fulfills a placed order: decrements product stock and sends the customer
// confirmation + admin alert emails. Shared by the COD path in /api/orders and
// the Stripe webhook (card orders, once payment succeeds) so both payment
// methods fulfill identically. `order` is an order row / insert payload.
export async function fulfillOrder(
  supabase: SupabaseClient,
  order: any,
  whatsappNumber: string,
): Promise<void> {
  const items: any[] = Array.isArray(order.items) ? order.items : []

  await Promise.all(
    items.map(async (i) => {
      const { data: ok, error } = await supabase.rpc('decrement_stock', {
        p_id: Number(i.id),
        p_qty: Number(i.quantity),
      })
      if (error || ok === false) {
        console.error(`Stock decrement failed for product ${i.id} on order ${order.order_number}`, error)
      }
    }),
  )

  const emailData: OrderEmailData = {
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email || undefined,
    delivery_area: order.delivery_area,
    delivery_emirate: order.delivery_emirate,
    delivery_building: order.delivery_building || undefined,
    delivery_slot: order.delivery_slot,
    delivery_notes: order.delivery_notes || undefined,
    delivery_fee: Number(order.delivery_fee_aed ?? order.delivery_fee ?? 0),
    subtotal: Number(order.subtotal_aed ?? order.subtotal ?? 0),
    vat: Number(order.vat_aed ?? order.vat ?? 0),
    promo_code: order.promo_code || undefined,
    promo_discount: Number(order.promo_discount_aed ?? order.promo_discount ?? 0),
    total: Number(order.total_aed ?? order.total ?? 0),
    items: items.map((i) => ({
      name: i.name,
      emoji: i.emoji,
      quantity: Number(i.quantity),
      price_aed: Number(i.price_aed),
    })),
    whatsapp_number: whatsappNumber,
    locale: toLocale(order.locale),
  }

  await Promise.all([
    sendOrderConfirmation(emailData),
    sendAdminOrderAlert(emailData),
    notifyOrderPlaced(order, whatsappNumber),
  ])
}
