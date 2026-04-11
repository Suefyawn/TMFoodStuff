'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { dashboardFetch } from '@/lib/dashboard-fetch'
import { AlertCircle, Loader2 } from 'lucide-react'

type StatsPayload = {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  todayRevenue: number
  dailyRevenue: { day: string; revenue: number; orders: number }[]
  statusCounts: Record<string, number>
  topSelling: { name: string; qty: number; revenue: number }[]
  lowStockProducts: { id: number; name: string; stock: number; emoji: string }[]
  recentOrders: any[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-purple-500/15 text-purple-400',
  out_for_delivery: 'bg-orange-500/15 text-orange-400',
  delivered: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export default function DashboardOverviewClient() {
  const [stats, setStats] = useState<StatsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    dashboardFetch<StatsPayload>('/api/dashboard/stats').then(r => {
      if (cancelled) return
      if (r.ok === false) {
        setError(r.error)
        setStats(null)
      } else {
        setStats(r.data)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm">Loading overview…</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold">Could not load overview</p>
            <p className="text-sm mt-1 opacity-90">{error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    )
  }

  const maxRevenue = Math.max(...stats.dailyRevenue.map(d => d.revenue), 1)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Overview</h1>
          <p className="text-gray-500 text-sm">Sales and inventory at a glance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/products" className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors text-center">
            Products
          </Link>
          <Link href="/dashboard/orders" className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors text-center">
            Orders
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Today revenue', value: `AED ${stats.todayRevenue.toFixed(2)}`, sub: 'UTC day window', color: 'text-green-400' },
          { label: '7-day revenue', value: `AED ${stats.totalRevenue.toFixed(2)}`, sub: 'Rolling week', color: 'text-blue-400' },
          { label: 'Pending orders', value: String(stats.pendingOrders), sub: `${stats.totalOrders} total`, color: stats.pendingOrders > 0 ? 'text-yellow-400' : 'text-gray-400' },
          { label: 'Active products', value: String(stats.activeProducts), sub: `${stats.totalProducts} in catalog`, color: 'text-purple-400' },
        ].map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
            <p className={`text-xl sm:text-2xl font-black ${card.color}`}>{card.value}</p>
            <p className="text-gray-600 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-black mb-4">Revenue (last 7 days)</h2>
          <div className="flex items-end gap-2 h-40">
            {stats.dailyRevenue.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] sm:text-xs text-gray-500 truncate w-full text-center">{d.revenue > 0 ? `${d.revenue.toFixed(0)}` : ''}</span>
                <div
                  className="w-full bg-green-600/30 rounded-t-lg hover:bg-green-600/50 relative group min-h-[4px]"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    AED {d.revenue.toFixed(2)} · {d.orders} orders
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-600 font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-black mb-4">Low stock</h2>
          {(stats.lowStockProducts || []).length === 0 ? (
            <p className="text-gray-600 text-sm">Nothing critical</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm border-b border-gray-800 last:border-0 pb-2 last:pb-0">
                  <span className="text-gray-300 truncate"><span className="mr-1">{p.emoji}</span>{p.name}</span>
                  <span className={`text-xs font-bold flex-shrink-0 ${p.stock === 0 ? 'text-red-400' : 'text-yellow-400'}`}>{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-black">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-green-400 text-sm font-bold hover:underline">View all</Link>
        </div>
        {(stats.recentOrders || []).length === 0 ? (
          <p className="p-8 text-center text-gray-600 text-sm">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${o.id}`} className="text-white font-bold text-sm hover:text-green-400">{o.order_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{o.customer_full_name || o.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-green-400 font-bold text-sm">AED {Number(o.total_aed ?? o.total ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[o.status] || 'bg-gray-700 text-gray-400'}`}>
                        {(o.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {o.created_at ? new Date(o.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
