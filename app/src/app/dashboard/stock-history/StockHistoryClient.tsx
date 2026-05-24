'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Boxes, Search, X, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Row {
  id: number
  product_id: number
  delta: number
  before: number
  after: number
  reason: string
  actor_email: string | null
  order_id: number | null
  note: string | null
  created_at: string
  products: { name: string; slug: string } | null
}

const REASON_BADGE: Record<string, string> = {
  admin_set:        'bg-blue-500/15 text-blue-300 border-blue-500/30',
  admin_restock:    'bg-green-500/15 text-green-300 border-green-500/30',
  order_decrement:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

export default function StockHistoryClient({ initialRows }: { initialRows: Row[] }) {
  // Pre-fill search from ?product=slug so the products page can deep-link
  // straight to the filtered history for a single SKU.
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('product') || ''
  })
  const [reason, setReason] = useState('')

  const reasons = useMemo(() => Array.from(new Set(initialRows.map(r => r.reason))).sort(), [initialRows])

  const filtered = useMemo(() => {
    return initialRows.filter(r => {
      if (reason && r.reason !== reason) return false
      if (search) {
        const q = search.toLowerCase()
        const productName = (r.products?.name || '').toLowerCase()
        const productSlug = (r.products?.slug || '').toLowerCase()
        const actor = (r.actor_email || '').toLowerCase()
        if (!productName.includes(q) && !productSlug.includes(q) && !actor.includes(q)) return false
      }
      return true
    })
  }, [initialRows, search, reason])

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white inline-flex items-center gap-2">
            <Boxes size={20} className="text-gray-400" aria-hidden="true" /> Stock History
          </h1>
          <p className="text-gray-500 text-sm">{filtered.length} of {initialRows.length} entries · last 500</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden="true" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product, slug, actor email…"
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
          />
        </div>
        <select value={reason} onChange={e => setReason(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">All reasons</option>
          {reasons.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
        {(search || reason) && (
          <button onClick={() => { setSearch(''); setReason('') }} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
            <X size={12} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-gray-600 text-sm">No stock changes match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {filtered.map(r => (
              <li key={r.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  r.delta > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {r.delta > 0 ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowDownRight size={16} aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-200 truncate">{r.products?.name || `Product ${r.product_id}`}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${REASON_BADGE[r.reason] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {r.reason.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {r.before} → {r.after}
                    {r.actor_email && <> · {r.actor_email}</>}
                    {r.order_id && <> · order:{r.order_id}</>}
                    {r.note && <> · {r.note}</>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm font-black ${r.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.delta > 0 ? '+' : ''}{r.delta}
                  </span>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
