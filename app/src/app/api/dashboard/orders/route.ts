import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { sendOutForDeliveryEmail, sendDeliveredEmail, sendOrderStatusUpdateEmail } from '@/lib/email'
import { notifyOutForDelivery, notifyDelivered } from '@/lib/notify'
import { toLocale } from '@/lib/locale'
import { earnPointsForOrder, findCustomerByEmail } from '@/lib/loyalty'
import { rewardReferralOnDelivery } from '@/lib/referrals'
import { sendPushToCustomer } from '@/lib/push'
import { logAdminAction } from '@/lib/audit'
import { SITE_URL } from '@/lib/site'

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled']
const DEFAULT_WHATSAPP_NUMBER = '971544408411'

export async function PATCH(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Bulk callers send { id, status, cancellation_reason? }. The reason is
  // only meaningful when the new status is 'cancelled' — we ignore it
  // otherwise so other transitions don't accidentally store stale notes.
  const { id, status, cancellation_reason } = await request.json()

  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, customer_phone, delivery_slot, total, total_aed, subtotal_aed, subtotal, status, locale, payment_method, payment_status')
    .eq('id', parseInt(id))
    .maybeSingle()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const session = await import('@/lib/admin-auth').then(m => m.getDashboardSession())
  const actor = session.state === 'ok' ? session.email : null

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
    updates.cancelled_by = actor
    if (typeof cancellation_reason === 'string') {
      updates.cancellation_reason = cancellation_reason.trim().slice(0, 500) || null
    }
  }

  const { error } = await supabase.from('orders').update(updates).eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Record the transition on the per-order timeline so the customer's
  // tracking page can show when each step happened. Skip no-op transitions
  // (re-saving the same status) — they'd just clutter the timeline.
  if (status !== order.status) {
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status,
      actor_email: actor,
      note: status === 'cancelled' && typeof cancellation_reason === 'string' ? cancellation_reason.trim().slice(0, 500) || null : null,
    })
  }

  // Audit every status change, including no-op transitions, so the trail is
  // complete even when the dashboard sends a stale "save" click.
  await logAdminAction({
    supabase,
    action: 'order.status_change',
    entity: `order:${order.id}`,
    before: { status: order.status },
    after: { status },
    metadata: { order_number: order.order_number },
  })

  // Only fire notifications when the status actually transitions.
  if (status !== order.status) {
    const { data: settingsRows } = await supabase.from('settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const row of (settingsRows || [])) settings[row.key] = row.value
    const whatsappNumber = (settings.whatsapp_number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '') || DEFAULT_WHATSAPP_NUMBER

    const locale = toLocale(order.locale)
    const totalNumber = Number(order.total_aed ?? order.total ?? 0)
    const paidOnline = order.payment_method === 'card' && order.payment_status === 'paid'

    const emailData = {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email ?? '',
      delivery_slot: order.delivery_slot,
      total: totalNumber,
      whatsapp_number: whatsappNumber,
      paid_online: paidOnline,
    }
    const smsSummary = {
      order_number: order.order_number,
      customer_name: order.customer_name,
      delivery_slot: order.delivery_slot,
      total: totalNumber,
    }

    if ((status === 'confirmed' || status === 'processing') && order.customer_email) {
      sendOrderStatusUpdateEmail(emailData, status, locale).catch(console.error)
    }
    if (status === 'out_for_delivery') {
      if (order.customer_email) sendOutForDeliveryEmail(emailData, locale).catch(console.error)
      if (order.customer_phone) notifyOutForDelivery(order.customer_phone, smsSummary, locale).catch(console.error)
    }

    // Web-push ping on every transition that the customer cares about.
    // Best-effort — never blocks the response. Resolves the customer id
    // through the same email-match the loyalty earn uses.
    if (order.customer_email) {
      void findCustomerByEmail(supabase, order.customer_email)
        .then(async customerId => {
          if (!customerId) return
          const titleByStatus: Record<string, string> = {
            confirmed: `Order ${order.order_number} confirmed`,
            processing: `Order ${order.order_number} is being packed`,
            out_for_delivery: `Order ${order.order_number} is on the way`,
            delivered: `Order ${order.order_number} delivered`,
            cancelled: `Order ${order.order_number} cancelled`,
            refunded: `Order ${order.order_number} refunded`,
          }
          const title = titleByStatus[status]
          if (!title) return
          await sendPushToCustomer(supabase, customerId, {
            title,
            body: `Tap to see the latest update.`,
            url: `${SITE_URL}/track?o=${encodeURIComponent(order.order_number)}`,
            tag: `order-${order.order_number}`,
          })
        })
        .catch(err => console.error('[orders] push notification failed:', err))
    }
    if (status === 'delivered') {
      if (order.customer_email) sendDeliveredEmail(emailData, locale).catch(console.error)
      if (order.customer_phone) notifyDelivered(order.customer_phone, smsSummary, locale).catch(console.error)
      // Credit loyalty points to the customer matched on email. The ledger
      // has a UNIQUE constraint on (order_id, 'order_earned') so a second
      // delivered → delivered transition can't double-credit.
      if (order.customer_email) {
        const customerId = await findCustomerByEmail(supabase, order.customer_email)
        if (customerId) {
          const subtotal = Number(order.subtotal_aed ?? order.subtotal ?? 0)
          await earnPointsForOrder(supabase, {
            customerId,
            orderId: order.id,
            subtotalAed: subtotal,
            orderNumber: order.order_number,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            locale,
          })
        }
      }
      // Referral reward (separate from the per-order earn): credits 50 pts
      // to both referrer and referred when the referred's first order is
      // delivered. Idempotent — described in lib/referrals.
      await rewardReferralOnDelivery(supabase, { orderId: order.id })
    }
  }

  return NextResponse.json({ ok: true })
}
