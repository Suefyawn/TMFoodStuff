import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tmfoodstuff.ae'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@tmfoodstuff.ae'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orders@tmfoodstuff.ae'

function getResend() {
  if (!RESEND_API_KEY) return null
  return new Resend(RESEND_API_KEY)
}

// ─── Templates ────────────────────────────────────────────────────────────────

function orderConfirmationHtml(order: OrderEmailData): string {
  const slotLabels: Record<string, string> = {
    morning: 'Morning (8:00 AM – 12:00 PM)',
    afternoon: 'Afternoon (12:00 PM – 5:00 PM)',
    evening: 'Evening (5:00 PM – 10:00 PM)',
  }

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
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:28px;margin-bottom:4px">🥬</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px">TM FoodStuff</div>
          <div style="color:#bbf7d0;font-size:13px;margin-top:4px">Premium Fresh Produce · UAE</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px">

          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;text-align:center">✓</div>
            <h1 style="margin:16px 0 6px;font-size:22px;font-weight:900;color:#111827">Order Confirmed!</h1>
            <p style="margin:0;font-size:15px;color:#6b7280">Hi ${order.customer_name}, your order is on its way.</p>
          </div>

          <!-- Order number -->
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px">
            <div style="font-size:12px;color:#16a34a;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Order Number</div>
            <div style="font-size:24px;font-weight:900;color:#15803d;letter-spacing:-0.5px">#${order.order_number}</div>
          </div>

          <!-- Items -->
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px">Your Items</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              ${itemRows}
            </table>
          </div>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">Subtotal</td>
              <td style="padding:4px 0;font-size:14px;color:#374151;text-align:right">AED ${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">VAT (5%)</td>
              <td style="padding:4px 0;font-size:14px;color:#374151;text-align:right">AED ${order.vat.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">Delivery</td>
              <td style="padding:4px 0;font-size:14px;color:#16a34a;text-align:right;font-weight:600">${order.delivery_fee === 0 ? 'FREE 🎉' : 'AED ' + order.delivery_fee.toFixed(2)}</td>
            </tr>
            ${order.promo_discount > 0 ? `
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#6b7280">Promo (${order.promo_code})</td>
              <td style="padding:4px 0;font-size:14px;color:#16a34a;text-align:right;font-weight:600">-AED ${order.promo_discount.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0 4px;font-size:16px;font-weight:900;color:#111827;border-top:2px solid #e5e7eb">Total</td>
              <td style="padding:12px 0 4px;font-size:18px;font-weight:900;color:#15803d;text-align:right;border-top:2px solid #e5e7eb">AED ${order.total.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Delivery info -->
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
            <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px">Delivery Details</h3>
            <div style="font-size:14px;color:#374151;line-height:1.8">
              <div>📍 ${order.delivery_area}, ${order.delivery_emirate}${order.delivery_building ? ' · ' + order.delivery_building : ''}</div>
              <div>🕐 ${slotLabels[order.delivery_slot] || order.delivery_slot}</div>
              <div>💵 Cash on Delivery</div>
              ${order.delivery_notes ? `<div>📝 ${order.delivery_notes}</div>` : ''}
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:24px">
            <a href="https://wa.me/${order.whatsapp_number}" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
              💬 Message Us on WhatsApp
            </a>
            <p style="margin:12px 0 0;font-size:13px;color:#9ca3af">Questions about your order? We're always here.</p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">© 2026 TMFoodStuff · All prices include 5% UAE VAT</p>
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

      <div style="color:#4ade80;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">New Order</div>
      <div style="color:#ffffff;font-size:26px;font-weight:900;margin-bottom:4px">#${order.order_number}</div>
      <div style="color:#9ca3af;font-size:13px;margin-bottom:24px">${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })}</div>

      <!-- Customer -->
      <div style="background:#374151;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="color:#d1d5db;font-size:13px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Customer</div>
        <div style="color:#ffffff;font-size:15px;font-weight:600;margin-bottom:4px">${order.customer_name}</div>
        <div style="color:#9ca3af;font-size:14px">${order.customer_phone}</div>
        ${order.customer_email ? `<div style="color:#9ca3af;font-size:14px">${order.customer_email}</div>` : ''}
      </div>

      <!-- Delivery -->
      <div style="background:#374151;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="color:#d1d5db;font-size:13px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Delivery</div>
        <div style="color:#ffffff;font-size:14px;line-height:1.8">
          ${order.delivery_area}, ${order.delivery_emirate}${order.delivery_building ? ' · ' + order.delivery_building : ''}<br>
          Slot: <strong>${order.delivery_slot}</strong>
          ${order.delivery_notes ? '<br>Note: ' + order.delivery_notes : ''}
        </div>
      </div>

      <!-- Items -->
      <div style="background:#374151;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="color:#d1d5db;font-size:13px;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Items</div>
        <div style="color:#e5e7eb;font-size:14px;line-height:2">${itemList}</div>
      </div>

      <!-- Total -->
      <div style="background:#16a34a;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <span style="color:#ffffff;font-size:14px;font-weight:600">Total</span>
        <span style="color:#ffffff;font-size:22px;font-weight:900">AED ${order.total.toFixed(2)}</span>
      </div>

      <!-- Actions -->
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
}

export interface StatusUpdateEmailData {
  order_number: string
  customer_name: string
  customer_email: string
  delivery_slot: string
  total: number
  whatsapp_number: string
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendOrderConfirmation(order: OrderEmailData): Promise<void> {
  const resend = getResend()
  if (!resend || !order.customer_email) return

  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: order.customer_email,
      subject: `✅ Order Confirmed — #${order.order_number}`,
      html: orderConfirmationHtml(order),
    })
  } catch (err) {
    console.error('[Resend] Failed to send order confirmation:', err)
  }
}

