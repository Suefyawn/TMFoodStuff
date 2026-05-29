// CSV exports for the accountant. Three reports, selectable via ?type=
//   - orders    one row per non-cancelled order in the period
//   - refunds   one row per refund event
//   - vat       per-emirate aggregate of subtotal + VAT (for filing)
//
// Period selected via ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive). Defaults
// to the current calendar month if not provided. Admin-only.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.join(',')
  const lines = rows.map(r => columns.map(c => csvCell(r[c])).join(','))
  return [header, ...lines].join('\n')
}

function todayIsoDubai(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())
}

function firstOfMonthDubai(): string {
  const d = new Date()
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date(d.getFullYear(), d.getMonth(), 1))
}

export async function GET(request: Request) {
  if (!(await requirePermission('accounting.export'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(request.url)
  const type = (url.searchParams.get('type') || 'orders') as 'orders' | 'refunds' | 'vat'
  const from = url.searchParams.get('from') || firstOfMonthDubai()
  const to = url.searchParams.get('to') || todayIsoDubai()

  // `to` is inclusive — turn it into the next-day boundary for less-than.
  const toExclusive = new Date(`${to}T00:00:00Z`)
  toExclusive.setDate(toExclusive.getDate() + 1)
  const toIso = toExclusive.toISOString()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let csv = ''
  let filename = ''

  if (type === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select('order_number, created_at, status, payment_method, payment_status, customer_name, customer_email, customer_phone, delivery_emirate, delivery_area, subtotal_aed, vat_aed, delivery_fee_aed, promo_discount_aed, total_aed, promo_code')
      .gte('created_at', `${from}T00:00:00Z`)
      .lt('created_at', toIso)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
      .limit(10000)
    csv = toCsv(
      (data || []).map(r => ({
        order_number: r.order_number,
        date: (r.created_at || '').slice(0, 10),
        status: r.status,
        payment_method: r.payment_method,
        payment_status: r.payment_status,
        customer_name: r.customer_name,
        customer_email: r.customer_email,
        customer_phone: r.customer_phone,
        emirate: r.delivery_emirate,
        area: r.delivery_area,
        subtotal_aed: Number(r.subtotal_aed || 0).toFixed(2),
        vat_aed: Number(r.vat_aed || 0).toFixed(2),
        delivery_fee_aed: Number(r.delivery_fee_aed || 0).toFixed(2),
        promo_discount_aed: Number(r.promo_discount_aed || 0).toFixed(2),
        total_aed: Number(r.total_aed || 0).toFixed(2),
        promo_code: r.promo_code,
      })),
      ['order_number', 'date', 'status', 'payment_method', 'payment_status', 'customer_name', 'customer_email', 'customer_phone', 'emirate', 'area', 'subtotal_aed', 'vat_aed', 'delivery_fee_aed', 'promo_discount_aed', 'total_aed', 'promo_code'],
    )
    filename = `orders_${from}_to_${to}.csv`
  } else if (type === 'refunds') {
    const { data } = await supabase
      .from('order_refunds')
      .select('id, amount_aed, reason, refund_type, payment_method, stripe_refund_id, restocked, created_at, created_by, order:order_id(order_number, customer_name, delivery_emirate)')
      .gte('created_at', `${from}T00:00:00Z`)
      .lt('created_at', toIso)
      .order('created_at', { ascending: true })
      .limit(10000)
    csv = toCsv(
      ((data || []) as unknown as Array<{
        id: number; amount_aed: number; reason: string | null; refund_type: string;
        payment_method: string; stripe_refund_id: string | null; restocked: boolean;
        created_at: string; created_by: string | null;
        order: Array<{ order_number: string; customer_name: string | null; delivery_emirate: string | null }> | null;
      }>).map(r => {
        const o = Array.isArray(r.order) && r.order[0] ? r.order[0] : null
        return {
          date: (r.created_at || '').slice(0, 10),
          refund_id: r.id,
          order_number: o?.order_number,
          customer_name: o?.customer_name,
          emirate: o?.delivery_emirate,
          amount_aed: Number(r.amount_aed || 0).toFixed(2),
          refund_type: r.refund_type,
          payment_method: r.payment_method,
          reason: r.reason,
          restocked: r.restocked ? 'yes' : 'no',
          stripe_refund_id: r.stripe_refund_id,
          actor: r.created_by,
        }
      }),
      ['date', 'refund_id', 'order_number', 'customer_name', 'emirate', 'amount_aed', 'refund_type', 'payment_method', 'reason', 'restocked', 'stripe_refund_id', 'actor'],
    )
    filename = `refunds_${from}_to_${to}.csv`
  } else if (type === 'vat') {
    // Pull every non-cancelled order in the period and aggregate per-emirate
    // subtotal + VAT in JS. The volume is bounded enough that PostgREST
    // grouping isn't worth the complexity here.
    const { data } = await supabase
      .from('orders')
      .select('delivery_emirate, subtotal_aed, vat_aed, total_aed, delivery_fee_aed, promo_discount_aed')
      .gte('created_at', `${from}T00:00:00Z`)
      .lt('created_at', toIso)
      .neq('status', 'cancelled')
      .limit(10000)
    const agg = new Map<string, { count: number; subtotal: number; vat: number; delivery: number; promo: number; total: number }>()
    for (const r of data || []) {
      const key = r.delivery_emirate || 'Unknown'
      const a = agg.get(key) || { count: 0, subtotal: 0, vat: 0, delivery: 0, promo: 0, total: 0 }
      a.count += 1
      a.subtotal += Number(r.subtotal_aed || 0)
      a.vat += Number(r.vat_aed || 0)
      a.delivery += Number(r.delivery_fee_aed || 0)
      a.promo += Number(r.promo_discount_aed || 0)
      a.total += Number(r.total_aed || 0)
      agg.set(key, a)
    }
    const rows = Array.from(agg.entries()).map(([emirate, a]) => ({
      emirate,
      orders: a.count,
      subtotal_aed: a.subtotal.toFixed(2),
      vat_aed: a.vat.toFixed(2),
      delivery_fee_aed: a.delivery.toFixed(2),
      promo_discount_aed: a.promo.toFixed(2),
      total_aed: a.total.toFixed(2),
    }))
    csv = toCsv(rows, ['emirate', 'orders', 'subtotal_aed', 'vat_aed', 'delivery_fee_aed', 'promo_discount_aed', 'total_aed'])
    filename = `vat_${from}_to_${to}.csv`
  } else {
    return NextResponse.json({ error: 'Unknown export type' }, { status: 400 })
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
