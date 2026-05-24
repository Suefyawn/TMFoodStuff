'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CheckCircle2, Phone, Clock, MapPin, Package, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

interface Item {
  id?: number | string
  name?: string
  product_name?: string
  quantity?: number
  unit?: string
  price_aed?: number
}

interface OrderLite {
  id: number
  order_number: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  delivery_emirate: string | null
  delivery_area: string | null
  delivery_building: string | null
  delivery_slot: string | null
  delivery_date: string | null
  items: unknown
  total_aed: number | null
  total: number | null
  created_at: string
}

interface Props {
  initialOrders: OrderLite[]
  errorMessage?: string
}

const SLOT_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 }

function todayIso(): string {
  const d = new Date()
  // Use Asia/Dubai local date so "today" matches the customer-facing slot
  // calendar (we deliver in UAE time regardless of where the server is).
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(d)
}

function pickKey(orderId: number): string {
  return `picker:order:${orderId}`
}

function readPickedItems(orderId: number): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(pickKey(orderId))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writePickedItems(orderId: number, keys: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(pickKey(orderId), JSON.stringify(Array.from(keys)))
  } catch {
    // localStorage full / disabled — non-fatal, picker still works for the
    // current session.
  }
}

function clearPickedItems(orderId: number) {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(pickKey(orderId)) } catch {}
}

