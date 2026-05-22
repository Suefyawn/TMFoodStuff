import twilio from 'twilio'
import { SITE_URL } from './site'
import { toLocale } from './email'

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const SMS_FROM = process.env.TWILIO_SMS_FROM
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM

function getClient() {
  if (!ACCOUNT_SID || !AUTH_TOKEN) return null
  return twilio(ACCOUNT_SID, AUTH_TOKEN)
}

// Best-effort E.164 normalisation, UAE-aware (handles 05x and 5x local forms).
function normalizePhone(raw: string): string | null {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = '971' + d.slice(1)
  else if (d.length === 9 && d.startsWith('5')) d = '971' + d
  if (d.length < 8) return null
  return '+' + d
}

// Sends a plain-text message over every configured Twilio channel (SMS and/or
// WhatsApp). No-op when Twilio is not configured. Per-message failures are
// logged, never thrown — notifications must not break the order flow.
async function sendToPhone(rawPhone: string, body: string): Promise<void> {
  const client = getClient()
  if (!client) return
  const phone = normalizePhone(rawPhone)
  if (!phone) return

  const jobs: Promise<unknown>[] = []
  if (SMS_FROM) {
    jobs.push(
      client.messages
        .create({ to: phone, from: SMS_FROM, body })
        .catch((err: any) => console.error('[Twilio] SMS failed:', err?.message || err)),
    )
  }
  if (WHATSAPP_FROM) {
    const from = WHATSAPP_FROM.startsWith('whatsapp:') ? WHATSAPP_FROM : `whatsapp:${WHATSAPP_FROM}`
    jobs.push(
      client.messages
        .create({ to: `whatsapp:${phone}`, from, body })
        .catch((err: any) => console.error('[Twilio] WhatsApp failed:', err?.message || err)),
    )
  }
  await Promise.all(jobs)
}

// Order placed / paid — customer confirmation + admin new-order alert.
export async function notifyOrderPlaced(order: any, adminPhone?: string): Promise<void> {
  const locale = toLocale(order.locale)
  const total = Number(order.total_aed ?? order.total ?? 0).toFixed(2)
  const num = order.order_number

  const jobs: Promise<void>[] = []
  if (order.customer_phone) {
    const body =
      locale === 'ar'
        ? `TMFoodStuff: تم تأكيد طلبك #${num}. الإجمالي AED ${total}. تتبّع طلبك: ${SITE_URL}/track`
        : `TMFoodStuff: Order #${num} confirmed. Total AED ${total}. Track your order: ${SITE_URL}/track`
    jobs.push(sendToPhone(order.customer_phone, body))
  }
  if (adminPhone) {
    const body = `TMFoodStuff — new order #${num}: AED ${total}, ${order.customer_name} (${order.customer_phone}). ${SITE_URL}/dashboard/orders`
    jobs.push(sendToPhone(adminPhone, body))
  }
  await Promise.all(jobs)
}

// Order out for delivery — customer.
export async function notifyOutForDelivery(order: any): Promise<void> {
  if (!order.customer_phone) return
  const locale = toLocale(order.locale)
  const num = order.order_number
  const body =
    locale === 'ar'
      ? `TMFoodStuff: طلبك #${num} في الطريق إليك 🚚. تتبّع: ${SITE_URL}/track`
      : `TMFoodStuff: Order #${num} is out for delivery 🚚. Track: ${SITE_URL}/track`
  await sendToPhone(order.customer_phone, body)
}

// Order delivered — customer.
export async function notifyDelivered(order: any): Promise<void> {
  if (!order.customer_phone) return
  const locale = toLocale(order.locale)
  const num = order.order_number
  const body =
    locale === 'ar'
      ? `TMFoodStuff: تم توصيل طلبك #${num} ✅. شكراً لتسوّقك معنا!`
      : `TMFoodStuff: Order #${num} has been delivered ✅. Thank you for shopping with us!`
  await sendToPhone(order.customer_phone, body)
}
