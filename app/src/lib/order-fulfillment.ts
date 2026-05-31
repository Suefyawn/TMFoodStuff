// Shared fulfilment path for newly-placed orders.
//
// Both /api/orders (Cash on Delivery) and /api/stripe/webhook
// (checkout.session.completed) call this so customer notifications, the admin
// alert, and stock decrement happen exactly once per order, regardless of how
// the order arrived. Every external send is independently fault-tolerant —
// failures are logged and swallowed; the caller never retries on this path.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  sendOrderConfirmation,
  sendAdminOrderAlert,
  sendAdminLowStockAlert,
  type OrderEmailData,
} from './email'
import { notifyOrderConfirmation, notifyAdminNewOrder } from './notify'
import { logError } from './log'
import type { Locale } from './locale'

const LOW_STOCK_THRESHOLD = 5

interface FulfillLineItem {
  id: number | string
  name: string
  emoji: string
  quantity: number
  price_aed: number
}

export interface FulfillOrderInput {
  supabase: SupabaseClient
  orderNumber: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  delivery: {
    emirate: string
    area: string
    building?: string
    slot: string
    notes?: string
  }
  totals: {
    subtotal: number
    vat: number
    deliveryFee: number
    promoCode?: string
    promoDiscount: number
    total: number
  }
  lineItems: FulfillLineItem[]
  locale: Locale
  whatsappNumber: string
  paidOnline: boolean
  /**
   * When true, run `decrement_stock` for every line item. Set false when the
   * order row was inserted via a path that already decremented stock (e.g. the
   * `create_checkout_order` RPC).
   */
  decrementStock: boolean
}

export async function fulfillOrder(input: FulfillOrderInput): Promise<void> {
  const emailData: OrderEmailData = {
    order_number: input.orderNumber,
    customer_name: input.customer.name,
    customer_phone: input.customer.phone,
    customer_email: input.customer.email || undefined,
    delivery_area: input.delivery.area,
    delivery_emirate: input.delivery.emirate,
    delivery_building: input.delivery.building || undefined,
    delivery_slot: input.delivery.slot,
    delivery_notes: input.delivery.notes || undefined,
    delivery_fee: input.totals.deliveryFee,
    subtotal: input.totals.subtotal,
    vat: input.totals.vat,
    promo_code: input.totals.promoCode || undefined,
    promo_discount: input.totals.promoDiscount,
    total: input.totals.total,
    items: input.lineItems.map((i) => ({
      name: i.name,
      emoji: i.emoji,
      quantity: i.quantity,
      price_aed: i.price_aed,
    })),
    whatsapp_number: input.whatsappNumber,
    paid_online: input.paidOnline,
  }

  const summary = {
    order_number: input.orderNumber,
    customer_name: input.customer.name,
    total: input.totals.total,
  }

  const tasks: Array<PromiseLike<unknown>> = [
    sendOrderConfirmation(emailData, input.locale),
    sendAdminOrderAlert(emailData),
    notifyAdminNewOrder(summary),
  ]

  if (input.customer.phone) {
    tasks.push(notifyOrderConfirmation(input.customer.phone, summary, input.locale))
  }

  if (input.decrementStock) {
    for (const item of input.lineItems) {
      tasks.push(
        (async () => {
          const { data: ok, error } = await input.supabase.rpc('decrement_stock', {
            p_id: Number(item.id),
            p_qty: item.quantity,
          })
          if (error || ok === false) {
            logError('fulfillOrder.decrement_stock', error ?? new Error('decrement returned false'), {
              orderNumber: input.orderNumber,
              productId: item.id,
            })
            return
          }
          // Fire a low-stock alert when this order pushed the product BELOW
          // its threshold for the first time. Only one email per crossing —
          // future orders that keep the product below threshold don't spam.
          //
          // Threshold is now per-product (products.low_stock_threshold);
          // falls back to a global default for products that haven't been
          // tuned yet.
          const { data: row } = await input.supabase
            .from('products')
            .select('name, slug, stock, low_stock_threshold')
            .eq('id', Number(item.id))
            .maybeSingle()
          if (!row) return
          const newStock = Number(row.stock ?? 0)
          const oldStock = newStock + item.quantity
          const threshold = Number(row.low_stock_threshold ?? LOW_STOCK_THRESHOLD)
          if (newStock < threshold && oldStock >= threshold) {
            await sendAdminLowStockAlert(row.name, row.slug, newStock)
            // Best-effort push to every signed-in admin device too. Imported
            // lazily to keep the hot fulfilment path tight.
            const { notifyAdminsLowStock } = await import('./push-admin')
            await notifyAdminsLowStock(input.supabase, row.name, row.slug, newStock)
          }
        })(),
      )
    }
  }

  const results = await Promise.allSettled(tasks)
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (failures.length > 0) {
    // Notifications/SMS swallow their own errors internally, so a rejection
    // here is unexpected — surface it (console + Sentry) rather than dropping
    // it, so a fulfilment-path regression doesn't go unnoticed.
    logError('fulfillOrder.tasks', new Error(`${failures.length} fulfilment task(s) rejected`), {
      orderNumber: input.orderNumber,
      reasons: failures.map(f => String(f.reason)).slice(0, 5),
    })
  }
}
