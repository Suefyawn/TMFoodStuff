// Server helpers for the recurring-orders subsystem.
//
// The dispatcher cron calls `dispatchDueSubscriptions` daily. For every
// active subscription whose `next_delivery_date <= today`, we:
//   1. Skip if paused (pause_until is in the future).
//   2. Otherwise insert a new orders row using the saved snapshot,
//      reusing the same pricing logic as one-off COD orders.
//   3. Advance next_delivery_date by frequency_days.
//   4. Update last_delivery_date + total_orders.
//
// All side-effects per-subscription are best-effort: a single failure
// shouldn't block the rest of the batch.
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeOrderTotals } from '@/lib/pricing'
import { fulfillOrder } from '@/lib/order-fulfillment'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

export interface SubscriptionItemSnapshot {
  product_id: number
  name: string
  unit: string
  price_aed: number
  quantity: number
  emoji?: string
}

interface Settings { delivery_fee: number; free_delivery_threshold: number; vat_rate_percent: number; whatsapp_number?: string }

async function loadSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase.from('settings').select('key, value')
  const map: Record<string, string> = {}
  for (const row of data || []) map[row.key] = row.value
  const parseNum = (v: string | undefined, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    delivery_fee: parseNum(map.delivery_fee, 15),
    free_delivery_threshold: parseNum(map.free_delivery_threshold, 150),
    vat_rate_percent: parseNum(map.vat_rate_percent, 5),
    whatsapp_number: map.whatsapp_business_number,
  }
}

