import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { sendOutForDeliveryEmail, sendDeliveredEmail } from '@/lib/email'
import { notifyOutForDelivery, notifyDelivered } from '@/lib/notify'
import { toLocale } from '@/lib/locale'

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled']
const DEFAULT_WHATSAPP_NUMBER = '971544408411'

export async function PATCH(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await request.json()

  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, customer_phone, delivery_slot, total, total_aed, status, locale, payment_method, payment_status')
    .eq('id', parseInt(id))
    .maybeSingle()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

    if (status === 'out_for_delivery') {
      if (order.customer_email) sendOutForDeliveryEmail(emailData, locale).catch(console.error)
      if (order.customer_phone) notifyOutForDelivery(order.customer_phone, smsSummary, locale).catch(console.error)
    }
    if (status === 'delivered') {
      if (order.customer_email) sendDeliveredEmail(emailData, locale).catch(console.error)
      if (order.customer_phone) notifyDelivered(order.customer_phone, smsSummary, locale).catch(console.error)
    }
  }

  return NextResponse.json({ ok: true })
}
