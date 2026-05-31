// Full customer profile in the admin. Shows everything we know about
// the person in one place: contact, tier, marketing prefs, LTV stats,
// every order they've placed, addresses, points history, reviews,
// referrals, and an editable admin-notes field.
//
// Staff get read-only access. Admins get the editable controls
// (tier override + notes + delete).
import { createClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, Sparkles, Star, Gift, Repeat, Shield, Trash2 } from 'lucide-react'
import { getDashboardSession } from '@/lib/admin-auth'
import CustomerNotesEditor from './CustomerNotesEditor'
import CustomerTierEditor from './CustomerTierEditor'

export const dynamic = 'force-dynamic'

interface Order {
  id: number
  order_number: string
  status: string
  total_aed: number | null
  total: number | null
  created_at: string
  delivery_date: string | null
  payment_method: string | null
  payment_status: string | null
}

interface LedgerEntry {
  delta: number
  reason: string
  description: string | null
  created_at: string
}

interface Address {
  id: number
  label: string | null
  building: string | null
  area: string | null
  emirate: string | null
  makani: string | null
  is_default: boolean
}

interface ReviewRow {
  id: number
  rating: number
  title: string | null
  status: string
  created_at: string
  products: { name: string; slug: string } | Array<{ name: string; slug: string }> | null
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getDashboardSession()
  if (session.state !== 'ok') redirect('/dashboard/login')
  const isAdmin = session.role === 'admin'

