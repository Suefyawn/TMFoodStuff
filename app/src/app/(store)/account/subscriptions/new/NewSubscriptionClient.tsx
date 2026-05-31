'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Minus, Search, Loader2, AlertCircle, Repeat } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface Product {
  id: number
  name_en: string | null
  name_ar: string | null
  unit: string | null
  price_aed: number | null
  emoji: string | null
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

interface Props {
  products: Product[]
  addresses: Address[]
  defaultName: string
  defaultPhone: string
}

const FREQ_OPTIONS = [
  { days: 7, en: 'Every week', ar: 'كل أسبوع', desc: { en: '52 deliveries/year', ar: '٥٢ توصيلة/سنة' } },
  { days: 14, en: 'Every 2 weeks', ar: 'كل أسبوعين', desc: { en: '26 deliveries/year', ar: '٢٦ توصيلة/سنة' } },
  { days: 30, en: 'Every month', ar: 'كل شهر', desc: { en: '12 deliveries/year', ar: '١٢ توصيلة/سنة' } },
] as const

// Slot options now come from the admin-managed delivery_slots table via
// the public /api/delivery-slots endpoint — same source the checkout
// picker uses. Falls back to the legacy three if the fetch fails so the
// form never renders empty.
interface SlotOption { key: string; label_en: string; label_ar: string; time_label_en: string; time_label_ar: string }
const FALLBACK_SLOTS: SlotOption[] = [
  { key: 'morning', label_en: 'Morning', label_ar: 'الصباح', time_label_en: '8AM-12PM', time_label_ar: '8 ص - 12 ظ' },
  { key: 'afternoon', label_en: 'Afternoon', label_ar: 'الظهيرة', time_label_en: '12PM-5PM', time_label_ar: '12 ظ - 5 م' },
  { key: 'evening', label_en: 'Evening', label_ar: 'المساء', time_label_en: '5PM-10PM', time_label_ar: '5 م - 10 م' },
]

