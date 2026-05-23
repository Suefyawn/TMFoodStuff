import { Resend } from 'resend'
import { SITE_URL } from './site'
import type { Locale } from './locale'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@tmfoodstuff.ae'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orders@tmfoodstuff.ae'

function getResend() {
  if (!RESEND_API_KEY) return null
  return new Resend(RESEND_API_KEY)
}

// ─── Bilingual string tables ──────────────────────────────────────────────────

const SLOT_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    morning: 'Morning (8:00 AM – 12:00 PM)',
    afternoon: 'Afternoon (12:00 PM – 5:00 PM)',
    evening: 'Evening (5:00 PM – 10:00 PM)',
  },
  ar: {
    morning: 'الصباح (٨:٠٠ ص – ١٢:٠٠ م)',
    afternoon: 'الظهيرة (١٢:٠٠ م – ٥:٠٠ م)',
    evening: 'المساء (٥:٠٠ م – ١٠:٠٠ م)',
  },
}

const T = {
  en: {
    tagline: 'Premium Fresh Produce · UAE',
    confirmedHeading: 'Order Confirmed!',
    confirmedIntro: (name: string) => `Hi ${name}, your order is on its way.`,
    orderNumber: 'Order Number',
    yourItems: 'Your Items',
    subtotal: 'Subtotal',
    vat: 'VAT (5%)',
    delivery: 'Delivery',
    free: 'FREE 🎉',
    promoLabel: (code: string) => `Promo (${code})`,
    total: 'Total',
    deliveryDetails: 'Delivery Details',
    paymentCod: 'Cash on Delivery',
    paymentCard: 'Paid online',
    whatsappCta: '💬 Message Us on WhatsApp',
    whatsappCtaSub: "Questions about your order? We're always here.",
    footer: '© 2026 TMFoodStuff · All prices include 5% UAE VAT',
    outForDeliveryHeading: 'Out for Delivery 🚚',
    outForDeliveryIntro: (name: string) => `Hi ${name}, your fresh produce is on its way to you!`,
    orderLabel: 'Order',
    expectedSlot: 'Expected delivery slot',
    totalLabel: 'Total',
    trackOrder: '📦 Track Your Order',
    contactWa: '💬 Contact Us on WhatsApp',
    deliveredHeading: 'Order Delivered!',
    deliveredIntro: (name: string) => `Hi ${name}, your fresh produce has arrived. Enjoy!`,
    deliveredFooter: 'We hope you love everything you received. Fresh produce, delivered with care. 🌿',
    shopAgain: '🛒 Shop Again',
    feedbackWa: '💬 Leave Feedback on WhatsApp',
    backInStockHeading: 'Good news!',
    backInStockBody: (name: string) => `<strong>${name}</strong> is back in stock and ready to order.`,
    shopNow: 'Shop Now →',
    backInStockNote: 'Hurry — stock is limited and may sell out quickly.',
    subjectConfirmed: (n: string) => `✅ Order Confirmed — #${n}`,
    subjectOutForDelivery: (n: string) => `🚚 Your order #${n} is out for delivery!`,
    subjectDelivered: (n: string) => `✅ Delivered! Your order #${n} has arrived`,
    subjectBackInStock: (name: string) => `✅ ${name} is back in stock!`,
  },
  ar: {
    tagline: 'منتجات طازجة فاخرة · الإمارات',
    confirmedHeading: 'تم تأكيد طلبك!',
    confirmedIntro: (name: string) => `مرحباً ${name}، طلبك في الطريق إليك.`,
    orderNumber: 'رقم الطلب',
    yourItems: 'منتجاتك',
    subtotal: 'المجموع الفرعي',
    vat: 'ضريبة القيمة المضافة (٥٪)',
    delivery: 'التوصيل',
    free: 'مجاناً 🎉',
    promoLabel: (code: string) => `كود الخصم (${code})`,
    total: 'الإجمالي',
    deliveryDetails: 'تفاصيل التوصيل',
    paymentCod: 'الدفع عند الاستلام',
    paymentCard: 'تم الدفع إلكترونياً',
    whatsappCta: '💬 راسلنا على واتساب',
    whatsappCtaSub: 'أي استفسار عن طلبك؟ نحن هنا دائماً.',
    footer: '© ٢٠٢٦ TMFoodStuff · الأسعار شاملة ضريبة القيمة المضافة ٥٪',
    outForDeliveryHeading: 'في الطريق إليك 🚚',
    outForDeliveryIntro: (name: string) => `مرحباً ${name}، طلبك من المنتجات الطازجة في الطريق إليك!`,
    orderLabel: 'الطلب',
    expectedSlot: 'وقت التوصيل المتوقع',
    totalLabel: 'الإجمالي',
    trackOrder: '📦 تتبع طلبك',
    contactWa: '💬 تواصل معنا على واتساب',
    deliveredHeading: 'تم تسليم الطلب!',
    deliveredIntro: (name: string) => `مرحباً ${name}، وصلت منتجاتك الطازجة. نتمنى لك التوفيق!`,
    deliveredFooter: 'نتمنى أن تستمتع بكل ما تلقيت. منتجات طازجة تُسلَّم بعناية. 🌿',
    shopAgain: '🛒 تسوّق مرة أخرى',
    feedbackWa: '💬 شاركنا رأيك على واتساب',
    backInStockHeading: 'أخبار سارة!',
    backInStockBody: (name: string) => `<strong>${name}</strong> متوفر مجدداً وجاهز للطلب.`,
    shopNow: 'تسوّق الآن ←',
    backInStockNote: 'أسرع — الكميات محدودة وقد تنفد بسرعة.',
    subjectConfirmed: (n: string) => `✅ تم تأكيد طلبك — #${n}`,
    subjectOutForDelivery: (n: string) => `🚚 طلبك #${n} في الطريق إليك!`,
    subjectDelivered: (n: string) => `✅ تم التسليم! وصل طلبك #${n}`,
    subjectBackInStock: (name: string) => `✅ ${name} متوفر مجدداً!`,
  },
}

