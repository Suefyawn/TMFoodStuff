'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Download, Calendar, CheckSquare, Square, Loader2 } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

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
  const router = useRouter()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmirate, setFilterEmirate] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // Selection state for bulk actions. Set of order ids — the checkboxes
  // in the table sync with this.
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  // Unique emirates seen across all orders — populates the filter dropdown.
  const emirates = useMemo(() => {
    const s = new Set<string>()
    for (const o of initialOrders) if (o.delivery_emirate) s.add(o.delivery_emirate)
    return Array.from(s).sort()
  }, [initialOrders])

  const filtered = useMemo(() => {
    const fromTs = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : null
    // Inclusive end-of-day for the upper bound.
    const toTs = toDate ? new Date(toDate + 'T23:59:59').getTime() : null
    return initialOrders.filter(o => {
      if (filterStatus && o.status !== filterStatus) return false
      if (filterEmirate && o.delivery_emirate !== filterEmirate) return false
      if (fromTs || toTs) {
        const t = o.created_at ? new Date(o.created_at).getTime() : 0
        if (fromTs && t < fromTs) return false
        if (toTs && t > toTs) return false
      }
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
  }, [initialOrders, search, filterStatus, filterEmirate, fromDate, toDate])

  // Bulk action handler — calls PATCH /api/dashboard/orders for each
  // selected id. Errors are collected but never block sibling updates.
  async function bulkSetStatus(status: string) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const ok = await confirm({
      title: `Mark ${ids.length} order${ids.length === 1 ? '' : 's'} as ${status.replace(/_/g, ' ')}?`,
      message: 'Customers will get the same status-change notifications as a single-order update. Hard to undo at scale.',
      confirmLabel: `Mark ${ids.length}`,
      destructive: status === 'cancelled',
    })
    if (!ok) return
    setBulkBusy(true)
    try {
      await Promise.all(ids.map(id =>
        fetch('/api/dashboard/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        }).catch(() => undefined)
      ))
      setSelected(new Set())
      router.refresh()
    } finally {
      setBulkBusy(false)
    }
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(o => o.id)))
    }
  }
  function toggleOne(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Revenue summary
  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0)

  function exportCsv() {
    const headers = [
      'order_number', 'created_at', 'status', 'payment_method', 'payment_status',
      'customer_name', 'customer_phone', 'customer_email',
      'delivery_emirate', 'delivery_area', 'delivery_building', 'delivery_slot',
      'subtotal_aed', 'vat_aed', 'delivery_fee_aed', 'promo_code', 'promo_discount_aed', 'total_aed', 'item_count',
    ]
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v)
      // RFC 4180: wrap in quotes if the value contains comma, quote, or newline; double existing quotes.
      return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = filtered.map(o => {
      const items = Array.isArray(o.items) ? o.items : []
      return [
        o.order_number, o.created_at, o.status, o.payment_method, o.payment_status,
        o.customer_name, o.customer_phone, o.customer_email,
        o.delivery_emirate, o.delivery_area, o.delivery_building, o.delivery_slot,
        o.subtotal_aed ?? o.subtotal, o.vat_aed ?? o.vat,
        o.delivery_fee_aed ?? o.delivery_fee, o.promo_code,
        o.promo_discount_aed ?? o.promo_discount, o.total_aed ?? o.total,
        items.length,
      ].map(escape).join(',')
    })
    const csv = [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tmfoodstuff-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-500 text-sm">{filtered.length} of {initialOrders.length} orders · Revenue: AED {totalRevenue.toFixed(2)}</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Download size={14} aria-hidden="true" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order #, name, phone..." className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">All Statuses</option>
          {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        {emirates.length > 0 && (
          <select value={filterEmirate} onChange={e => setFilterEmirate(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
            <option value="">All Emirates</option>
            {emirates.map(em => <option key={em} value={em}>{em}</option>)}
          </select>
        )}
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm">
          <Calendar size={14} className="text-gray-500" aria-hidden="true" />
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            aria-label="From date"
            style={{ colorScheme: 'dark' }}
            className="bg-transparent text-gray-300 focus:outline-none w-[120px]"
          />
          <span className="text-gray-600">→</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            aria-label="To date"
            style={{ colorScheme: 'dark' }}
            className="bg-transparent text-gray-300 focus:outline-none w-[120px]"
          />
        </div>
        {(search || filterStatus || fromDate || toDate) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterEmirate(''); setFromDate(''); setToDate('') }}
            className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
          >
            <X size={12} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {/* Bulk action bar — appears when rows are checked. Sticky-ish:
          inside the page flow but visually prominent. */}
      {selected.size > 0 && (
        <div className="bg-green-900/20 border border-green-600/40 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-bold text-green-200">
            {selected.size} order{selected.size === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {(['confirmed', 'processing', 'out_for_delivery', 'delivered'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => bulkSetStatus(s)}
                disabled={bulkBusy}
                className="text-xs font-bold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 disabled:opacity-60"
              >
                Mark {s.replace(/_/g, ' ')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => bulkSetStatus('cancelled')}
              disabled={bulkBusy}
              className="text-xs font-bold text-red-300 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 rounded-lg px-3 py-1.5 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
          {bulkBusy && <Loader2 size={14} className="animate-spin text-green-400 ml-auto" aria-hidden="true" />}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={bulkBusy}
            className="text-xs text-gray-400 hover:text-white font-bold ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-16 text-center text-gray-600">No orders found</p>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-gray-800">
              {filtered.map((order: any) => {
                const items = order.items || []
                const slotMap: Record<string, string> = { morning: '8AM–12PM', afternoon: '12PM–5PM', evening: '5PM–10PM' }
                const waText = encodeURIComponent(
                  `Hi ${order.customer_name || 'there'}! 👋\n` +
                  `Your TMFoodStuff order *#${order.order_number}* has been received.\n` +
                  `📦 ${items.length} item${items.length !== 1 ? 's' : ''} · AED ${(order.total || 0).toFixed(2)}\n` +
                  `🕐 Delivery slot: ${slotMap[order.delivery_slot] || order.delivery_slot || '—'}\n` +
                  `We'll be in touch shortly. Thank you! 🥦`
                )
                return (
                  <div key={order.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/dashboard/orders/${order.id}`} className="text-white font-bold hover:text-green-400 text-sm">{order.order_number}</Link>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0 ${statusColors[order.status] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                        {(order.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-semibold">{order.customer_name || '—'}</p>
                        <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                      </div>
                      <span className="text-green-400 font-bold text-sm">AED {(order.total || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {order.delivery_area || '—'}, {order.delivery_emirate} · {slotMap[order.delivery_slot] || order.delivery_slot || '—'} · {items.length} items
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">View</Link>
                      {order.customer_phone && (
                        <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors">WhatsApp</a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-3 py-3 w-10">
                      <button type="button" onClick={toggleAll} aria-label="Toggle all" className="text-gray-500 hover:text-white">
                        {selected.size === filtered.length && filtered.length > 0
                          ? <CheckSquare size={16} className="text-green-400" aria-hidden="true" />
                          : <Square size={16} aria-hidden="true" />}
                      </button>
                    </th>
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
                    const slotMap: Record<string, string> = { morning: '8AM–12PM', afternoon: '12PM–5PM', evening: '5PM–10PM' }
                    const waText = encodeURIComponent(
                      `Hi ${order.customer_name || 'there'}! 👋\n` +
                      `Your TMFoodStuff order *#${order.order_number}* has been received.\n` +
                      `📦 ${items.length} item${items.length !== 1 ? 's' : ''} · AED ${(order.total || 0).toFixed(2)}\n` +
                      `🕐 Delivery slot: ${slotMap[order.delivery_slot] || order.delivery_slot || '—'}\n` +
                      `We'll be in touch shortly. Thank you! 🥦`
                    )
                    return (
                      <tr key={order.id} className={`hover:bg-gray-800/30 transition-colors ${selected.has(order.id) ? 'bg-green-900/10' : ''}`}>
                        <td className="px-3 py-4 w-10">
                          <button type="button" onClick={() => toggleOne(order.id)} aria-label="Select order" className="text-gray-500 hover:text-white">
                            {selected.has(order.id)
                              ? <CheckSquare size={16} className="text-green-400" aria-hidden="true" />
                              : <Square size={16} aria-hidden="true" />}
                          </button>
                        </td>
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
                        <td className="px-5 py-4 text-green-400 font-bold text-sm">AED {(order.total || 0).toFixed(2)}</td>
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
          </>
        )}
      </div>
    </div>
  )
}
