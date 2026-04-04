'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/customers').then(r => r.json()).then(data => {
      setCustomers(data)
      setLoading(false)
    })
  }, [])

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-6 text-gray-500">Loading customers...</div>

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-white">Customers</h1>
        <p className="text-gray-500 text-sm">{customers.length} unique customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..." className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
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
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg font-black text-gray-500">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{customer.name}</p>
                        <p className="text-gray-500 text-xs">{customer.phone} {customer.email && `· ${customer.email}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
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