export async function sendOutForDeliveryEmail(order: StatusUpdateEmailData): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const slotLabels: Record<string, string> = {
    morning: 'Morning (8:00 AM – 12:00 PM)',
    afternoon: 'Afternoon (12:00 PM – 5:00 PM)',
    evening: 'Evening (5:00 PM – 10:00 PM)',
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#ea580c;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:36px;margin-bottom:4px">🚚</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900">TM FoodStuff</div>
          <div style="color:#fed7aa;font-size:13px;margin-top:4px">Your order is on the way!</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111827;text-align:center">Out for Delivery 🚚</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;text-align:center">Hi ${order.customer_name}, your fresh produce is on its way to you!</p>
          <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px">
            <div style="font-size:12px;color:#ea580c;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Order</div>
            <div style="font-size:24px;font-weight:900;color:#c2410c">#${order.order_number}</div>
          </div>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;font-size:14px;color:#374151;line-height:1.8">
            <div>🕐 Expected delivery slot: <strong>${slotLabels[order.delivery_slot] || order.delivery_slot}</strong></div>
            <div>💰 Total: <strong>AED ${Number(order.total).toFixed(2)}</strong> (Cash on Delivery)</div>
          </div>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${SITE_URL}/track" style="display:inline-block;background:#ea580c;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:12px">
              📦 Track Your Order
            </a>
            <br>
            <a href="https://wa.me/${order.whatsapp_number}" style="display:inline-block;margin-top:10px;background:#25D366;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
              💬 Contact Us on WhatsApp
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TMFoodStuff · <a href="${SITE_URL}" style="color:#16a34a;text-decoration:none">${SITE_URL.replace('https://', '')}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: order.customer_email,
      subject: `🚚 Your order #${order.order_number} is out for delivery!`,
      html,
    })
  } catch (err) {
    console.error('[Resend] Failed to send out-for-delivery email:', err)
  }
}

export async function sendDeliveredEmail(order: StatusUpdateEmailData): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          <div style="font-size:36px;margin-bottom:4px">🥬</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900">TM FoodStuff</div>
          <div style="color:#bbf7d0;font-size:13px;margin-top:4px">Delivered — Enjoy your fresh produce!</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center">✓</div>
            <h1 style="margin:16px 0 6px;font-size:22px;font-weight:900;color:#111827">Order Delivered!</h1>
            <p style="margin:0;font-size:15px;color:#6b7280">Hi ${order.customer_name}, your fresh produce has arrived. Enjoy!</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px">
            <div style="font-size:12px;color:#16a34a;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Order</div>
            <div style="font-size:24px;font-weight:900;color:#15803d">#${order.order_number}</div>
          </div>
          <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:#374151;text-align:center;line-height:1.8">
            We hope you love everything you received. Fresh produce, delivered with care. 🌿
          </div>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${SITE_URL}/shop" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:10px">
              🛒 Shop Again
            </a>
            <br>
            <a href="https://wa.me/${order.whatsapp_number}" style="display:inline-block;margin-top:10px;background:#25D366;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
              💬 Leave Feedback on WhatsApp
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TMFoodStuff · <a href="${SITE_URL}" style="color:#16a34a;text-decoration:none">${SITE_URL.replace('https://', '')}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: order.customer_email,
      subject: `✅ Delivered! Your order #${order.order_number} has arrived`,
      html,
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