function dir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

// ─── Templates ────────────────────────────────────────────────────────────────

function orderConfirmationHtml(order: OrderEmailData, locale: Locale): string {
  const tr = T[locale]
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">
        ${item.emoji ? item.emoji + ' ' : ''}${item.name}
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;text-align:center">×${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;text-align:right;font-weight:600">
        AED ${(item.price_aed * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir(locale)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:28px;margin-bottom:4px">🥬</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px">TM FoodStuff</div>
          <div style="color:#bbf7d0;font-size:13px;margin-top:4px">${tr.tagline}</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;text-align:center">✓</div>
            <h1 style="margin:16px 0 6px;font-size:22px;font-weight:900;color:#111827">${tr.confirmedHeading}</h1>
            <p style="margin:0;font-size:15px;color:#6b7280">${tr.confirmedIntro(order.customer_name)}</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px">
            <div style="font-size:12px;color:#16a34a;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${tr.orderNumber}</div>
            <div style="font-size:24px;font-weight:900;color:#15803d;letter-spacing:-0.5px">#${order.order_number}</div>
          </div>
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px">${tr.yourItems}</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              ${itemRows}
            </table>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">${tr.subtotal}</td>
              <td style="padding:4px 0;font-size:14px;color:#374151;text-align:right">AED ${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">${tr.vat}</td>
              <td style="padding:4px 0;font-size:14px;color:#374151;text-align:right">AED ${order.vat.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">${tr.delivery}</td>
              <td style="padding:4px 0;font-size:14px;color:#16a34a;text-align:right;font-weight:600">${order.delivery_fee === 0 ? tr.free : 'AED ' + order.delivery_fee.toFixed(2)}</td>
            </tr>
            ${order.promo_discount > 0 ? `
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">${tr.promoLabel(order.promo_code || '')}</td>
              <td style="padding:4px 0;font-size:14px;color:#16a34a;text-align:right;font-weight:600">-AED ${order.promo_discount.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0 4px;font-size:16px;font-weight:900;color:#111827;border-top:2px solid #e5e7eb">${tr.total}</td>
              <td style="padding:12px 0 4px;font-size:18px;font-weight:900;color:#15803d;text-align:right;border-top:2px solid #e5e7eb">AED ${order.total.toFixed(2)}</td>
            </tr>
          </table>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
            <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px">${tr.deliveryDetails}</h3>
            <div style="font-size:14px;color:#374151;line-height:1.8">
              <div>📍 ${order.delivery_area}, ${order.delivery_emirate}${order.delivery_building ? ' · ' + order.delivery_building : ''}</div>
              <div>🕐 ${SLOT_LABELS[locale][order.delivery_slot] ?? order.delivery_slot}</div>
              <div>💵 ${order.paid_online ? tr.paymentCard : tr.paymentCod}</div>
              ${order.delivery_notes ? `<div>📝 ${order.delivery_notes}</div>` : ''}
            </div>
          </div>
          <div style="text-align:center;margin-bottom:24px">
            <a href="https://wa.me/${order.whatsapp_number}" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
              ${tr.whatsappCta}
            </a>
            <p style="margin:12px 0 0;font-size:13px;color:#9ca3af">${tr.whatsappCtaSub}</p>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">${tr.footer}</p>
          <p style="margin:0;font-size:12px;color:#9ca3af">
            <a href="${SITE_URL}" style="color:#16a34a;text-decoration:none">${SITE_URL.replace('https://', '')}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function adminOrderAlertHtml(order: OrderEmailData): string {
  const itemList = order.items.map(i =>
    `${i.emoji ? i.emoji + ' ' : ''}${i.name} ×${i.quantity} = AED ${(i.price_aed * i.quantity).toFixed(2)}`
  ).join('<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">
    <tr><td style="background:#1f2937;border-radius:16px;padding:28px">
      <div style="color:#4ade80;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">New Order${order.paid_online ? ' · Paid Online' : ''}</div>
      <div style="color:#ffffff;font-size:26px;font-weight:900;margin-bottom:4px">#${order.order_number}</div>
      <div style="color:#9ca3af;font-size:13px;margin-bottom:24px">${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })}</div>
      <div style="background:#374151;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="color:#d1d5db;font-size:13px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Customer</div>
        <div style="color:#ffffff;font-size:15px;font-weight:600;margin-bottom:4px">${order.customer_name}</div>
        <div style="color:#9ca3af;font-size:14px">${order.customer_phone}</div>
        ${order.customer_email ? `<div style="color:#9ca3af;font-size:14px">${order.customer_email}</div>` : ''}
      </div>
      <div style="background:#374151;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="color:#d1d5db;font-size:13px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Delivery</div>
        <div style="color:#ffffff;font-size:14px;line-height:1.8">
          ${order.delivery_area}, ${order.delivery_emirate}${order.delivery_building ? ' · ' + order.delivery_building : ''}<br>
          Slot: <strong>${order.delivery_slot}</strong>
          ${order.delivery_notes ? '<br>Note: ' + order.delivery_notes : ''}
        </div>
      </div>
      <div style="background:#374151;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="color:#d1d5db;font-size:13px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Items</div>
        <div style="color:#e5e7eb;font-size:14px;line-height:2">${itemList}</div>
      </div>
      <div style="background:#16a34a;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <span style="color:#ffffff;font-size:14px;font-weight:600">Total</span>
        <span style="color:#ffffff;font-size:22px;font-weight:900">AED ${order.total.toFixed(2)}</span>
      </div>
      <div style="text-align:center">
        <a href="${SITE_URL}/dashboard/orders" style="display:inline-block;background:#4ade80;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;margin-right:8px">
          View in Dashboard
        </a>
        <a href="https://wa.me/${order.customer_phone.replace(/\D/g, '')}" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
          WhatsApp Customer
        </a>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

function statusUpdateHtml(
  order: StatusUpdateEmailData,
  locale: Locale,
  variant: 'out_for_delivery' | 'delivered',
): string {
  const tr = T[locale]
  if (variant === 'out_for_delivery') {
    return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir(locale)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#ea580c;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:36px;margin-bottom:4px">🚚</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900">TM FoodStuff</div>
          <div style="color:#fed7aa;font-size:13px;margin-top:4px">${tr.tagline}</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111827;text-align:center">${tr.outForDeliveryHeading}</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;text-align:center">${tr.outForDeliveryIntro(order.customer_name)}</p>
          <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px">
            <div style="font-size:12px;color:#ea580c;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${tr.orderLabel}</div>
            <div style="font-size:24px;font-weight:900;color:#c2410c">#${order.order_number}</div>
          </div>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;font-size:14px;color:#374151;line-height:1.8">
            <div>🕐 ${tr.expectedSlot}: <strong>${SLOT_LABELS[locale][order.delivery_slot] ?? order.delivery_slot}</strong></div>
            <div>💰 ${tr.totalLabel}: <strong>AED ${Number(order.total).toFixed(2)}</strong> ${order.paid_online ? '' : `(${tr.paymentCod})`}</div>
          </div>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${SITE_URL}/track" style="display:inline-block;background:#ea580c;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:12px">
              ${tr.trackOrder}
            </a><br>
            <a href="https://wa.me/${order.whatsapp_number}" style="display:inline-block;margin-top:10px;background:#25D366;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
              ${tr.contactWa}
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">${tr.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir(locale)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:36px;margin-bottom:4px">🥬</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900">TM FoodStuff</div>
          <div style="color:#bbf7d0;font-size:13px;margin-top:4px">${tr.tagline}</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center">✓</div>
            <h1 style="margin:16px 0 6px;font-size:22px;font-weight:900;color:#111827">${tr.deliveredHeading}</h1>
            <p style="margin:0;font-size:15px;color:#6b7280">${tr.deliveredIntro(order.customer_name)}</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px">
            <div style="font-size:12px;color:#16a34a;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${tr.orderLabel}</div>
            <div style="font-size:24px;font-weight:900;color:#15803d">#${order.order_number}</div>
          </div>
          <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:#374151;text-align:center;line-height:1.8">
            ${tr.deliveredFooter}
          </div>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${SITE_URL}/shop" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:10px">
              ${tr.shopAgain}
            </a><br>
            <a href="https://wa.me/${order.whatsapp_number}" style="display:inline-block;margin-top:10px;background:#25D366;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
              ${tr.feedbackWa}
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">${tr.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderEmailData {
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_area: string
  delivery_emirate: string
  delivery_building?: string
  delivery_slot: string
  delivery_notes?: string
  delivery_fee: number
  subtotal: number
  vat: number
  promo_code?: string
  promo_discount: number
  total: number
  items: Array<{
    name: string
    emoji?: string
    quantity: number
    price_aed: number
  }>
  whatsapp_number: string
  paid_online?: boolean
}

export interface StatusUpdateEmailData {
  order_number: string
  customer_name: string
  customer_email: string
  delivery_slot: string
  total: number
  whatsapp_number: string
  paid_online?: boolean
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendOrderConfirmation(order: OrderEmailData, locale: Locale): Promise<void> {
  const resend = getResend()
  if (!resend || !order.customer_email) return
  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: order.customer_email,
      subject: T[locale].subjectConfirmed(order.order_number),
      html: orderConfirmationHtml(order, locale),
    })
  } catch (err) {
    console.error('[Resend] Failed to send order confirmation:', err)
  }
}

export async function sendOutForDeliveryEmail(order: StatusUpdateEmailData, locale: Locale): Promise<void> {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: order.customer_email,
      subject: T[locale].subjectOutForDelivery(order.order_number),
      html: statusUpdateHtml(order, locale, 'out_for_delivery'),
    })
  } catch (err) {
    console.error('[Resend] Failed to send out-for-delivery email:', err)
  }
}

export async function sendDeliveredEmail(order: StatusUpdateEmailData, locale: Locale): Promise<void> {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: order.customer_email,
      subject: T[locale].subjectDelivered(order.order_number),
      html: statusUpdateHtml(order, locale, 'delivered'),
    })
  } catch (err) {
    console.error('[Resend] Failed to send delivered email:', err)
  }
}

export async function sendAdminOrderAlert(order: OrderEmailData): Promise<void> {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🛒 New Order #${order.order_number} — AED ${order.total.toFixed(2)} (${order.customer_name})`,
      html: adminOrderAlertHtml(order),
    })
  } catch (err) {
    console.error('[Resend] Failed to send admin alert:', err)
  }
}

export async function sendBackInStockEmail(
  to: string,
  productName: string,
  productSlug: string,
  locale: Locale = 'en',
): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const tr = T[locale]
  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir(locale)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:36px;margin-bottom:4px">🥬</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900">TM FoodStuff</div>
          <div style="color:#bbf7d0;font-size:13px;margin-top:4px">${tr.tagline}</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🎉</div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111827">${tr.backInStockHeading}</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280">${tr.backInStockBody(productName)}</p>
          <a href="${SITE_URL}/product/${productSlug}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none">
            ${tr.shopNow}
          </a>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">${tr.backInStockNote}</p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">${tr.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to,
      subject: tr.subjectBackInStock(productName),
      html,
    })
  } catch (err) {
    console.error('[Resend] Failed to send back-in-stock email:', err)
  }
}
