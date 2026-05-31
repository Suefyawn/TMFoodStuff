'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Repeat, Calendar, MapPin, Pause, Play, SkipForward, X, Loader2, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface SubItem {
  product_id: number
  name: string
  unit: string
  price_aed: number
  quantity: number
  emoji?: string
}

interface SubRow {
  id: number
  name: string | null
  items: SubItem[]
  frequency_days: number
  delivery_slot: string
  delivery_emirate: string
  delivery_area: string
  delivery_building: string | null
  status: 'active' | 'paused' | 'cancelled'
  next_delivery_date: string
  pause_until: string | null
  last_delivery_date: string | null
  total_orders: number
  created_at: string
  customer_name: string
  customer_phone: string
}

const FREQ_LABEL: Record<number, { en: string; ar: string }> = {
  7: { en: 'Every week', ar: 'كل أسبوع' },
  14: { en: 'Every 2 weeks', ar: 'كل أسبوعين' },
  30: { en: 'Every month', ar: 'كل شهر' },
}

const SLOT_LABEL: Record<string, { en: string; ar: string }> = {
  morning: { en: 'Morning (8AM-12PM)', ar: 'الصباح (8 ص - 12 ظ)' },
  afternoon: { en: 'Afternoon (12PM-5PM)', ar: 'الظهيرة (12 ظ - 5 م)' },
  evening: { en: 'Evening (5PM-10PM)', ar: 'المساء (5 م - 10 م)' },
}

export default function SubscriptionsClient({ subscriptions }: { subscriptions: SubRow[] }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const router = useRouter()
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function act(id: number, action: 'pause' | 'resume' | 'cancel' | 'skip_next') {
    if (action === 'cancel' && !confirm(isAr ? 'إلغاء الاشتراك نهائياً؟' : 'Cancel this subscription permanently?')) return
    setBusy(id)
    setError('')
    try {
      const res = await fetch(`/api/account/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setBusy(null)
    }
  }

  function fmtDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function itemsTotal(items: SubItem[]): number {
    return items.reduce((s, i) => s + i.price_aed * i.quantity, 0)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-forest-dark mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>

      <header className="flex items-start justify-between gap-3 mb-7 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-green-100 text-forest-dark flex items-center justify-center">
            <Repeat size={22} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              {isAr ? 'الاشتراكات' : 'Subscriptions'}
            </h1>
            <p className="text-sm text-gray-500">
              {isAr ? 'كرر طلباتك المفضلة تلقائياً.' : 'Have your favourites delivered on a schedule.'}
            </p>
          </div>
        </div>
        <Link
          href="/account/subscriptions/new"
          className="inline-flex items-center gap-1.5 bg-forest hover:bg-forest-light text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus size={14} aria-hidden="true" />
          {isAr ? 'اشتراك جديد' : 'New subscription'}
        </Link>
      </header>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5">{error}</div>
      )}

      {subscriptions.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
          <Sparkles size={28} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-gray-700 font-bold mb-1">{isAr ? 'لا توجد اشتراكات بعد' : 'No subscriptions yet'}</p>
          <p className="text-sm text-gray-500 mb-5">
            {isAr ? 'اضبط طلباً متكرراً لتوفير الوقت كل أسبوع.' : 'Set up a recurring order to save time every week.'}
          </p>
          <Link
            href="/account/subscriptions/new"
            className="inline-flex items-center gap-1.5 bg-forest hover:bg-forest-light text-white text-sm font-bold px-4 py-2.5 rounded-xl"
          >
            <Plus size={14} aria-hidden="true" />
            {isAr ? 'إنشاء اشتراك' : 'Create one'}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {subscriptions.map(s => {
            const total = itemsTotal(s.items)
            return (
              <li key={s.id} className={`bg-white border rounded-3xl shadow-sm overflow-hidden ${
                s.status === 'cancelled' ? 'border-gray-200 opacity-60' : s.status === 'paused' ? 'border-amber-200' : 'border-gray-100'
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-black text-gray-900 text-lg leading-tight">
                          {s.name || (isAr ? 'اشتراك' : 'Subscription')}
                        </h2>
                        {s.status === 'paused' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            {isAr ? 'متوقف' : 'Paused'}
                          </span>
                        )}
                        {s.status === 'cancelled' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
                            {isAr ? 'ملغى' : 'Cancelled'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Repeat size={11} aria-hidden="true" />
                          {FREQ_LABEL[s.frequency_days][isAr ? 'ar' : 'en']}
                        </span>
                        {s.status !== 'cancelled' && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={11} aria-hidden="true" />
                            {isAr ? 'التالي:' : 'Next:'} <span className="font-bold text-gray-700">{fmtDate(s.next_delivery_date)}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} aria-hidden="true" />
                          {s.delivery_area}, {s.delivery_emirate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900 tabular-nums">AED {total.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500">{isAr ? 'لكل طلب' : 'per order'}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="bg-gray-50 rounded-xl divide-y divide-gray-100 mb-4">
                    {s.items.map((it, i) => (
                      <li key={`${it.product_id}-${i}`} className="px-3 py-2 flex items-center justify-between gap-2 text-sm">
                        <span className="text-gray-700 truncate">
                          {it.emoji && <span className="mr-1.5">{it.emoji}</span>}
                          <span className="font-bold">{it.name}</span>
                          <span className="text-gray-400 text-xs ml-1">× {it.quantity}</span>
                        </span>
                        <span className="text-gray-500 text-xs tabular-nums whitespace-nowrap">AED {(it.price_aed * it.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>

                  {s.total_orders > 0 && (
                    <p className="text-[11px] text-gray-500 mb-3">
                      {s.total_orders} {isAr ? 'طلب تم تسليمه' : `order${s.total_orders === 1 ? '' : 's'} delivered`}
                      {s.last_delivery_date && ` · ${isAr ? 'آخر:' : 'last:'} ${fmtDate(s.last_delivery_date)}`}
                    </p>
                  )}

                  {/* Actions */}
                  {s.status !== 'cancelled' && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {s.status === 'active' && (
                        <>
                          <button
                            onClick={() => act(s.id, 'skip_next')}
                            disabled={busy === s.id}
                            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                          >
                            {busy === s.id ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <SkipForward size={11} aria-hidden="true" />}
                            {isAr ? 'تخطي التالي' : 'Skip next'}
                          </button>
                          <button
                            onClick={() => act(s.id, 'pause')}
                            disabled={busy === s.id}
                            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                          >
                            <Pause size={11} aria-hidden="true" />
                            {isAr ? 'إيقاف' : 'Pause'}
                          </button>
                        </>
                      )}
                      {s.status === 'paused' && (
                        <button
                          onClick={() => act(s.id, 'resume')}
                          disabled={busy === s.id}
                          className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-forest-dark border border-green-200 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                        >
                          {busy === s.id ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Play size={11} aria-hidden="true" />}
                          {isAr ? 'استئناف' : 'Resume'}
                        </button>
                      )}
                      <button
                        onClick={() => act(s.id, 'cancel')}
                        disabled={busy === s.id}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                      >
                        <X size={11} aria-hidden="true" />
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