function nextOrderNumber(): string {
  // Same convention as /api/orders — TM + 8-digit YYMMDD + 3 random digits.
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const r = Math.floor(Math.random() * 900 + 100)
  return `TM${yy}${mm}${dd}${r}`
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface SubscriptionRow {
  id: number
  customer_id: number
  customer_name: string
  customer_phone: string
  items: SubscriptionItemSnapshot[]
  frequency_days: number
  delivery_slot: string
  delivery_emirate: string
  delivery_area: string
  delivery_building: string | null
  delivery_makani: string | null
  delivery_notes: string | null
  next_delivery_date: string
  pause_until: string | null
  total_orders: number
  customer: { email: string; full_name: string | null } | null
}

export async function dispatchDueSubscriptions(
  supabase: SupabaseClient,
): Promise<{ scanned: number; dispatched: number; failed: number; skipped: number }> {
  const todayIso = isoDate(new Date())

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, customer_id, customer_name, customer_phone, items, frequency_days, delivery_slot, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_notes, next_delivery_date, pause_until, total_orders, customer:customer_id(email, full_name)')
    .eq('status', 'active')
    .lte('next_delivery_date', todayIso)
    .limit(200)
  if (error) {
    console.error('[subscriptions] dispatch select failed:', error)
    return { scanned: 0, dispatched: 0, failed: 0, skipped: 0 }
  }

  const rows = ((data || []) as unknown as Array<Omit<SubscriptionRow, 'customer'> & { customer: Array<{ email: string; full_name: string | null }> | null }>)
    .map(r => ({
      ...r,
      customer: Array.isArray(r.customer) && r.customer[0] ? r.customer[0] : null,
    }))

  const settings = await loadSettings(supabase)
  let dispatched = 0
  let failed = 0
  let skipped = 0

  for (const sub of rows) {
    // Honour pause windows.
    if (sub.pause_until && sub.pause_until >= todayIso) {
      skipped++
      continue
    }

    try {
      const ok = await dispatchOne(supabase, sub, settings)
      if (ok) dispatched++
      else failed++
    } catch (err) {
      console.error('[subscriptions] dispatch one failed for sub', sub.id, err)
      failed++
    }
  }

  return { scanned: rows.length, dispatched, failed, skipped }
}

async function dispatchOne(
  supabase: SupabaseClient,
  sub: SubscriptionRow & { customer: { email: string; full_name: string | null } | null },
  settings: Settings,
): Promise<boolean> {
  // Build pricing line items (just price_aed + quantity) and fulfillment
  // line items (full snapshot) separately so each helper gets exactly what
  // it expects.
  const pricingLines = sub.items.map(it => ({
    price_aed: it.price_aed,
    quantity: it.quantity,
  }))
  const cartSubtotal = pricingLines.reduce((s, i) => s + i.price_aed * i.quantity, 0)
  if (cartSubtotal <= 0) return false

  const deliveryFee = cartSubtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_fee
  const { subtotal, vat, deliveryFee: fee, promoDiscount, total } = computeOrderTotals({
    lineItems: pricingLines,
    vatRatePercent: settings.vat_rate_percent,
    deliveryFee,
    promoDiscountPercent: 0,
  })

  // Order/items column expects a richer snapshot for the admin order detail
  // and customer order page to render line items.
  const orderItems = sub.items.map(it => ({
    product_id: it.product_id,
    name: it.name,
    unit: it.unit,
    price: it.price_aed,
    quantity: it.quantity,
    subtotal: Number((it.price_aed * it.quantity).toFixed(2)),
    emoji: it.emoji,
  }))

  // fulfillOrder needs its own shape (id + name + emoji + qty + price_aed).
  const fulfillLines = sub.items.map(it => ({
    id: it.product_id,
    name: it.name,
    emoji: it.emoji || '',
    quantity: it.quantity,
    price_aed: it.price_aed,
  }))

  // Schedule the new order for next_delivery_date (which is today or past).
  // If past, deliver today.
  const deliveryDate = sub.next_delivery_date <= isoDate(new Date())
    ? isoDate(new Date())
    : sub.next_delivery_date

  const orderNumber = nextOrderNumber()
  const { data: inserted, error: insertErr } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: sub.customer_id,
      customer_name: sub.customer_name,
      customer_phone: sub.customer_phone,
      customer_email: sub.customer?.email || null,
      delivery_emirate: sub.delivery_emirate,
      delivery_area: sub.delivery_area,
      delivery_building: sub.delivery_building,
      delivery_makani: sub.delivery_makani,
      delivery_notes: sub.delivery_notes,
      delivery_slot: sub.delivery_slot,
      delivery_date: deliveryDate,
      items: orderItems,
      subtotal_aed: subtotal,
      subtotal,
      vat_aed: vat,
      vat,
      delivery_fee_aed: fee,
      delivery_fee: fee,
      promo_discount_aed: promoDiscount,
      promo_discount: promoDiscount,
      total_aed: total,
      total,
      payment_method: 'cod',
      payment_status: 'pending',
      status: 'pending',
      subscription_id: sub.id,
    })
    .select('id, order_number')
    .single()
  if (insertErr || !inserted) {
    console.error('[subscriptions] order insert failed:', insertErr)
    return false
  }

  // Seed timeline + run fulfillment (stock decrement + notifications).
  await supabase.from('order_status_history').insert({
    order_id: inserted.id,
    status: 'pending',
    actor_email: 'subscription',
  })

  try {
    await fulfillOrder({
      supabase,
      orderNumber,
      customer: {
        name: sub.customer_name,
        phone: sub.customer_phone,
        email: sub.customer?.email || undefined,
      },
      delivery: {
        emirate: sub.delivery_emirate,
        area: sub.delivery_area,
        building: sub.delivery_building || undefined,
        slot: sub.delivery_slot,
        notes: sub.delivery_notes || undefined,
      },
      totals: { subtotal, vat, deliveryFee: fee, promoDiscount, total },
      lineItems: fulfillLines,
      locale: 'en',
      whatsappNumber: settings.whatsapp_number || '',
      paidOnline: false,
      decrementStock: true,
    })
  } catch (err) {
    console.error('[subscriptions] fulfillOrder failed for', orderNumber, err)
    // Don't abort the dispatcher — the order is in the table and ops can
    // see it; we just won't have sent the customer email.
  }

  // Advance the subscription cursor.
  const nextDate = addDays(new Date(sub.next_delivery_date + 'T00:00:00Z'), sub.frequency_days)
  await supabase
    .from('subscriptions')
    .update({
      next_delivery_date: isoDate(nextDate),
      last_delivery_date: deliveryDate,
      total_orders: (sub.total_orders || 0) + 1,
      pause_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  // Customer notification — optional, best-effort.
  if (sub.customer?.email) {
    await sendDispatchEmail({
      toEmail: sub.customer.email,
      toName: sub.customer.full_name,
      orderNumber,
      deliveryDate,
      slot: sub.delivery_slot,
      totalAed: total,
    }).catch(err => console.error('[subscriptions] dispatch email failed:', err))
  }

  return true
}

interface DispatchEmailArgs {
  toEmail: string
  toName: string | null
  orderNumber: string
  deliveryDate: string
  slot: string
  totalAed: number
}

async function sendDispatchEmail(args: DispatchEmailArgs): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const firstName = (args.toName || 'there').split(' ')[0]
  await resend.emails.send({
    from: `TM FoodStuff <${FROM_EMAIL}>`,
    to: args.toEmail,
    subject: `Your subscription order ${args.orderNumber} is on its way`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <table width="100%"><tr><td align="center">
        <table width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
          <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:900;font-size:18px">TM FoodStuff</td></tr>
          <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65">
            <p style="margin:0 0 14px;font-size:16px;color:#111827">Hi ${firstName.replace(/[<>&]/g, '')},</p>
            <p style="margin:0 0 12px">Your next subscription order has been placed automatically.</p>
            <p style="margin:0 0 18px"><strong>Order ${args.orderNumber}</strong> · ${args.deliveryDate} (${args.slot}) · AED ${args.totalAed.toFixed(2)}</p>
            <p style="margin:18px 0 0;text-align:center">
              <a href="${SITE_URL}/account/subscriptions" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:800;font-size:14px">Manage subscription →</a>
            </p>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`,
  })
}
