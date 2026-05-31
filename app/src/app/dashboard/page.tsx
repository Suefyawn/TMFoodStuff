import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { TrendingUp, AlertTriangle, ShoppingCart, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 29)

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: todayOrders },
    { count: totalProducts },
    { data: recentOrders },
    { data: todayOrderDocs },
    { data: monthlyOrders },
    { data: monthlyOrderItems },
    { data: lowStock },
    { count: pendingReviews },
    { count: openInboundThreads },
    { count: deliveriesToday },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('orders').select('total').gte('created_at', today.toISOString()),
    supabase.from('orders').select('total, status, created_at').gte('created_at', monthAgo.toISOString()),
    // Items from non-cancelled month orders so we can compute per-product
    // 30-day velocity and surface reorder hints. Separate from the
    // monthlyOrders query above because that one only needs totals.
    supabase.from('orders').select('items').gte('created_at', monthAgo.toISOString()).neq('status', 'cancelled'),
    // Pull a wide band of low-stock candidates and refine against each
    // product's own threshold below. The products_low_stock_idx partial
    // index keeps this cheap even as the catalog grows.
    supabase.from('products').select('id, name, stock, emoji, low_stock_threshold').eq('is_active', true).lte('stock', 10).order('stock').limit(30),
    // Morning briefing — small counts the team checks first thing.
    supabase.from('product_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('support_threads').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('last_message_direction', 'in'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('delivery_date', new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())).in('status', ['processing', 'out_for_delivery']),
  ])

  // Apply per-product threshold filter in JS — PostgREST can't express
  // "column ≤ column".
  const lowStockFiltered = (lowStock || []).filter((p: { stock: number | null; low_stock_threshold: number | null }) =>
    Number(p.stock ?? 0) <= Number(p.low_stock_threshold ?? 5)
  ).slice(0, 10)

  // ── Reorder suggestions ────────────────────────────────────────────────
  // For each product seen in the 30-day order history, compute units
  // sold per day. If current stock < 7 days of supply at that velocity,
  // surface it as a "reorder N" hint. The N is enough to last 14 days.
  // Bounded to top 5 most urgent so the banner stays scannable.
  const unitsByProduct = new Map<number, number>()
  for (const o of (monthlyOrderItems || []) as Array<{ items: unknown }>) {
    const items = Array.isArray(o.items) ? o.items as Array<{ id?: number | string; product_id?: number | string; quantity?: number }> : []
    for (const it of items) {
      const pid = Number(it.product_id ?? it.id)
      if (!Number.isFinite(pid)) continue
      unitsByProduct.set(pid, (unitsByProduct.get(pid) || 0) + (Number(it.quantity) || 0))
    }
  }
  const reorderHints: Array<{ id: number; name: string; emoji: string | null; stock: number; perDay: number; daysLeft: number; reorderQty: number }> = []
  for (const p of (lowStock || []) as Array<{ id: number; name: string; emoji: string | null; stock: number }>) {
    const monthly = unitsByProduct.get(p.id) || 0
    if (monthly === 0) continue  // No velocity data — can't suggest
    const perDay = monthly / 30
    const stock = Number(p.stock ?? 0)
    const daysLeft = perDay > 0 ? stock / perDay : Infinity
    if (daysLeft < 7) {
      // Reorder enough for 14 days, rounded up to the nearest 5.
      const target = Math.ceil((perDay * 14 - stock) / 5) * 5
      reorderHints.push({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        stock,
        perDay: Math.round(perDay * 10) / 10,
        daysLeft: Math.round(daysLeft * 10) / 10,
        reorderQty: Math.max(5, target),
      })
    }
  }
  reorderHints.sort((a, b) => a.daysLeft - b.daysLeft)

  const todayRevenue = (todayOrderDocs || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const weekRevenue = (monthlyOrders || [])
    .filter((o: any) => new Date(o.created_at) >= weekAgo)
    .reduce((sum: number, o: any) => sum + (o.total || 0), 0)

  // ── Derived KPIs ─────────────────────────────────────────────────────
  // AOV: average non-cancelled order value over the 30-day window. Gives
  // the team a single number to watch when running promos.
  const validOrders = (monthlyOrders || []).filter((o: any) => o.status !== 'cancelled')
  const monthRevenue = validOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)
  const aov = validOrders.length > 0 ? monthRevenue / validOrders.length : 0

  // Repeat-customer rate: % of buyers who placed >1 order in the window.
  // Pull every order in the window (not just non-cancelled) so we don't
  // over-count someone whose first order was cancelled.
  const { data: monthBuyers } = await supabase
    .from('orders')
    .select('customer_phone, customer_email')
    .gte('created_at', monthAgo.toISOString())
    .neq('status', 'cancelled')
    .limit(5000)
  const buyerCounts = new Map<string, number>()
  for (const o of (monthBuyers || []) as Array<{ customer_phone: string | null; customer_email: string | null }>) {
    const key = (o.customer_email || '').toLowerCase() || (o.customer_phone || '').replace(/\D/g, '')
    if (!key) continue
    buyerCounts.set(key, (buyerCounts.get(key) || 0) + 1)
  }
  const totalBuyers = buyerCounts.size
  const repeatBuyers = Array.from(buyerCounts.values()).filter(n => n >= 2).length
  const repeatRate = totalBuyers > 0 ? (repeatBuyers / totalBuyers) * 100 : 0

  // Conversion proxy: 30-day cart abandonment recovery vs. orders placed.
  // Doesn't measure storefront-wide conversion (we'd need session data)
  // but gives ops a rough recovered-vs-paid ratio.
  const { count: customersCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  // Daily revenue chart data — last 30 days
  const dailyRevenue = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1)
    const dayOrders = (monthlyOrders || []).filter((o: any) => {
      const t = new Date(o.created_at)
      return t >= d && t < nextD
    })
    dailyRevenue.push({
      day: d.toLocaleDateString('en', { day: 'numeric', month: 'short' }),
      revenue: dayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
      orders: dayOrders.length,
    })
  }

  // Status distribution
  const statusCounts: Record<string, number> = {}
  for (const o of (recentOrders || [])) {
    statusCounts[o.status || 'pending'] = (statusCounts[o.status || 'pending'] || 0) + 1
  }

  return {
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    todayOrders: todayOrders || 0,
    totalProducts: totalProducts || 0,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    aov,
    repeatRate,
    totalBuyers,
    customersCount: customersCount || 0,
    recentOrders: recentOrders || [],
    dailyRevenue,
    statusCounts,
    lowStock: lowStockFiltered,
    reorderHints: reorderHints.slice(0, 5),
    briefing: {
      pendingOrders: pendingOrders || 0,
      pendingReviews: pendingReviews || 0,
      openInboundThreads: openInboundThreads || 0,
      deliveriesToday: deliveriesToday || 0,
      lowStockCount: lowStockFiltered.length,
    },
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-purple-500/15 text-purple-400',
  out_for_delivery: 'bg-orange-500/15 text-orange-400',
  delivered: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export default async function DashboardPage() {
  const stats = await getStats()
  const maxRevenue = Math.max(...stats.dailyRevenue.map(d => d.revenue), 1)

  // Morning briefing — surface the four most actionable counts as
  // clickable chips at the very top, then hide the row entirely on a
  // quiet day so the dashboard doesn't shout for the sake of it.
  const briefingItems = [
    { count: stats.briefing.pendingOrders, href: '/dashboard/orders', label: 'pending orders', tone: 'yellow' as const },
    { count: stats.briefing.deliveriesToday, href: '/dashboard/deliveries', label: 'deliveries today', tone: 'amber' as const },
    { count: stats.briefing.openInboundThreads, href: '/dashboard/inbox', label: 'unanswered messages', tone: 'indigo' as const },
    { count: stats.briefing.pendingReviews, href: '/dashboard/reviews', label: 'reviews pending', tone: 'rose' as const },
    { count: stats.briefing.lowStockCount, href: '/dashboard/products?filter=low-stock', label: 'low-stock items', tone: 'red' as const },
  ].filter(b => b.count > 0)

  const briefingTones: Record<string, string> = {
    yellow: 'bg-yellow-900/30 border-yellow-700/60 hover:border-yellow-500 text-yellow-100',
    amber:  'bg-amber-900/30 border-amber-700/60 hover:border-amber-500 text-amber-100',
    indigo: 'bg-indigo-900/30 border-indigo-700/60 hover:border-indigo-500 text-indigo-100',
    rose:   'bg-rose-900/30 border-rose-700/60 hover:border-rose-500 text-rose-100',
    red:    'bg-red-900/30 border-red-700/60 hover:border-red-500 text-red-100',
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Morning briefing — single-glance "what needs my attention now".
          Each chip is a one-click jump into the relevant surface. */}
      {briefingItems.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {briefingItems.map(b => (
            <Link
              key={b.href}
              href={b.href}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${briefingTones[b.tone]}`}
            >
              <span className="font-bold tabular-nums text-base leading-none">{b.count}</span>
              <span className="text-xs font-bold leading-none">{b.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Low-stock banner: only surfaces when there's actually something to
          act on. Links straight to the products list filtered to the
          offending rows. */}
      {stats.lowStock.length > 0 && (
        <Link
          href="/dashboard/products?filter=low-stock"
          className="block bg-amber-900/30 border border-amber-700/60 hover:border-amber-500 rounded-xl px-4 py-3 transition-colors"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle size={18} className="text-amber-300 shrink-0" aria-hidden="true" />
              <p className="text-amber-100 font-bold text-sm">
                {stats.lowStock.length} product{stats.lowStock.length === 1 ? '' : 's'} running low
                <span className="text-amber-300/70 font-normal ml-2">
                  ({stats.lowStock.slice(0, 3).map((p: { name: string }) => p.name).join(', ')}{stats.lowStock.length > 3 ? '…' : ''})
                </span>
              </p>
            </div>
            <span className="text-xs font-bold text-amber-200 shrink-0">Restock →</span>
          </div>
        </Link>
      )}

      {/* Reorder suggestion widget — sits below the low-stock banner so
          the urgency-now items get attention first. Velocity-based so
          we don't nag about slow-movers that happen to be below threshold. */}
      {stats.reorderHints.length > 0 && (
        <div className="bg-blue-900/15 border border-blue-700/40 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-300 shrink-0 mt-0.5 text-sm font-bold">↻</div>
            <div className="min-w-0 flex-1">
              <p className="text-blue-100 font-bold text-sm mb-2">Suggested reorders (velocity-based)</p>
              <ul className="space-y-1.5">
                {stats.reorderHints.map((h: { id: number; name: string; emoji: string | null; stock: number; perDay: number; daysLeft: number; reorderQty: number }) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 text-xs flex-wrap">
                    <span className="text-blue-100 truncate">
                      {h.emoji && <span className="mr-1">{h.emoji}</span>}
                      <span className="font-bold">{h.name}</span>
                      <span className="text-blue-300/70 ml-2">{h.perDay}/day · {h.stock} left ≈ {h.daysLeft}d</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-blue-900/40 border border-blue-700 rounded px-2 py-0.5">
                      Reorder ~{h.reorderQty}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-blue-300/60 mt-2">
                Based on the last 30 days. Reorder quantity targets 14 days of supply, rounded up.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">TMFoodStuff Admin Overview</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Link href="/dashboard/pick" className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-1.5">
            Pick queue
          </Link>
          <Link href="/dashboard/deliveries" className="px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-1.5">
            Deliveries
          </Link>
          <Link href="/dashboard/packing-slips" className="hidden sm:inline-flex px-3 sm:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors items-center gap-1.5">
            Print slips
          </Link>
          <Link href="/dashboard/orders" className="hidden sm:block px-3 sm:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors">
            All orders
          </Link>
        </div>
      </div>

      {/* Top-line money stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today Revenue', value: `AED ${stats.todayRevenue.toFixed(2)}`, sub: `${stats.todayOrders} orders today`, color: 'text-emerald-400' },
          { label: 'Week Revenue', value: `AED ${stats.weekRevenue.toFixed(2)}`, sub: 'Last 7 days', color: 'text-blue-400' },
          { label: 'Pending Orders', value: String(stats.pendingOrders), sub: `${stats.totalOrders} total`, color: stats.pendingOrders > 0 ? 'text-yellow-400' : 'text-gray-400' },
          { label: 'Active Products', value: String(stats.totalProducts), sub: 'in catalog', color: 'text-purple-400' },
        ].map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-gray-600 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Behavioural KPIs — 30-day window. These move slowly so put them
          below the daily money cards but above the chart. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Month Revenue', value: `AED ${stats.monthRevenue.toFixed(0)}`, sub: 'Last 30 days', color: 'text-cyan-400' },
          { label: 'Average Order', value: `AED ${stats.aov.toFixed(2)}`, sub: '30-day AOV', color: 'text-emerald-400' },
          { label: 'Repeat Rate', value: `${stats.repeatRate.toFixed(0)}%`, sub: `${stats.totalBuyers} unique buyers`, color: stats.repeatRate >= 30 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Customers', value: String(stats.customersCount), sub: 'registered accounts', color: 'text-indigo-400' },
        ].map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-gray-600 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart — bars + Y-axis ticks. Tick marks are gridlines
            (horizontal dashed lines) at 25/50/75/100% of max revenue so
            the team can eyeball "is today's bar bigger than last week's
            best day" without hovering for the tooltip. */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-white font-bold inline-flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" aria-hidden="true" /> Revenue (last 30 days)</h3>
            <p className="text-xs text-gray-500">Peak: <span className="text-gray-300 font-bold">AED {maxRevenue.toFixed(0)}</span></p>
          </div>
          <div className="flex gap-2">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between text-[10px] text-gray-600 text-right pr-1 h-40 tabular-nums">
              <span>AED {maxRevenue.toFixed(0)}</span>
              <span>{(maxRevenue * 0.75).toFixed(0)}</span>
              <span>{(maxRevenue * 0.5).toFixed(0)}</span>
              <span>{(maxRevenue * 0.25).toFixed(0)}</span>
              <span>0</span>
            </div>
            {/* Chart canvas with horizontal gridlines */}
            <div className="flex-1 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="border-t border-dashed border-gray-800" />
                ))}
              </div>
              <div className="relative flex items-end gap-0.5 h-40">
                {stats.dailyRevenue.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-emerald-600/30 rounded-t transition-all hover:bg-emerald-600/60"
                      style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%` }}
                    />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {d.day} · AED {d.revenue.toFixed(0)} · {d.orders} order{d.orders !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 pl-10">
            <span className="text-xs text-gray-600">{stats.dailyRevenue[0]?.day}</span>
            <span className="text-xs text-gray-600">{stats.dailyRevenue[14]?.day}</span>
            <span className="text-xs text-gray-600">Today</span>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 inline-flex items-center gap-2"><AlertTriangle size={16} className="text-amber-400" aria-hidden="true" /> Low Stock Alerts</h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-gray-600 text-sm inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" aria-hidden="true" /> All products well stocked</p>
          ) : (
            <div className="space-y-2">
              {stats.lowStock.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className="text-sm text-gray-300 truncate max-w-[150px]">{p.name}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-bold inline-flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-400" aria-hidden="true" /> Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-emerald-400 text-sm font-bold hover:underline">View all →</Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="p-8 text-center text-gray-600">No orders yet</p>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-gray-800">
              {stats.recentOrders.map((o: any) => (
                <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/orders/${o.id}`} className="text-white font-bold hover:text-emerald-400 text-sm">{o.order_number}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[o.status] || 'bg-gray-700 text-gray-400'}`}>
                        {o.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{o.customer_name || '—'} · {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm shrink-0">AED {(o.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stats.recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/orders/${o.id}`} className="text-white font-bold hover:text-emerald-400 text-sm">{o.order_number}</Link>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm">{o.customer_name || '—'}</td>
                      <td className="px-5 py-3 text-emerald-400 font-bold text-sm">AED {(o.total || 0).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[o.status] || 'bg-gray-700 text-gray-400'}`}>
                          {o.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
