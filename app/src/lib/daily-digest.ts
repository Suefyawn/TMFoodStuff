// Daily operations digest emailed to ADMIN_EMAIL.
//
// Summarises the last 24h of activity: revenue, order count by status, top
// SKUs sold, low-stock products, and abandoned card orders. Designed to run
// after the points-expiry cron so we stay within the Hobby plan's 2-daily-
// cron limit (no separate schedule needed).
//
// No-ops when RESEND_API_KEY is missing. Errors are logged but never thrown
// so they don't take down the cron handler.
import type { SupabaseClient } from '@supabase/supabase-js'
import { getResend, FROM_EMAIL } from './email'
import { SITE_URL } from './site'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orders@tmfoodstuff.ae'
const LOW_STOCK_THRESHOLD = 10

interface OrderRow {
  id: number
  order_number: string | null
  status: string | null
  payment_status: string | null
  total: number | null
  created_at: string | null
}

interface OrderItemRow {
  product_id: number | null
  product_name: string | null
  quantity: number | null
  price_aed: number | null
  order_id: number | null
}

interface ProductRow {
  id: number
  name: string | null
  slug: string | null
  stock: number | null
  unit: string | null
}

interface DigestResult {
  sent: boolean
  reason?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmt(n: number): string {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function sendDailyDigest(supabase: SupabaseClient): Promise<DigestResult> {
  const resend = getResend()
  if (!resend) return { sent: false, reason: 'no_resend' }

  const now = new Date()
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sinceIso = since.toISOString()

  // Orders created in the last 24h.
  const { data: ordersRaw, error: ordersErr } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })

  if (ordersErr) {
    console.error('[daily-digest] orders query failed:', ordersErr.message)
    return { sent: false, reason: 'orders_query_failed' }
  }

  const orders = (ordersRaw || []) as OrderRow[]
  const completedOrders = orders.filter(o =>
    o.status !== 'cancelled' && o.payment_status !== 'cancelled'
  )
  const revenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    const k = o.status || 'unknown'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  // Top SKUs by qty over the same window.
  let topProducts: Array<{ name: string; qty: number; revenue: number }> = []
  if (completedOrders.length > 0) {
    const orderIds = completedOrders.map(o => o.id)
    const { data: itemsRaw } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, price_aed, order_id')
      .in('order_id', orderIds)
    const items = (itemsRaw || []) as OrderItemRow[]
    const agg = new Map<string, { qty: number; revenue: number }>()
    for (const it of items) {
      const name = it.product_name || `#${it.product_id}`
      const cur = agg.get(name) || { qty: 0, revenue: 0 }
      cur.qty += Number(it.quantity) || 0
      cur.revenue += (Number(it.quantity) || 0) * (Number(it.price_aed) || 0)
      agg.set(name, cur)
    }
    topProducts = Array.from(agg.entries())
      .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }

  // Low-stock products (active, stock below threshold).
  const { data: lowStockRaw } = await supabase
    .from('products')
    .select('id, name, slug, stock, unit')
    .eq('is_active', true)
    .lte('stock', LOW_STOCK_THRESHOLD)
    .order('stock', { ascending: true })
    .limit(15)
  const lowStock = (lowStockRaw || []) as ProductRow[]