  const { id } = await params
  const customerId = Number(id)
  if (!Number.isFinite(customerId)) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [
    { data: customer },
    { data: orders },
    { data: addresses },
    { data: ledger },
    { data: reviews },
    { count: referralsGiven },
    { count: referralsReceived },
  ] = await Promise.all([
    supabase.from('customers').select('*').eq('id', customerId).maybeSingle(),
    supabase.from('orders').select('id, order_number, status, total_aed, total, created_at, delivery_date, payment_method, payment_status').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(200),
    supabase.from('customer_addresses').select('*').eq('customer_id', customerId),
    supabase.from('customer_points_ledger').select('delta, reason, description, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(30),
    supabase.from('product_reviews').select('id, rating, title, status, created_at, products(name, slug)').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(20),
    supabase.from('customer_referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', customerId).eq('status', 'rewarded'),
    supabase.from('customer_referrals').select('id', { count: 'exact', head: true }).eq('referred_id', customerId),
  ])

  if (!customer) notFound()

  const orderList = (orders || []) as Order[]
  const nonCancelled = orderList.filter(o => o.status !== 'cancelled')
  const totalSpent = nonCancelled.reduce((s, o) => s + Number(o.total_aed ?? o.total ?? 0), 0)
  const aov = nonCancelled.length > 0 ? totalSpent / nonCancelled.length : 0
  const pointsBalance = (ledger || []).reduce((s, l) => s + Number(l.delta), 0)
  // The 30-row ledger window won't always reflect the *true* balance —
  // run a separate sum to be honest. Falls back to the windowed sum.
  const { data: balanceRow } = await supabase
    .from('customer_points_ledger')
    .select('delta')
    .eq('customer_id', customerId)
  const totalPoints = (balanceRow || []).reduce((s, l) => s + Number(l.delta), 0) || pointsBalance

  const TIER_LABEL: Record<string, { color: string; label: string }> = {
    bronze:   { color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', label: 'Bronze' },
    silver:   { color: 'bg-gray-700 border-gray-600 text-gray-100', label: 'Silver' },
    gold:     { color: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-200', label: 'Gold' },
    platinum: { color: 'bg-purple-900/40 border-purple-700/50 text-purple-200', label: 'Platinum' },
  }
  const tier = TIER_LABEL[customer.tier || 'bronze']

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl">
      <Link href="/dashboard/customers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-white">
        <ArrowLeft size={14} aria-hidden="true" /> All customers
      </Link>

      {/* Header */}
      <header className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{customer.full_name || 'Unnamed customer'}</h1>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${tier.color}`}>
                <Shield size={9} aria-hidden="true" /> {tier.label}
              </span>
              {!customer.is_active && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">inactive</span>}
              {customer.deleted_at && <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-900/40 border border-red-800 rounded px-1.5 py-0.5">deleted</span>}
            </div>
            <div className="flex gap-3 flex-wrap text-xs text-gray-400">
              <span className="inline-flex items-center gap-1"><Mail size={11} aria-hidden="true" /> {customer.email}</span>
              {customer.phone && <span className="inline-flex items-center gap-1"><Phone size={11} aria-hidden="true" /> {customer.phone}</span>}
              <span>Joined {new Date(customer.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              {customer.referral_code && <span className="font-mono text-gray-500">ref: {customer.referral_code}</span>}
            </div>
          </div>
          {isAdmin && !customer.deleted_at && (
            <CustomerTierEditor customerId={customer.id} current={customer.tier || 'bronze'} />
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={ShoppingBag} label="Orders" value={String(nonCancelled.length)} sub={`${orderList.length - nonCancelled.length} cancelled`} />
          <Stat icon={Sparkles} label="Lifetime value" value={`AED ${totalSpent.toFixed(2)}`} sub={`AOV ${aov.toFixed(2)}`} />
          <Stat icon={Star} label="Points balance" value={String(totalPoints)} />
          <Stat icon={Gift} label="Referrals" value={String(referralsGiven || 0)} sub={`${referralsReceived || 0} received`} />
        </div>

        {/* Marketing prefs (read-only here — customer controls these) */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex gap-3 flex-wrap text-[11px]">
          <span className="text-gray-500">Marketing:</span>
          <Pref label="Email" on={!!customer.marketing_email} />
          <Pref label="SMS" on={!!customer.marketing_sms} />
          <Pref label="Push" on={!!customer.marketing_push} />
        </div>
      </header>

      {/* Admin notes */}
      {isAdmin && !customer.deleted_at && (
        <CustomerNotesEditor customerId={customer.id} initial={customer.admin_notes || ''} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders */}
        <section className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-white font-bold inline-flex items-center gap-2"><ShoppingBag size={14} className="text-gray-400" aria-hidden="true" /> Orders</h2>
          </div>
          {orderList.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {orderList.map(o => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`} className="block px-5 py-3 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-white text-sm">{o.order_number}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}{o.status}
                          {' · '}{o.payment_method}
                        </p>
                      </div>
                      <p className="font-bold text-gray-300 tabular-nums">AED {Number(o.total_aed ?? o.total ?? 0).toFixed(2)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Side rail: addresses + reviews + recent points */}
        <aside className="space-y-4">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-bold mb-3 inline-flex items-center gap-2"><MapPin size={14} className="text-gray-400" aria-hidden="true" /> Addresses</h2>
            {(addresses || []).length === 0 ? (
              <p className="text-xs text-gray-500">No saved addresses.</p>
            ) : (
              <ul className="space-y-2">
                {(addresses as Address[]).map(a => (
                  <li key={a.id} className="text-xs">
                    <p className="text-gray-300 font-bold">
                      {a.label || 'Unnamed'} {a.is_default && <span className="text-emerald-400 ml-1">(default)</span>}
                    </p>
                    <p className="text-gray-500">{[a.building, a.area, a.emirate].filter(Boolean).join(', ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-bold mb-3 inline-flex items-center gap-2"><Star size={14} className="text-gray-400" aria-hidden="true" /> Recent reviews</h2>
            {(reviews || []).length === 0 ? (
              <p className="text-xs text-gray-500">No reviews yet.</p>
            ) : (
              <ul className="space-y-2">
                {((reviews || []) as ReviewRow[]).map(r => {
                  const prod = Array.isArray(r.products) ? r.products[0] : r.products
                  return (
                    <li key={r.id} className="text-xs">
                      <p className="text-gray-300 truncate"><span className="text-amber-400">{'★'.repeat(r.rating)}</span> {prod?.name}</p>
                      {r.title && <p className="text-gray-500 truncate">{r.title}</p>}
                      <p className="text-[10px] text-gray-600">{r.status} · {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-bold mb-3 inline-flex items-center gap-2"><Sparkles size={14} className="text-gray-400" aria-hidden="true" /> Recent points</h2>
            {(ledger || []).length === 0 ? (
              <p className="text-xs text-gray-500">No activity.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {((ledger || []) as LedgerEntry[]).map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-400 truncate">{l.reason.replace(/_/g, ' ')}</span>
                    <span className={`font-mono font-bold tabular-nums shrink-0 ${l.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {l.delta > 0 ? '+' : ''}{l.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof ShoppingBag; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
        <Icon size={10} aria-hidden="true" /> {label}
      </div>
      <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function Pref({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 ${on ? 'text-emerald-300' : 'text-gray-500'}`}>
      <span className={`w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-gray-600'}`} />
      {label}
    </span>
  )
}
