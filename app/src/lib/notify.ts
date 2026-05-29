// Twilio SMS + WhatsApp notifications.
import { logError } from './log'
//
// Three customer/admin events go through here: order confirmation, delivery
// status changes (out_for_delivery, delivered), and the admin new-order alert.
// Back-in-stock alerts stay email-only.
//
// Each channel is independently optional and silently no-ops when its env vars
// are missing, mirroring the pattern in email.ts. Production WhatsApp
// business-initiated messages will require Meta-approved templates configured
// in Twilio (Content API); the freeform `body` used here works for SMS in
// production and for WhatsApp sandbox / 24-hour customer-care sessions.
import type { Locale } from './locale'

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const SMS_FROM = process.env.TWILIO_SMS_FROM
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM
const ADMIN_PHONE = process.env.TWILIO_ADMIN_PHONE

type TwilioClient = {
  messages: {
    create: (args: { from: string; to: string; body: string }) => Promise<unknown>
  }
}

let cachedClient: TwilioClient | null | undefined
async function getTwilio(): Promise<TwilioClient | null> {
  if (cachedClient !== undefined) return cachedClient
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    cachedClient = null
    return null
  }
  const mod = await import('twilio')
  const factory = (mod as { default?: unknown }).default ?? mod
  cachedClient = (factory as (sid: string, token: string) => TwilioClient)(ACCOUNT_SID, AUTH_TOKEN)
  return cachedClient
}

// E.164-ish normalisation. Customers in the UAE often enter "050 123 4567" or
// "+971 50 ..."; Twilio wants "+971501234567". When we can't confidently form
// a number, drop the channel instead of sending a malformed request.
function normalisePhone(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (trimmed.startsWith('+')) {
    const digits = '+' + trimmed.slice(1).replace(/\D/g, '')
    return digits.length >= 9 ? digits : null
  }
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('971')) return `+${digits}`
  if (digits.startsWith('0')) return `+971${digits.slice(1)}`
  if (digits.length === 9) return `+971${digits}`
  return `+${digits}`
}

async function send(channel: 'sms' | 'whatsapp', to: string, body: string): Promise<void> {
  const from = channel === 'sms' ? SMS_FROM : WHATSAPP_FROM
  if (!from) return
  const client = await getTwilio()
  if (!client) return
  const normalised = normalisePhone(to)
  if (!normalised) return

  const toAddr = channel === 'whatsapp' ? `whatsapp:${normalised}` : normalised
  const fromAddr = channel === 'whatsapp' && !from.startsWith('whatsapp:') ? `whatsapp:${from}` : from

  try {
    await client.messages.create({ from: fromAddr, to: toAddr, body })
  } catch (err) {
    logError(`notify.${channel}`, err)
  }
}

// ─── Message bodies ──────────────────────────────────────────────────────────

interface OrderSummary {
  order_number: string
  customer_name: string
  total: number
}

interface StatusSummary {
  order_number: string
  customer_name: string
  delivery_slot?: string
  total: number
}

const SLOT_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    morning: '8 AM – 12 PM',
    afternoon: '12 – 5 PM',
    evening: '5 – 10 PM',
  },
  ar: {
    morning: '٨ص – ١٢م',
    afternoon: '١٢م – ٥م',
    evening: '٥م – ١٠م',
  },
}

function orderConfirmationBody(order: OrderSummary, locale: Locale): string {
  if (locale === 'ar') {
    return `تم تأكيد طلبك #${order.order_number} - TM FoodStuff\n` +
      `المجموع: AED ${order.total.toFixed(2)}\n` +
      `شكراً ${order.customer_name}! سنتواصل معك قبل التوصيل.`
  }
  return `TM FoodStuff: Order #${order.order_number} confirmed.\n` +
    `Total: AED ${order.total.toFixed(2)}\n` +
    `Thanks ${order.customer_name}! We'll message you before delivery.`
}

function outForDeliveryBody(order: StatusSummary, locale: Locale): string {
  const slot = order.delivery_slot ? (SLOT_LABELS[locale][order.delivery_slot] ?? order.delivery_slot) : ''
  if (locale === 'ar') {
    return `طلبك #${order.order_number} في الطريق إليك الآن${slot ? ` (${slot})` : ''}.\n` +
      `المبلغ المستحق: AED ${order.total.toFixed(2)} (الدفع عند الاستلام)`
  }
  return `TM FoodStuff: Your order #${order.order_number} is out for delivery${slot ? ` (${slot})` : ''}.\n` +
    `Amount due: AED ${order.total.toFixed(2)} (Cash on Delivery)`
}

function deliveredBody(order: StatusSummary, locale: Locale): string {
  if (locale === 'ar') {
    return `تم تسليم طلبك #${order.order_number}. نتمنى أن تستمتع! 🌿\n— TM FoodStuff`
  }
  return `TM FoodStuff: Your order #${order.order_number} has been delivered. Enjoy! 🌿`
}

function adminAlertBody(order: OrderSummary): string {
  return `🛒 New order #${order.order_number}\n` +
    `${order.customer_name} — AED ${order.total.toFixed(2)}\n` +
    `Open the dashboard to fulfil.`
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function notifyOrderConfirmation(
  to: string,
  order: OrderSummary,
  locale: Locale,
): Promise<void> {
  const body = orderConfirmationBody(order, locale)
  await Promise.all([send('sms', to, body), send('whatsapp', to, body)])
}

export async function notifyOutForDelivery(
  to: string,
  order: StatusSummary,
  locale: Locale,
): Promise<void> {
  const body = outForDeliveryBody(order, locale)
  await Promise.all([send('sms', to, body), send('whatsapp', to, body)])
}

export async function notifyDelivered(
  to: string,
  order: StatusSummary,
  locale: Locale,
): Promise<void> {
  const body = deliveredBody(order, locale)
  await Promise.all([send('sms', to, body), send('whatsapp', to, body)])
}

export async function notifyAdminNewOrder(order: OrderSummary): Promise<void> {
  if (!ADMIN_PHONE) return
  const body = adminAlertBody(order)
  await Promise.all([send('sms', ADMIN_PHONE, body), send('whatsapp', ADMIN_PHONE, body)])
}

// Ad-hoc message a customer over SMS + WhatsApp (whichever channel is
// configured). Used by the dashboard "Message customer" composer; both
// channels are silent no-ops when their env vars are missing.
export async function sendSms(to: string, body: string): Promise<void> {
  await Promise.all([send('sms', to, body), send('whatsapp', to, body)])
}