export default function PickerClient({ initialOrders, errorMessage }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState<'today' | 'all'>('today')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [picked, setPicked] = useState<Record<number, Set<string>>>({})
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Hydrate per-order checkbox state from localStorage on mount so an
  // interrupted picking session resumes where it stopped.
  useEffect(() => {
    const map: Record<number, Set<string>> = {}
    for (const o of initialOrders) map[o.id] = readPickedItems(o.id)
    setPicked(map)
  }, [initialOrders])

  const today = todayIso()

  const visibleOrders = useMemo(() => {
    const list = filter === 'today'
      ? orders.filter(o => o.delivery_date === today)
      : orders
    // Today first, then secondary sort by slot order (morning → evening) so
    // picking matches the driver's run.
    return [...list].sort((a, b) => {
      const dateA = a.delivery_date ?? ''
      const dateB = b.delivery_date ?? ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (SLOT_ORDER[a.delivery_slot ?? ''] ?? 99) - (SLOT_ORDER[b.delivery_slot ?? ''] ?? 99)
    })
  }, [orders, filter, today])

  function toggleItem(orderId: number, key: string) {
    setPicked(prev => {
      const next = new Set(prev[orderId] ?? [])
      if (next.has(key)) next.delete(key)
      else next.add(key)
      writePickedItems(orderId, next)
      return { ...prev, [orderId]: next }
    })
  }

  function markAll(orderId: number, items: Item[]) {
    const allKeys = items.map((it, i) => `${it.id ?? i}`)
    setPicked(prev => {
      const next = new Set(allKeys)
      writePickedItems(orderId, next)
      return { ...prev, [orderId]: next }
    })
  }

  async function markPacked(orderId: number) {
    setBusyOrderId(orderId)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'processing' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${res.status})`)
      }
      // Drop the order from the queue + clear the persisted checkbox state.
      clearPickedItems(orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setExpanded(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark packed')
    } finally {
      setBusyOrderId(null)
    }
  }

  const todayCount = orders.filter(o => o.delivery_date === today).length

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-16">
      <header className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Picking queue</p>
            <h1 className="text-white font-black text-lg leading-tight">{visibleOrders.length} order{visibleOrders.length === 1 ? '' : 's'}</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-gray-500 hover:text-white"
          >
            ← Dashboard
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`flex-1 text-xs font-bold uppercase tracking-wider rounded-lg py-2 border transition-colors ${
              filter === 'today'
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Today ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 text-xs font-bold uppercase tracking-wider rounded-lg py-2 border transition-colors ${
              filter === 'all'
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({orders.length})
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-4 mt-4 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-xl px-3 py-2.5">
          {errorMessage}
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="px-3 sm:px-4 py-3 space-y-3">
        {visibleOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CheckCircle2 size={36} className="mx-auto mb-3 text-green-600/60" aria-hidden="true" />
            <p className="text-sm">Nothing left to pick — nice work.</p>
          </div>
        ) : (
          visibleOrders.map(o => {
            const items = (Array.isArray(o.items) ? (o.items as Item[]) : []).filter(Boolean)
            const total = items.length
            const pickedSet = picked[o.id] ?? new Set<string>()
            const pickedCount = items.filter((it, i) => pickedSet.has(`${it.id ?? i}`)).length
            const allPicked = total > 0 && pickedCount === total
            const isExpanded = expanded === o.id
            const isToday = o.delivery_date === today

            return (
              <article
                key={o.id}
                className={`bg-gray-900 border rounded-2xl overflow-hidden ${
                  allPicked ? 'border-green-700' : 'border-gray-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left hover:bg-gray-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-black text-white text-sm">{o.order_number}</span>
                      {isToday && <span className="text-[9px] font-bold uppercase tracking-wider text-green-300 bg-green-900/40 border border-green-700 rounded px-1.5 py-0.5">Today</span>}
                      {o.delivery_slot && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock size={10} aria-hidden="true" />
                          {o.delivery_slot}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-200 truncate">{o.customer_name || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{o.delivery_area}{o.delivery_emirate ? `, ${o.delivery_emirate}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-black ${allPicked ? 'text-green-400' : 'text-gray-400'}`}>
                      {pickedCount}/{total}
                    </div>
                    {isExpanded
                      ? <ChevronUp size={16} className="text-gray-500 ml-auto mt-1" aria-hidden="true" />
                      : <ChevronDown size={16} className="text-gray-500 ml-auto mt-1" aria-hidden="true" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800 p-3 bg-gray-950/30">
                    <div className="space-y-2 mb-3">
                      {items.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No line items on this order.</p>
                      ) : (
                        items.map((it, i) => {
                          const key = `${it.id ?? i}`
                          const checked = pickedSet.has(key)
                          const name = it.product_name || it.name || `#${it.id ?? i}`
                          return (
                            <label
                              key={key}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-green-900/30 border-green-700 text-green-100'
                                  : 'bg-gray-900 border-gray-800 text-gray-200 hover:bg-gray-800/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleItem(o.id, key)}
                                className="w-5 h-5 accent-green-600 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm leading-tight ${checked ? 'line-through opacity-70' : ''}`}>{name}</p>
                                {(it.unit || it.quantity != null) && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {it.quantity ?? 1} × {it.unit || 'unit'}
                                  </p>
                                )}
                              </div>
                              {checked && <CheckCircle2 size={16} className="text-green-400 shrink-0" aria-hidden="true" />}
                            </label>
                          )
                        })
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {!allPicked && items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => markAll(o.id, items)}
                          className="text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5"
                        >
                          Tick all
                        </button>
                      )}
                      {o.customer_phone && (
                        <>
                          <a
                            href={`tel:${o.customer_phone.replace(/\D/g, '')}`}
                            className="text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5"
                          >
                            <Phone size={11} aria-hidden="true" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${o.customer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-green-300 bg-green-900/40 hover:bg-green-900/60 border border-green-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5"
                          >
                            WhatsApp
                          </a>
                        </>
                      )}
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5"
                      >
                        Order detail <ArrowRight size={11} aria-hidden="true" />
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => markPacked(o.id)}
                      disabled={!allPicked || busyOrderId === o.id}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm py-3 transition-colors ${
                        allPicked
                          ? 'bg-green-600 hover:bg-green-500 text-white'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      } ${busyOrderId === o.id ? 'opacity-60' : ''}`}
                    >
                      {busyOrderId === o.id
                        ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        : <Package size={14} aria-hidden="true" />}
                      {busyOrderId === o.id ? 'Marking packed…' : 'Mark packed → Processing'}
                    </button>
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
