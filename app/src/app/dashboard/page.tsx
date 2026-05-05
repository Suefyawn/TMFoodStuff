import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

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
    { data: lowStock },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('orders').select('total').gte('created_at', today.toISOString()),
    supabase.from('orders').select('total, status, created_at').gte('created_at', monthAgo.toISOString()),
    supabase.from('products').select('id, name, stock, emoji').eq('is_active', true).lt('stock', 10).order('stock').limit(10),
  ])

  const todayRevenue = (todayOrderDocs || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const weekRevenue = (monthlyOrders || [])
    .filter((o: any) => new Date(o.created_at) >= weekAgo)
    .reduce((sum: number, o: any) => sum + (o.total || 0), 0)

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
    recentOrders: recentOrders || [],
    dailyRevenue,
    statusCounts,
    lowStock: lowStock || [],
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-purple-500/15 text-purple-400',
  out_for_delivery: 'bg-orange-500/15 text-orange-400',
  delivered: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export default async function DashboardPage() {
  const stats = await getStats()
  const maxRevenue = Math.max(...stats.dailyRevenue.map(d => d.revenue), 1)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">TMFoodStuff Admin Overview</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/products" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors">
            + Add Product
          </Link>
          <Link href="/dashboard/orders" className="hidden sm:block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors">
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today Revenue', value: `AED ${stats.todayRevenue.toFixed(2)}`, sub: `${stats.todayOrders} orders today`, color: 'text-green-400' },
          { label: 'Week Revenue', value: `AED ${stats.weekRevenue.toFixed(2)}`, sub: 'Last 7 days', color: 'text-blue-400' },
          { label: 'Pending Orders', value: String(stats.pendingOrders), sub: `${stats.totalOrders} total`, color: stats.pendingOrders > 0 ? 'text-yellow-400' : 'text-gray-400' },
          { label: 'Active Products', value: String(stats.totalProducts), sub: 'in catalog', color: 'text-purple-400' },
        ].map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
            <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
            <p className="text-gray-600 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4">📊 Revenue (Last 30 Days)</h3>
          <div className="flex items-end gap-0.5 h-40">
            {stats.dailyRevenue.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-green-600/30 rounded-t transition-all hover:bg-green-600/60"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%` }}
                />
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {d.day} · AED {d.revenue.toFixed(0)} · {d.orders} order{d.orders !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600">{stats.dailyRevenue[0]?.day}</span>
            <span className="text-xs text-gray-600">Today</span>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4">⚠️ Low Stock Alerts</h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-gray-600 text-sm">All products well stocked ✅</p>
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-black">🛒 Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-green-400 text-sm font-bold hover:underline">View all →</Link>
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
                      <Link href={`/dashboard/orders/${o.id}`} className="text-white font-bold hover:text-green-400 text-sm">{o.order_number}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[o.status] || 'bg-gray-700 text-gray-400'}`}>
                        {o.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{o.customer_name || '—'} · {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm shrink-0">AED {(o.total || 0).toFixed(2)}</span>
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
                        <Link href={`/dashboard/orders/${o.id}`} className="text-white font-bold hover:text-green-400 text-sm">{o.order_number}</Link>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm">{o.customer_name || '—'}</td>
                      <td className="px-5 py-3 text-green-400 font-bold text-sm">AED {(o.total || 0).toFixed(2)}</td>
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