  // Abandoned card orders pending for > 1h but < 24h (the cron cancels >24h).
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const { data: abandonedRaw } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, created_at')
    .eq('payment_method', 'card')
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo)
    .gte('created_at', sinceIso)
    .limit(10)
  const abandoned = (abandonedRaw || []) as OrderRow[]

  const dateStr = since.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const statusBadges = Object.entries(byStatus)
    .map(([k, n]) => `<span style="display:inline-block;background:#f3f4f6;color:#374151;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;margin:0 4px 4px 0">${escapeHtml(k)}: ${n}</span>`)
    .join('')

  const topRows = topProducts.length === 0
    ? '<tr><td style="padding:10px;color:#9ca3af;font-size:13px" colspan="3">No sales in the last 24h.</td></tr>'
    : topProducts.map(p => `
        <tr style="border-top:1px solid #f3f4f6">
          <td style="padding:8px 10px;font-size:13px;color:#111827">${escapeHtml(p.name)}</td>
          <td style="padding:8px 10px;font-size:13px;color:#374151;text-align:right">${p.qty}</td>
          <td style="padding:8px 10px;font-size:13px;color:#16a34a;text-align:right;font-weight:600">AED ${fmt(p.revenue)}</td>
        </tr>`).join('')

  const lowStockRows = lowStock.length === 0
    ? '<p style="margin:8px 0 0;color:#9ca3af;font-size:13px">All products above threshold. ✓</p>'
    : `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        ${lowStock.map(p => `
          <tr style="border-top:1px solid #f3f4f6">
            <td style="padding:6px 10px;font-size:13px;color:#111827">
              <a href="${SITE_URL}/product/${escapeHtml(p.slug || '')}" style="color:#16a34a;text-decoration:none">${escapeHtml(p.name || `#${p.id}`)}</a>
            </td>
            <td style="padding:6px 10px;font-size:13px;text-align:right;color:${(p.stock || 0) === 0 ? '#dc2626' : '#d97706'};font-weight:600">
              ${p.stock || 0} ${escapeHtml(p.unit || '')} left
            </td>
          </tr>`).join('')}
      </table>`

  const abandonedRows = abandoned.length === 0
    ? '<p style="margin:8px 0 0;color:#9ca3af;font-size:13px">None.</p>'
    : `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        ${abandoned.map(o => `
          <tr style="border-top:1px solid #f3f4f6">
            <td style="padding:6px 10px;font-size:13px;color:#111827">${escapeHtml(o.order_number || `#${o.id}`)}</td>
            <td style="padding:6px 10px;font-size:13px;text-align:right;color:#6b7280">AED ${fmt(Number(o.total) || 0)}</td>
          </tr>`).join('')}
      </table>`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.85">TM FoodStuff · Daily Digest</p>
          <h1 style="margin:0;font-size:22px;font-weight:900">${escapeHtml(dateStr)}</h1>
        </td></tr>

        <tr><td style="padding:24px 28px">
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px">
            <div style="flex:1;min-width:140px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#166534">Revenue (24h)</p>
              <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#15803d">AED ${fmt(revenue)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#16a34a">${completedOrders.length} completed</p>
            </div>
            <div style="flex:1;min-width:140px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#374151">All orders</p>
              <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#111827">${orders.length}</p>
              <div style="margin-top:6px">${statusBadges || '<span style="font-size:12px;color:#9ca3af">—</span>'}</div>
            </div>
          </div>
        </td></tr>

        <tr><td style="padding:0 28px 24px">
          <h2 style="margin:0 0 8px;font-size:14px;font-weight:800;color:#111827;text-transform:uppercase;letter-spacing:0.5px">Top products</h2>
          <table style="width:100%;border-collapse:collapse;background:#fafafa;border:1px solid #f3f4f6;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#f3f4f6">
              <th style="text-align:left;padding:8px 10px;font-size:11px;color:#6b7280;text-transform:uppercase">Product</th>
              <th style="text-align:right;padding:8px 10px;font-size:11px;color:#6b7280;text-transform:uppercase">Qty</th>
              <th style="text-align:right;padding:8px 10px;font-size:11px;color:#6b7280;text-transform:uppercase">Revenue</th>
            </tr></thead>
            <tbody>${topRows}</tbody>
          </table>
        </td></tr>

        <tr><td style="padding:0 28px 24px">
          <h2 style="margin:0 0 4px;font-size:14px;font-weight:800;color:#111827;text-transform:uppercase;letter-spacing:0.5px">Low stock</h2>
          <p style="margin:0;color:#6b7280;font-size:12px">Active products at or below ${LOW_STOCK_THRESHOLD} units.</p>
          ${lowStockRows}
        </td></tr>

        <tr><td style="padding:0 28px 24px">
          <h2 style="margin:0 0 4px;font-size:14px;font-weight:800;color:#111827;text-transform:uppercase;letter-spacing:0.5px">Abandoned card orders</h2>
          <p style="margin:0;color:#6b7280;font-size:12px">Pending payment &gt; 1h. Auto-cancelled after 24h.</p>
          ${abandonedRows}
        </td></tr>

        <tr><td style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb;text-align:center">
          <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px">Open dashboard</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `Daily digest · ${dateStr} · AED ${fmt(revenue)} · ${completedOrders.length} orders`,
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('[daily-digest] send failed:', err)
    return { sent: false, reason: 'send_failed' }
  }
}
