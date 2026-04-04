'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  out_for_delivery: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  delivered: 'bg-green-500/15 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const statuses = ['', 'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled']

export default function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = useMemo(() => {
    return initialOrders.filter(o => {
      if (filterStatus && o.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(o.order_number || '').toLowerCase().includes(q) &&
          !(o.customer_name || '').toLowerCase().includes(q) &&
          !(o.customer_phone || '').includes(q)
        ) return false
      }
      return true
    })
  }, [initialOrders, search, filterStatus])

  // Revenue summary
  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0)
  const deliveredRevenue = filtered.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Orders</h1>
          <p className="text-gray-500 text-sm">{filtered.length} of {initialOrders.length} orders · Revenue: AED {totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order #, name, phone..." className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">All Statuses</option>
          {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        {(search || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterStatus('') }} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-16 text-center text-gray-600">No orders found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Slot</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((order: any) => {
                  const items = order.items || []
                  const waText = encodeURIComponent(`Hi ${order.customer_name}, your TMFoodStuff order #${order.order_number} `)
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-white font-bold hover:text-green-400 text-sm">{order.order_number}</Link>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-semibold">{order.customer_name || '—'}</p>
                        <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-300 text-sm">{order.delivery_area || '—'}</p>
                        <p className="text-gray-500 text-xs">{order.delivery_emirate}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-sm capitalize">{order.delivery_slot || '—'}</td>
                      <td className="px-5 py-4 text-gray-400 text-sm">{items.length} items</td>
                      <td className="px-5 py-4 text-green-400 font-black text-sm">AED {(order.total || 0).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColors[order.status] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                          {(order.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/orders/${order.id}`} className="text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">View</Link>
                          {order.customer_phone && (
                            <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors">WA</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
