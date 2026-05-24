// Server-side helpers for the cart-recovery flow.
//
// The storefront pushes the customer's cart snapshot to /api/cart/sync as
// they shop. Hours later, if they haven't placed an order, the abandonment
// cron picks them up here and emails a recovery link. The link bypasses
// auth (the customer may be signed out by then) by carrying the cart token
// as a query param.
import type { SupabaseClient } from '@supabase/supabase-js'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

export const RECOVERY_PROMO_CODE = 'WELCOMEBACK10'
// How long a cart has to sit untouched before we consider it abandoned.
export const ABANDONMENT_WINDOW_HOURS = 4
// How often we re-pester the same customer about the same cart.
export const RECOVERY_COOLDOWN_HOURS = 24 * 7

export interface CartItemSnapshot {
  id: string
  name: string
  slug: string
  priceAED: number
  unit: string
  quantity: number
  imageUrl?: string
  emoji?: string
}

// Called after every successful order placement so the abandonment cron
// doesn't email a customer who just bought. Best-effort — never throws.
export async function clearCustomerCart(
  supabase: SupabaseClient,
  customerId: number,
): Promise<void> {
  try {
    await supabase
      .from('customer_carts')
      .update({
        items: [],
        subtotal_aed: 0,
        item_count: 0,
        recovered_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId)
  } catch (err) {
    console.error('[cart-recovery] clearCustomerCart failed:', err)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

interface RecoveryEmailArgs {
  toEmail: string
  toName: string | null
  items: CartItemSnapshot[]
  subtotalAed: number
  recoveryToken: string
  locale: 'en' | 'ar'
}

// The recovery email. Keeps the same shell as the broadcaster email — green
// brand stripe, friendly tone, big CTA. Lists the first 4 items so the
// customer recognises what they left behind.
export function buildRecoveryEmail(args: RecoveryEmailArgs): { subject: string; html: string } {
  const isAr = args.locale === 'ar'
  const cartUrl = `${SITE_URL}/cart?recover=${args.recoveryToken}`
  const visible = args.items.slice(0, 4)
  const remaining = Math.max(0, args.items.length - visible.length)

  const subject = isAr
    ? `سلتك بانتظارك — احصل على خصم 10٪`
    : `You left items in your cart — here's 10% off`

  const itemRows = visible.map(it => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
        <p style="margin:0;font-weight:700;color:#111827;font-size:14px">${escapeHtml(it.name)}</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:12px">${it.quantity} × ${escapeHtml(it.unit)}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#111827;font-size:14px;white-space:nowrap">
        AED ${(it.priceAED * it.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const hello = args.toName ? (isAr ? `مرحباً ${escapeHtml(args.toName.split(' ')[0])}،` : `Hi ${escapeHtml(args.toName.split(' ')[0])},`) : (isAr ? 'مرحباً،' : 'Hi there,')

  const intro = isAr
    ? 'لاحظنا أنك تركت بعض المنتجات الطازجة في سلتك. أكمل طلبك خلال 48 ساعة واستخدم الرمز <strong>WELCOMEBACK10</strong> للحصول على خصم 10٪.'
    : 'We noticed you left some fresh picks in your cart. Finish your order in the next 48 hours and use code <strong>WELCOMEBACK10</strong> for 10% off.'

  const cta = isAr ? 'إكمال طلبي ←' : 'Finish my order →'
  const moreLine = remaining > 0
    ? (isAr ? `<p style="margin:8px 0 0;color:#9ca3af;font-size:12px;text-align:right">و ${remaining} منتج${remaining === 1 ? '' : 'ات'} أخرى…</p>`
            : `<p style="margin:8px 0 0;color:#9ca3af;font-size:12px;text-align:right">and ${remaining} more item${remaining === 1 ? '' : 's'}…</p>`)
    : ''

  const html = `<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}"><body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
      <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:900;font-size:18px">TM FoodStuff</td></tr>
      <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65">
        <p style="margin:0 0 14px;font-size:16px;color:#111827">${hello}</p>
        <p style="margin:0 0 22px">${intro}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-top:2px solid #f3f4f6">
          ${itemRows}
        </table>
        ${moreLine}
        <p style="margin:18px 0 6px;text-align:right;color:#6b7280;font-size:13px">${isAr ? 'المجموع الفرعي:' : 'Subtotal:'}
          <span style="color:#111827;font-weight:700;font-size:15px"> AED ${args.subtotalAed.toFixed(2)}</span>
        </p>
        <p style="margin:24px 0;text-align:center">
          <a href="${cartUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:800;font-size:15px">${cta}</a>
        </p>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center">${isAr ? 'ينتهي العرض خلال 48 ساعة.' : 'Offer ends in 48 hours.'}</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:14px 28px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
        TM FoodStuff · <a href="${SITE_URL}" style="color:#16a34a;text-decoration:none">tmfoodstuff.ae</a>
        · <a href="${SITE_URL}/unsubscribe" style="color:#9ca3af;text-decoration:underline">${isAr ? 'إلغاء الاشتراك' : 'Unsubscribe'}</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`

  return { subject, html }
}

// Sweeps abandoned carts and fires recovery emails. Shared between the
// dedicated /api/cron/cart-abandonment route (so admins can trigger it
// manually) and the existing daily cleanup cron (so we don't need a third
// Vercel cron entry).
export async function sweepAbandonedCarts(
  supabase: SupabaseClient,
  options?: { batch?: number },
): Promise<{ scanned: number; sent: number; failed: number; skipped: number }> {
  const batch = options?.batch ?? 100
  const abandonedBefore = new Date(Date.now() - ABANDONMENT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  const cooldownBefore = new Date(Date.now() - RECOVERY_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('customer_carts')
    .select('customer_id, items, subtotal_aed, item_count, token, updated_at, last_recovery_email_at, customer:customer_id(email, full_name)')
    .gt('item_count', 0)
    .is('recovered_at', null)
    .lt('updated_at', abandonedBefore)
    .limit(batch)
  if (error) {
    console.error('[cart-recovery] sweep select failed:', error)
    return { scanned: 0, sent: 0, failed: 0, skipped: 0 }
  }

  const rows = ((data || []) as unknown as Array<{
    customer_id: number
    items: CartItemSnapshot[]
    subtotal_aed: number
    item_count: number
    token: string
    updated_at: string
    last_recovery_email_at: string | null
    customer: Array<{ email: string; full_name: string | null }> | null
  }>).map(r => ({
    ...r,
    customer: Array.isArray(r.customer) && r.customer[0] ? r.customer[0] : null,
  }))

  let sent = 0
  let failed = 0
  let skipped = 0
  const nowIso = new Date().toISOString()

  for (const r of rows) {
    if (!r.customer?.email) { skipped++; continue }
    if (r.last_recovery_email_at && r.last_recovery_email_at > cooldownBefore) { skipped++; continue }

    const ok = await sendRecoveryEmail({
      toEmail: r.customer.email,
      toName: r.customer.full_name,
      items: r.items,
      subtotalAed: Number(r.subtotal_aed),
      recoveryToken: r.token,
      locale: 'en',
    })

    if (ok) {
      sent++
      await supabase
        .from('customer_carts')
        .update({ last_recovery_email_at: nowIso })
        .eq('customer_id', r.customer_id)
    } else {
      failed++
    }
  }

  return { scanned: rows.length, sent, failed, skipped }
}

// Fires one recovery email. Returns true if Resend accepted it.
export async function sendRecoveryEmail(args: RecoveryEmailArgs): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false
  try {
    const { subject, html } = buildRecoveryEmail(args)
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: args.toEmail,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error('[cart-recovery] sendRecoveryEmail failed:', err)
    return false
  }
}
