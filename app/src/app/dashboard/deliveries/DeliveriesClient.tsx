'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, MessageCircle, MapPin, Truck, CheckCircle2, Loader2, AlertCircle, Clock, ArrowRight, Navigation, Hand } from 'lucide-react'

interface OrderLite {
  id: number
  order_number: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  delivery_emirate: string | null
  delivery_area: string | null
  delivery_building: string | null
  delivery_makani: string | null
  delivery_notes: string | null
  delivery_slot: string | null
  delivery_date: string | null
  total_aed: number | null
  total: number | null
  payment_method: string | null
  payment_status: string | null
  driver_id?: string | null
}

interface Props {
  initialOrders: OrderLite[]
  errorMessage?: string
  // Truthy when the signed-in user is a driver — enables the
  // tap-to-claim button on unassigned cards.
  canClaim?: boolean
}

const SLOT_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 }

function todayIsoDubai(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())
}

function fullAddress(o: OrderLite): string {
  const parts = [
    o.delivery_building,
    o.delivery_area,
    o.delivery_emirate,
    o.delivery_makani ? `Makani ${o.delivery_makani}` : null,
  ].filter(Boolean)
  return parts.join(', ')
}

export default function DeliveriesClient({ initialOrders, errorMessage, canClaim = false }: Props) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState<'today' | 'all'>('today')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const today = todayIsoDubai()

  // Group by emirate so the driver can plan a route by neighbourhood.
  const groups = useMemo(() => {
    const list = filter === 'today'
      ? orders.filter(o => o.delivery_date === today)
      : orders
    const sorted = [...list].sort((a, b) => {
      const emirateA = a.delivery_emirate ?? ''
      const emirateB = b.delivery_emirate ?? ''
      if (emirateA !== emirateB) return emirateA.localeCompare(emirateB)
      const slotA = SLOT_ORDER[a.delivery_slot ?? ''] ?? 99
      const slotB = SLOT_ORDER[b.delivery_slot ?? ''] ?? 99
      return slotA - slotB
    })
    const out: Record<string, OrderLite[]> = {}
    for (const o of sorted) {
      const k = o.delivery_emirate || 'Unknown emirate'
      out[k] = out[k] || []
      out[k].push(o)
    }
    return out
  }, [orders, filter, today])

  const totalVisible = Object.values(groups).reduce((s, list) => s + list.length, 0)
  const todayCount = orders.filter(o => o.delivery_date === today).length

  async function claimOrder(orderId: number) {
    setBusyId(orderId)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not claim this order')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — try again')
    } finally {
      setBusyId(null)
    }
  }

  async function advance(orderId: number, to: 'out_for_delivery' | 'delivered') {
    setBusyId(orderId)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: to }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${res.status})`)
      }
      if (to === 'delivered') {
        // Delivered orders leave the queue.
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: to } : o))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-16">
      <header className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Delivery queue</p>
            <h1 className="text-white font-bold text-lg leading-tight">{totalVisible} stop{totalVisible === 1 ? '' : 's'}</h1>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white">← Dashboard</Link>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`flex-1 text-xs font-bold uppercase tracking-wider rounded-lg py-2 border transition-colors ${
              filter === 'today' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'
            }`}
          >
            Today ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 text-xs font-bold uppercase tracking-wider rounded-lg py-2 border transition-colors ${
              filter === 'all' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'
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

      <div className="px-3 sm:px-4 py-3 space-y-5">
        {totalVisible === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Truck size={36} className="mx-auto mb-3 text-emerald-600/60" aria-hidden="true" />
            <p className="text-sm">No deliveries waiting. Hand the driver a coffee.</p>
          </div>
        ) : (
          Object.entries(groups).map(([emirate, list]) => (
            <section key={emirate}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-2 px-1">
                {emirate} · {list.length} stop{list.length === 1 ? '' : 's'}
              </p>
              <div className="space-y-3">
                {list.map(o => <DeliveryCard key={o.id} order={o} busy={busyId === o.id} onAdvance={advance} canClaim={canClaim} onClaim={claimOrder} />)}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function DeliveryCard({ order, busy, onAdvance, canClaim, onClaim }: { order: OrderLite; busy: boolean; onAdvance: (id: number, to: 'out_for_delivery' | 'delivered') => void; canClaim?: boolean; onClaim?: (id: number) => void }) {
  const isOut = order.status === 'out_for_delivery'
  const total = Number(order.total_aed ?? order.total ?? 0)
  const collectCod = order.payment_method !== 'card' || order.payment_status !== 'paid'
  const addr = fullAddress(order)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`

  return (
    <article className={`bg-gray-900 border rounded-xl overflow-hidden ${isOut ? 'border-amber-700' : 'border-gray-800'}`}>
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono font-bold text-white text-sm">{order.order_number}</span>
            {isOut && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200 bg-amber-900/50 border border-amber-700 rounded px-1.5 py-0.5">On the way</span>}
            {!order.driver_id && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200 bg-blue-900/40 border border-blue-700 rounded px-1.5 py-0.5" title="Not assigned to a specific driver — anyone can take it">Unassigned</span>}
            {order.delivery_slot && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                <Clock size={10} aria-hidden="true" /> {order.delivery_slot}
              </span>
            )}
          </div>
          <p className="text-base font-bold text-gray-100 truncate">{order.customer_name || '—'}</p>
        </div>
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="text-xs text-gray-500 hover:text-white shrink-0 inline-flex items-center gap-1"
          title="Open admin order detail"
        >
          Detail <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>

      <div className="px-4 py-3 bg-gray-950/30 border-t border-gray-800">
        <div className="flex items-start gap-2 mb-3">
          <MapPin size={14} className="text-gray-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            {order.delivery_building && <p className="text-sm text-gray-200 font-bold leading-snug">{order.delivery_building}</p>}
            <p className="text-sm text-gray-300 leading-snug">
              {order.delivery_area}{order.delivery_emirate ? `, ${order.delivery_emirate}` : ''}
            </p>
            {order.delivery_makani && <p className="text-xs text-gray-500 mt-0.5 font-mono">Makani: {order.delivery_makani}</p>}
          </div>
        </div>

        {order.delivery_notes && (
          <div className="mb-3 bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mb-0.5">Customer note</p>
            <p className="text-xs text-amber-100 italic leading-snug">{order.delivery_notes}</p>
          </div>
        )}

        {/* Action chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700 rounded-lg px-3 py-2"
          >
            <Navigation size={12} aria-hidden="true" /> Navigate
          </a>
          {order.customer_phone && (
            <>
              <a
                href={`tel:${order.customer_phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2"
              >
                <Phone size={12} aria-hidden="true" /> Call
              </a>
              <a
                href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, this is TM FoodStuff. I'm on my way with your order ${order.order_number}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700 rounded-lg px-3 py-2"
              >
                <MessageCircle size={12} aria-hidden="true" /> WhatsApp
              </a>
            </>
          )}
        </div>

        {/* Collection callout for COD */}
        {collectCod && (
          <div className="mb-3 bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-200">Collect cash</span>
            <span className="text-lg font-bold text-amber-100 tabular-nums">AED {total.toFixed(2)}</span>
          </div>
        )}

        {/* Claim button — only visible to drivers on unassigned orders.
            Disappears the moment another driver grabs it (router.refresh
            on success pulls the fresh assignment state). */}
        {canClaim && !order.driver_id && (
          <button
            type="button"
            onClick={() => onClaim?.(order.id)}
            disabled={busy}
            className="w-full mb-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl py-3 transition-colors"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Hand size={14} aria-hidden="true" />}
            {busy ? 'Claiming…' : 'Claim this delivery'}
          </button>
        )}

        {/* Status advance buttons */}
        <div className="flex gap-2">
          {!isOut ? (
            <button
              type="button"
              onClick={() => onAdvance(order.id, 'out_for_delivery')}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl py-3 transition-colors"
            >
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Truck size={14} aria-hidden="true" />}
              {busy ? 'Updating…' : 'Start delivery'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAdvance(order.id, 'delivered')}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl py-3 transition-colors"
            >
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
              {busy ? 'Updating…' : 'Mark delivered'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