export default function NewSubscriptionClient({ products, addresses, defaultName, defaultPhone }: Props) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const router = useRouter()

  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [picks, setPicks] = useState<Record<number, number>>({}) // productId → qty
  const [frequencyDays, setFrequencyDays] = useState<7 | 14 | 30>(7)
  const [slot, setSlot] = useState<string>('morning')
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>(FALLBACK_SLOTS)
  useEffect(() => {
    fetch('/api/delivery-slots')
      .then(r => r.json())
      .then((data: { slots?: SlotOption[] }) => {
        if (data.slots && data.slots.length > 0) {
          setSlotOptions(data.slots)
          if (!data.slots.some(s => s.key === slot)) setSlot(data.slots[0].key)
        }
      })
      .catch(() => { /* fallback already set */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const defaultAddress = addresses.find(a => a.is_default) || addresses[0]
  const [emirate, setEmirate] = useState(defaultAddress?.emirate || '')
  const [area, setArea] = useState(defaultAddress?.area || '')
  const [building, setBuilding] = useState(defaultAddress?.building || '')
  const [makani, setMakani] = useState(defaultAddress?.makani || '')
  const [customerName, setCustomerName] = useState(defaultName)
  const [customerPhone, setCustomerPhone] = useState(defaultPhone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products.slice(0, 24)
    return products.filter(p => {
      const en = (p.name_en || '').toLowerCase()
      const ar = p.name_ar || ''
      return en.includes(q) || ar.includes(q)
    }).slice(0, 60)
  }, [products, search])

  const pickedItems = useMemo(() => {
    return Object.entries(picks)
      .map(([id, qty]) => {
        const p = products.find(x => x.id === Number(id))
        if (!p) return null
        return { product: p, quantity: qty }
      })
      .filter((x): x is { product: Product; quantity: number } => !!x && x.quantity > 0)
  }, [picks, products])

  const subtotal = pickedItems.reduce((s, it) => s + (Number(it.product.price_aed) || 0) * it.quantity, 0)

  function bump(id: number, delta: number) {
    setPicks(prev => {
      const next = { ...prev }
      const current = next[id] || 0
      const newVal = Math.max(0, Math.min(20, current + delta))
      if (newVal === 0) delete next[id]
      else next[id] = newVal
      return next
    })
  }

  async function submit() {
    setError('')
    if (pickedItems.length === 0) {
      setError(isAr ? 'اختر منتجاً واحداً على الأقل.' : 'Pick at least one item.')
      return
    }
    if (!emirate.trim() || !area.trim()) {
      setError(isAr ? 'العنوان مطلوب.' : 'Address is required.')
      return
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError(isAr ? 'الاسم والهاتف مطلوبان.' : 'Name and phone are required.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/account/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          items: pickedItems.map(it => ({ product_id: it.product.id, quantity: it.quantity })),
          frequency_days: frequencyDays,
          delivery_slot: slot,
          delivery_emirate: emirate.trim(),
          delivery_area: area.trim(),
          delivery_building: building.trim() || undefined,
          delivery_makani: makani.trim() || undefined,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      router.push('/account/subscriptions')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account/subscriptions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-forest-dark mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'الاشتراكات' : 'Subscriptions'}
      </Link>

      <header className="mb-7 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-green-100 text-forest-dark flex items-center justify-center">
          <Repeat size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {isAr ? 'اشتراك جديد' : 'New subscription'}
          </h1>
          <p className="text-sm text-gray-500">
            {isAr ? 'دفع عند الاستلام، تقدر تلغي وقت ما تحب.' : 'Cash on delivery, cancel anytime.'}
          </p>
        </div>
      </header>

      {/* 1. Name (optional) */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 mb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">{isAr ? 'اسم الاشتراك (اختياري)' : 'Subscription name (optional)'}</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isAr ? 'مثلاً: صندوق فواكه أسبوعي' : 'e.g. Weekly fruit box'}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light"
        />
      </section>

      {/* 2. Items */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 mb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">{isAr ? 'المنتجات' : 'Items'}</p>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث عن منتج…' : 'Search products…'}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-forest-light"
          />
        </div>

        {pickedItems.length > 0 && (
          <div className="mb-3 bg-green-50/50 border border-green-200 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-forest-dark mb-2">
              {isAr ? 'منتجاتك المختارة' : 'Your picks'} ({pickedItems.length})
            </p>
            <ul className="space-y-1.5">
              {pickedItems.map(it => (
                <li key={it.product.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-bold text-gray-800">
                    {it.product.emoji && <span className="mr-1">{it.product.emoji}</span>}
                    {(isAr ? it.product.name_ar : it.product.name_en) || `#${it.product.id}`}
                  </span>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => bump(it.product.id, -1)} className="w-6 h-6 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"><Minus size={10} className="mx-auto" aria-hidden="true" /></button>
                    <span className="w-7 text-center font-mono font-bold tabular-nums">{it.quantity}</span>
                    <button type="button" onClick={() => bump(it.product.id, 1)} className="w-6 h-6 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"><Plus size={10} className="mx-auto" aria-hidden="true" /></button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right text-xs text-gray-600 mt-2">
              {isAr ? 'المجموع لكل طلب:' : 'Per order:'} <span className="font-black text-gray-900">AED {subtotal.toFixed(2)}</span>
            </p>
          </div>
        )}

        <div className="max-h-72 overflow-y-auto -mx-1">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-1">
            {filtered.map(p => {
              const qty = picks[p.id] || 0
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {p.emoji && <span className="mr-1">{p.emoji}</span>}
                      {(isAr ? p.name_ar : p.name_en) || `#${p.id}`}
                    </p>
                    <p className="text-[10px] text-gray-500">AED {Number(p.price_aed || 0).toFixed(2)} / {p.unit}</p>
                  </div>
                  {qty === 0 ? (
                    <button type="button" onClick={() => bump(p.id, 1)} className="shrink-0 bg-white border border-gray-300 text-gray-700 text-xs font-bold px-2.5 py-1.5 rounded-md hover:bg-gray-50">
                      {isAr ? '+ أضف' : '+ Add'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => bump(p.id, -1)} className="w-6 h-6 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"><Minus size={10} className="mx-auto" aria-hidden="true" /></button>
                      <span className="w-7 text-center font-mono font-bold tabular-nums text-sm">{qty}</span>
                      <button type="button" onClick={() => bump(p.id, 1)} className="w-6 h-6 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"><Plus size={10} className="mx-auto" aria-hidden="true" /></button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* 3. Frequency */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 mb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">{isAr ? 'التكرار' : 'Frequency'}</p>
        <div className="grid grid-cols-3 gap-2">
          {FREQ_OPTIONS.map(opt => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setFrequencyDays(opt.days)}
              className={`text-left rounded-xl border-2 p-3 transition-colors ${
                frequencyDays === opt.days
                  ? 'border-forest bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-bold text-gray-900">{isAr ? opt.ar : opt.en}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc[isAr ? 'ar' : 'en']}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Slot + Address */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 mb-4 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">{isAr ? 'وقت التسليم' : 'Delivery slot'}</p>
          <select
            value={slot}
            onChange={e => setSlot(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light"
          >
            {slotOptions.map(s => (
              <option key={s.key} value={s.key}>
                {(isAr ? s.label_ar : s.label_en) + ' (' + (isAr ? s.time_label_ar : s.time_label_en) + ')'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{isAr ? 'الإمارة' : 'Emirate'}</p>
            <input type="text" required value={emirate} onChange={e => setEmirate(e.target.value)} placeholder="Dubai" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{isAr ? 'المنطقة' : 'Area'}</p>
            <input type="text" required value={area} onChange={e => setArea(e.target.value)} placeholder="JBR" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{isAr ? 'المبنى' : 'Building'}</p>
            <input type="text" value={building} onChange={e => setBuilding(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Makani</p>
            <input type="text" value={makani} onChange={e => setMakani(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{isAr ? 'الاسم' : 'Name'}</p>
            <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{isAr ? 'الهاتف' : 'Phone'}</p>
            <input type="tel" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0501234567" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2 mb-4">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy || pickedItems.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-black px-4 py-4 rounded-2xl text-base"
      >
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Repeat size={16} aria-hidden="true" />}
        {busy ? (isAr ? 'جارٍ الإنشاء…' : 'Creating…') : (isAr ? `إنشاء الاشتراك (AED ${subtotal.toFixed(2)} لكل طلب)` : `Start subscription (AED ${subtotal.toFixed(2)} per order)`)}
      </button>
      <p className="text-[11px] text-gray-500 mt-2 text-center">
        {isAr ? 'أول توصيلة بعد ' : 'First delivery in '}{frequencyDays} {isAr ? 'يوم. الدفع نقداً عند الاستلام.' : 'days. Cash on delivery.'}
      </p>
    </div>
  )
}
