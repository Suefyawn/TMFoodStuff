'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, Send, ExternalLink } from 'lucide-react'
import SubNav, { CUSTOMERS_SUBNAV } from '@/components/dashboard/SubNav'
import MessageComposer from './MessageComposer'

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400',
  confirmed: 'text-blue-400',
  processing: 'text-purple-400',
  out_for_delivery: 'text-orange-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [messageTarget, setMessageTarget] = useState<{ email?: string; phone?: string } | null>(null)
  const [tierFilter, setTierFilter] = useState<string>('')
  const [orderFilter, setOrderFilter] = useState<'' | 'has_orders' | 'no_orders' | 'repeat'>('')

  useEffect(() => {
    fetch('/api/dashboard/customers')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); return }
        setCustomers(Array.isArray(data) ? data : [])
      })
      .catch(() => setFetchError('Failed to load customers'))
      .finally(() => setLoading(false))
  }, [])

  const tierCounts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of customers) {
      const key = c.tier || '—'
      out[key] = (out[key] || 0) + 1
    }
    return out
  }, [customers])

  const filtered = customers.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !(c.name || '').toLowerCase().includes(q) &&
        !(c.phone || '').includes(search) &&
        !(c.email || '').toLowerCase().includes(q)
      ) return false
    }
    if (tierFilter && c.tier !== tierFilter) return false
    if (orderFilter === 'has_orders' && (c.totalOrders || 0) === 0) return false
    if (orderFilter === 'no_orders' && (c.totalOrders || 0) > 0) return false
    if (orderFilter === 'repeat' && (c.totalOrders || 0) < 2) return false
    return true
  })

  if (loading) return <div className="p-6 text-gray-500">Loading customers...</div>
  if (fetchError) return <div className="p-6 text-red-400">Error: {fetchError}</div>

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <SubNav items={CUSTOMERS_SUBNAV} />
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-gray-500 text-sm">{customers.length} unique customers</p>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..." className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
        </div>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">All tiers</option>
          {['bronze', 'silver', 'gold', 'platinum'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} ({tierCounts[t] || 0})</option>
          ))}
        </select>
        <select value={orderFilter} onChange={e => setOrderFilter(e.target.value as typeof orderFilter)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">Any order count</option>
          <option value="has_orders">Has ordered</option>
          <option value="repeat">Repeat customers</option>
          <option value="no_orders">Never ordered</option>
        </select>
        {(search || tierFilter || orderFilter) && (
          <button onClick={() => { setSearch(''); setTierFilter(''); setOrderFilter('') }} className="text-xs text-gray-500 hover:text-red-400">Clear</button>
        )}
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} of {customers.length}</span>
      </div>

      {messageTarget && (
        <MessageComposer
          email={messageTarget.email}
          phone={messageTarget.phone}
          onClose={() => setMessageTarget(null)}
        />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-600">No customers found</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((customer, i) => {
              const key = customer.phone || customer.email || customer.name
              const isExpanded = expanded === key
              return (
                <div key={i}>
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 cursor-pointer transition-colors" onClick={() => setExpanded(isExpanded ? null : key)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center text-base font-bold text-gray-500 shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-white font-semibold text-sm truncate">{customer.name}</p>
                          {customer.tier && customer.tier !== 'bronze' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/30 border border-amber-700/40 rounded px-1 py-0.5 capitalize">
                              {customer.tier}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{customer.phone}{customer.email && ` · ${customer.email}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                      {customer.id && (
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Open full profile"
                          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                        </Link>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setMessageTarget({ email: customer.email, phone: customer.phone }) }}
                        title="Message this customer"
                        className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      >
                        <Send size={14} aria-hidden="true" />
                      </button>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-sm">AED {customer.totalSpent.toFixed(2)}</p>
                        <p className="text-gray-600 text-xs">{customer.totalOrders} orders</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-gray-800/20">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Order History</p>
                      <div className="space-y-1">
                        {customer.orders.map((o: any) => (
                          <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="flex items-center justify-between py-2 px-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                            <div>
                              <span className="text-white text-sm font-medium">{o.order_number}</span>
                              <span className="text-gray-600 text-xs ml-3">{new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-semibold ${statusColors[o.status] || 'text-gray-400'}`}>{o.status}</span>
                              <span className="text-green-400 text-sm font-bold">AED {(o.total || 0).toFixed(2)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
