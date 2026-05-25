'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, ShoppingBag, Package, MessageCircle, Sunrise, Sun, Moon, Truck, Wallet, CreditCard, Loader2, Lock, MapPin, User, Sparkles, Clock } from 'lucide-react'

// Shape from /api/delivery-slots?date=…
interface ApiSlot {
  key: string
  label_en: string
  label_ar: string
  time_label_en: string
  time_label_ar: string
  available?: boolean
  reason?: 'cutoff_passed' | 'day_off' | 'full'
  // Capacity tracking for the "almost full" hint. booked = current
  // non-cancelled orders for this slot+date; max is the configured cap.
  booked?: number
  max_orders_per_day?: number | null
}
import { useCartStore } from '@/lib/store'
import { formatAED, calculateTotal } from '@/lib/utils'
import { useLang } from '@/lib/use-lang'
import { isValidEmail, isValidUAEPhone } from '@/lib/validators'
import { MIN_REDEEM_POINTS, POINTS_PER_AED_REDEEM, resolveRedemption } from '@/lib/points'
import { useCartValidation, CartValidationBanner } from '@/components/CartValidation'
import posthog from 'posthog-js'

interface SavedAddress {
  id: number
  label: string | null
  building: string | null
  area: string | null
  emirate: string | null
  makani: string | null
  is_default: boolean
}

const inputClass = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-green-500 transition-colors"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [submitted, setSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [waMessage, setWaMessage] = useState('')
  const [waNumber, setWaNumber] = useState('')
  const [formError, setFormError] = useState('')
  const [promoError, setPromoError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    emirate: '',
    area: '',
    building: '',
    makani: '',
    notes: '',
    deliverySlot: '',
    deliveryDate: '',
  })

  const { lang, tr } = useLang()
  const { result: validation } = useCartValidation()
  const checkoutBlocked = validation?.blocking ?? false
  const [signedIn, setSignedIn] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [activeAddressId, setActiveAddressId] = useState<number | null>(null)
  const [pointsBalance, setPointsBalance] = useState(0)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)

  useEffect(() => {
    if (items.length > 0) {
      posthog.capture('checkout_started', {
        item_count: items.reduce((s, i) => s + i.quantity, 0),
        subtotal_aed: subtotal(),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prefill from the signed-in customer's profile + saved addresses. Silent
  // 401 for guests; first-time signed-in users with no addresses still see
  // an empty form.
  useEffect(() => {
    let cancelled = false
    fetch('/api/account/me')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.signedIn) return
        setSignedIn(true)
        setSavedAddresses(data.addresses || [])
        setPointsBalance(Number(data.pointsBalance || 0))
        const defaultAddr = (data.addresses || []).find((a: SavedAddress) => a.is_default) || (data.addresses || [])[0]
        setForm(prev => ({
          ...prev,
          fullName: prev.fullName || data.fullName || '',
          phone:    prev.phone    || data.phone    || '',
          email:    prev.email    || data.email    || '',
          emirate:  prev.emirate  || (defaultAddr?.emirate  || ''),
          area:     prev.area     || (defaultAddr?.area     || ''),
          building: prev.building || (defaultAddr?.building || ''),
          makani:   prev.makani   || (defaultAddr?.makani   || ''),
        }))
        if (defaultAddr) setActiveAddressId(defaultAddr.id)
      })
      .catch(() => { /* not signed in or offline — leave form empty */ })
    return () => { cancelled = true }
  }, [])

  function applyAddress(a: SavedAddress) {
    setActiveAddressId(a.id)
    setForm(prev => ({
      ...prev,
      emirate:  a.emirate  || '',
      area:     a.area     || '',
      building: a.building || '',
      makani:   a.makani   || '',
    }))
  }

  const EMIRATES = lang === 'ar'
    ? ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين']
    : ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']

  // Generate next 3 delivery dates in UAE timezone
  const DELIVERY_DATES = Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }) // YYYY-MM-DD
    const label = i === 0 ? (lang === 'ar' ? 'اليوم' : 'Today')
      : i === 1 ? (lang === 'ar' ? 'غداً' : 'Tomorrow')
      : d.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-AE', { timeZone: 'Asia/Dubai', weekday: 'short', month: 'short', day: 'numeric' })
    return { iso, label }
  })

  // Slots are admin-managed at /dashboard/delivery-slots. We fetch the
  // bookable set for the currently-selected date so the picker shows the
  // right cutoff/capacity reality at this exact moment.
  const [serverSlots, setServerSlots] = useState<ApiSlot[]>([])
  useEffect(() => {
    let cancelled = false
    const url = form.deliveryDate
      ? `/api/delivery-slots?date=${form.deliveryDate}`
      : '/api/delivery-slots'
    fetch(url)
      .then(r => r.json())
      .then(data => { if (!cancelled) setServerSlots(data.slots || []) })
      .catch(() => { /* fallback: leave whatever was there */ })
    return () => { cancelled = true }
  }, [form.deliveryDate])

  // Icon mapping: the API doesn't carry an icon, so we map by key for
  // the three legacy slots and fall back to a generic Clock for any
  // custom slots admin creates.
  const SLOT_ICONS: Record<string, typeof Sunrise> = { morning: Sunrise, afternoon: Sun, evening: Moon }

  const DELIVERY_SLOTS = serverSlots.map(s => {
    // "Almost full" surfaces when the slot has a configured cap and ≥70%
    // of the day's allotment is taken. Nudges urgency without lying.
    let spotsLeft: number | null = null
    if (s.max_orders_per_day != null && s.booked != null) {
      const remaining = Math.max(0, s.max_orders_per_day - s.booked)
      if (remaining > 0 && s.booked / s.max_orders_per_day >= 0.7) {
        spotsLeft = remaining
      }
    }
    return {
      id: s.key,
      label: lang === 'ar' ? s.label_ar : s.label_en,
      time: lang === 'ar' ? s.time_label_ar : s.time_label_en,
      Icon: SLOT_ICONS[s.key] || Clock,
      available: s.available !== false,
      reason: s.reason,
      spotsLeft,
    }
  })

  const sub = subtotal()
  const { vat, deliveryFee, total } = calculateTotal(sub)
  const totalBeforePoints = total - promoDiscount
  // Mirror the server's resolveRedemption so the displayed discount matches
  // what /api/orders will actually apply.
  const pointsResolved = pointsToRedeem > 0
    ? resolveRedemption({ pointsRequested: pointsToRedeem, balance: pointsBalance, subtotalAed: Math.max(0, sub - promoDiscount) })
    : { points: 0, aed: 0 }
  const pointsValueAed = pointsResolved.aed
  const finalTotal = Math.max(0, totalBeforePoints - pointsValueAed)
  const pointsCapAed = Math.floor(Math.min(pointsBalance, Math.max(0, sub - promoDiscount) * POINTS_PER_AED_REDEEM) / POINTS_PER_AED_REDEEM)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function applyPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      })
      const data = await res.json()
      if (data.valid) {
        const discount = parseFloat((sub * (data.discountPercent / 100)).toFixed(2))
        setPromoApplied(true)
        setPromoDiscount(discount)
        setPromoError('')
      } else {
        setPromoError(data.error || (lang === 'ar' ? 'كود خصم غير صالح' : 'Invalid promo code'))
      }
    } catch {
      setPromoError(lang === 'ar' ? 'تعذر التحقق من الكود' : 'Could not validate promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.fullName || !form.phone || !form.emirate || !form.area) {
      setFormError(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields.')
      return
    }
    if (!isValidUAEPhone(form.phone)) {
      setFormError(lang === 'ar' ? 'رقم الهاتف غير صحيح. مثال: 0501234567' : 'Please enter a valid UAE phone number, e.g. 0501234567.')
      return
    }
    if (form.email && !isValidEmail(form.email)) {
      setFormError(lang === 'ar' ? 'البريد الإلكتروني غير صحيح.' : 'Please enter a valid email address.')
      return
    }
    if (!form.deliveryDate) {
      setFormError(lang === 'ar' ? 'يرجى اختيار تاريخ التوصيل' : 'Please select a delivery date.')
      return
    }
    if (!form.deliverySlot) {
      setFormError(lang === 'ar' ? 'يرجى اختيار وقت التوصيل' : 'Please select a delivery slot.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          items,
          subtotal: sub,
          vat,
          deliveryFee,
          total: finalTotal,
          paymentMethod,
          promoCode: promoApplied ? promoCode : '',
          promoDiscount,
          pointsToRedeem: pointsResolved.points,
          deliverySlot: form.deliverySlot,
          deliveryDate: form.deliveryDate,
          locale: lang,
        }),
      })

      const data = await res.json()

      if (data.success) {
        posthog.capture('order_placed', {
          order_number: data.orderNumber,
          item_count: items.reduce((s, i) => s + i.quantity, 0),
          total_aed: finalTotal,
          payment_method: paymentMethod,
          delivery_slot: form.deliverySlot,
          emirate: form.emirate,
          promo_code: promoApplied ? promoCode : undefined,
        })

        // Card payment → redirect to Stripe Checkout. Clear the cart first so
        // closing the Stripe tab and coming back doesn't leave the user about
        // to re-pay for an order that's already pending in the orders table.
        // (Abandoned orders >24h get cancelled by the cron route.)
        if (data.stripeUrl) {
          clearCart()
          window.location.href = data.stripeUrl
          return
        }

        setOrderNumber(data.orderNumber)
        clearCart()
        setSubmitted(true)
        setWaMessage(data.waMessage)
        setWaNumber(data.waNumber)
        // Auto-open WhatsApp after 1.5s
        setTimeout(() => {
          window.open(`https://wa.me/${data.waNumber}?text=${data.waMessage}`, '_blank')
        }, 1500)
      } else {
        setFormError(data.error || (lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.'))
      }
    } catch {
      setFormError(lang === 'ar' ? 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.' : 'Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">{tr.orderPlaced}</h1>
        <p className="text-gray-500 mb-2 text-lg">{tr.thankYou}, {form.fullName}!</p>
        {orderNumber && (
          <p className="text-green-700 font-black text-2xl mb-3">#{orderNumber}</p>
        )}
        <p className="text-gray-500 mb-8 text-sm max-w-md mx-auto">
          {lang === 'ar'
            ? 'سيتم التواصل معك عبر واتساب لتأكيد طلبك وإعلامك بوقت التوصيل.'
            : "We'll contact you on WhatsApp to confirm your order and delivery time."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {waMessage && (
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black px-6 py-3 rounded-xl transition-colors"
            >
              <MessageCircle size={18} fill="currentColor" />
              {lang === 'ar' ? 'تأكيد عبر واتساب' : 'Confirm on WhatsApp'}
            </a>
          )}
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            <ShoppingBag size={18} />
            {tr.continueShopping}
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">
          {lang === 'ar' ? 'لا يوجد شيء للدفع' : 'Nothing to checkout'}
        </h2>
        <p className="text-gray-500 mb-8">
          {lang === 'ar' ? 'سلتك فارغة. أضف بعض المنتجات الطازجة أولاً!' : 'Your cart is empty. Add some fresh produce first!'}
        </p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          {lang === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 md:mb-8">{tr.checkout}</h1>

      <CartValidationBanner result={validation} />

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            {/* Saved addresses (signed-in customers) */}
            {signedIn && savedAddresses.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h2 className="font-black text-gray-900 text-base md:text-lg inline-flex items-center gap-2">
                    <MapPin size={16} className="text-green-600" aria-hidden="true" />
                    {lang === 'ar' ? 'العنوان المحفوظ' : 'Saved address'}
                  </h2>
                  <Link href="/account/addresses" className="text-xs font-bold text-green-700 hover:underline">
                    {lang === 'ar' ? 'إدارة' : 'Manage'} →
                  </Link>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {savedAddresses.map(a => {
                    const active = activeAddressId === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => applyAddress(a)}
                        className={`flex-shrink-0 text-left rounded-xl border-2 px-4 py-2.5 text-xs transition-colors min-w-[160px] ${
                          active ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 truncate">
                          {a.label || (lang === 'ar' ? 'العنوان' : 'Address')}
                        </div>
                        <div className="text-gray-500 truncate">{a.area}, {a.emirate}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {!signedIn && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap text-sm">
                <span className="inline-flex items-center gap-2 text-gray-700">
                  <User size={14} className="text-green-700" aria-hidden="true" />
                  {lang === 'ar' ? 'لديك حساب؟ سجّل الدخول لتعبئة بياناتك تلقائياً.' : 'Have an account? Sign in to auto-fill your details.'}
                </span>
                <Link href="/account/login?next=/checkout" className="font-bold text-green-700 hover:underline">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'} →
                </Link>
              </div>
            )}

            {/* Delivery Details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="font-black text-gray-900 text-lg md:text-xl mb-5 md:mb-6">{tr.deliveryDetails}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.fullName} *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'أحمد المنصوري' : 'Ahmed Al Mansouri'}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.phone} *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+971 50 000 0000"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.email}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="emirate" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.emirate} *</label>
                  <select
                    id="emirate"
                    name="emirate"
                    value={form.emirate}
                    onChange={handleChange}
                    className={`${inputClass} bg-white`}
                    required
                  >
                    <option value="">{tr.selectEmirate}</option>
                    {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="area" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.area} *</label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'جميرا لايك تاورز، المرسى...' : 'JLT, Marina, Deira, Khalidiyah...'}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="building" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.building}</label>
                  <input
                    type="text"
                    id="building"
                    name="building"
                    value={form.building}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'اسم البرج أو رقم الفيلا' : 'Tower name or villa number'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="makani" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {tr.makani} <span className="text-gray-400 font-normal">{tr.makaniOptional}</span>
                  </label>
                  <input
                    type="text"
                    id="makani"
                    name="makani"
                    value={form.makani}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'كود عنوان دبي' : 'Dubai address code'}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">{tr.notes}</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                    rows={2}
                    placeholder={tr.notesPlaceholder}
                  />
                </div>
              </div>
            </div>

            {/* Delivery Date + Slot */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="font-black text-gray-900 text-lg md:text-xl mb-4 md:mb-5">
                {lang === 'ar' ? 'موعد التوصيل' : 'Delivery Date & Slot'}
              </h2>

              {/* Date picker */}
              <p className="text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'اختر اليوم' : 'Choose a date'}</p>
              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
                {DELIVERY_DATES.map(({ iso, label }) => (
                  <label key={iso} className={`flex flex-col items-center p-3 border-2 rounded-xl cursor-pointer transition-all text-center ${
                    form.deliveryDate === iso ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="deliveryDate" value={iso} checked={form.deliveryDate === iso}
                      onChange={() => setForm(f => ({ ...f, deliveryDate: iso }))} className="sr-only" />
                    <span className="font-bold text-gray-900 text-xs md:text-sm">{label}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-AE', { day: 'numeric', month: 'short' })}</span>
                    {form.deliveryDate === iso && <CheckCircle size={14} className="text-green-600 mt-1" aria-hidden="true" />}
                  </label>
                ))}
              </div>

              {/* Slot picker */}
              <p className="text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'اختر الوقت' : 'Choose a time slot'}</p>
              <div className={`grid gap-2 md:gap-3 ${DELIVERY_SLOTS.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {DELIVERY_SLOTS.length === 0 && (
                  <p className="col-span-full text-sm text-gray-500 text-center py-4">
                    {lang === 'ar' ? 'اختر التاريخ أولاً لعرض الأوقات المتاحة.' : 'Pick a date above to see available slots.'}
                  </p>
                )}
                {DELIVERY_SLOTS.map(slot => {
                  const reasonText: Record<string, string> = lang === 'ar'
                    ? { cutoff_passed: 'انتهى الوقت', day_off: 'غير متاح', full: 'مكتمل' }
                    : { cutoff_passed: 'Too late', day_off: 'Off', full: 'Full' }
                  return (
                    <label
                      key={slot.id}
                      className={`relative flex flex-col items-center p-3 md:p-4 border-2 rounded-xl transition-all text-center ${
                        !slot.available
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : form.deliverySlot === slot.id
                            ? 'border-green-500 bg-green-50 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliverySlot"
                        value={slot.id}
                        checked={form.deliverySlot === slot.id}
                        onChange={e => setForm(f => ({ ...f, deliverySlot: e.target.value }))}
                        disabled={!slot.available}
                        className="sr-only"
                      />
                      <slot.Icon size={22} className={`mb-1.5 ${form.deliverySlot === slot.id ? 'text-green-600' : 'text-gray-400'}`} aria-hidden="true" />
                      <span className="font-bold text-gray-900 text-xs md:text-sm">{slot.label}</span>
                      {slot.available && slot.spotsLeft != null && (
                        <span className="absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5" title={lang === 'ar' ? `${slot.spotsLeft} مكان متبقي` : `${slot.spotsLeft} spots left today`}>
                          {lang === 'ar' ? `${slot.spotsLeft} متبقي` : `${slot.spotsLeft} left`}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 mt-0.5 leading-tight">{slot.time}</span>
                      {!slot.available && slot.reason && (
                        <span className="absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded px-1 py-0.5">
                          {reasonText[slot.reason]}
                        </span>
                      )}
                      {form.deliverySlot === slot.id && slot.available && (
                        <CheckCircle size={14} className="text-green-600 mt-1" aria-hidden="true" />
                      )}
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center inline-flex items-center justify-center gap-1.5 w-full">
                <Truck size={12} aria-hidden="true" />
                {lang === 'ar' ? 'توصيل مجاني · التوصيل في نفس اليوم متاح' : 'Free delivery · Same day delivery available'}
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="font-black text-gray-900 text-lg md:text-xl mb-5">{tr.paymentMethod}</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="sr-only" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <Wallet size={20} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{tr.cashOnDelivery}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tr.cashOnDeliverySub}</div>
                  </div>
                  {paymentMethod === 'cod' && <CheckCircle size={20} className="text-green-600" aria-hidden="true" />}
                </label>
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  paymentMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="sr-only" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <CreditCard size={20} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{tr.payOnline}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{lang === 'ar' ? 'بطاقة فيزا أو ماستركارد · دفع آمن' : 'Visa or Mastercard · Secure checkout'}</div>
                  </div>
                  {paymentMethod === 'card' && <CheckCircle size={20} className="text-green-600" aria-hidden="true" />}
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="font-black text-gray-900 text-xl mb-4">{tr.orderSummary}</h2>

              {/* Cart items */}
              <div className="space-y-3 mb-5 max-h-48 md:max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill sizes="40px" className="object-cover" />
                      ) : item.emoji ? (
                        <span className="text-xl">{item.emoji}</span>
                      ) : (
                        <Package size={18} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{formatAED(item.priceAED * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{tr.subtotal} ({items.reduce((s, i) => s + i.quantity, 0)} {lang === 'ar' ? 'عناصر' : 'items'})</span>
                  <span>{formatAED(sub)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{tr.vat}</span>
                  <span>{formatAED(vat)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{tr.delivery}</span>
                  <span>
                    {deliveryFee === 0
                      ? <span className="text-green-600 font-bold">{tr.freeDelivery}</span>
                      : formatAED(deliveryFee)
                    }
                  </span>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-800 font-semibold flex items-center gap-2">
                  <Truck size={14} className="text-green-700 shrink-0" aria-hidden="true" />
                  <span>{lang === 'ar' ? 'توصيل مجاني — عرض الإطلاق!' : 'Free delivery — Grand Launch Offer!'}</span>
                </div>

                {/* Promo Code */}
                <div className="border-t pt-4 mt-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{tr.promoCode}</label>
                  {promoApplied ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                      <CheckCircle size={16} />
                      {tr.promoApplied} — AED {promoDiscount.toFixed(2)} off!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder={lang === 'ar' ? 'أدخل كود الخصم' : 'Enter promo code'}
                        className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-base md:text-sm focus:outline-none focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={promoLoading}
                        className="bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors min-h-[44px] disabled:opacity-60"
                      >
                        {promoLoading ? '...' : tr.apply}
                      </button>
                    </div>
                  )}
                  {promoError && !promoApplied && (
                    <p className="text-xs text-red-600 mt-2">{promoError}</p>
                  )}
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Promo ({promoCode})</span>
                    <span>-{formatAED(promoDiscount)}</span>
                  </div>
                )}

                {/* Loyalty points redemption (signed-in customers with at least
                    the minimum balance) */}
                {signedIn && pointsBalance >= MIN_REDEEM_POINTS && (
                  <div className="border-t pt-4 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide inline-flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-600" aria-hidden="true" />
                        {lang === 'ar' ? 'استبدال نقاط' : 'Redeem points'}
                      </label>
                      <span className="text-xs font-bold text-gray-500">
                        {lang === 'ar' ? 'الرصيد:' : 'Balance:'} {pointsBalance.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={pointsBalance}
                        step={MIN_REDEEM_POINTS}
                        value={pointsToRedeem || ''}
                        onChange={e => setPointsToRedeem(Math.max(0, Math.min(pointsBalance, Number(e.target.value) || 0)))}
                        placeholder={String(MIN_REDEEM_POINTS)}
                        aria-label={lang === 'ar' ? 'نقاط للاستبدال' : 'Points to redeem'}
                        className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-base md:text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPointsToRedeem(Math.min(pointsBalance, pointsCapAed * POINTS_PER_AED_REDEEM))}
                        className="text-xs font-bold text-emerald-700 hover:underline whitespace-nowrap"
                      >
                        {lang === 'ar' ? 'استخدم الكل' : 'Use max'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      {lang === 'ar'
                        ? `الحد الأدنى ${MIN_REDEEM_POINTS} نقطة · ${POINTS_PER_AED_REDEEM} نقطة = 1 درهم`
                        : `Min ${MIN_REDEEM_POINTS} pts · ${POINTS_PER_AED_REDEEM} pts = AED 1`}
                    </p>
                    {pointsResolved.reason && pointsToRedeem > 0 && (
                      <p className="text-xs text-red-600 mt-1">{pointsResolved.reason}</p>
                    )}
                  </div>
                )}

                {pointsValueAed > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="inline-flex items-center gap-1.5"><Sparkles size={12} aria-hidden="true" /> {pointsResolved.points} pts</span>
                    <span>-{formatAED(pointsValueAed)}</span>
                  </div>
                )}

                <div className="border-t-2 pt-4 flex justify-between font-black text-gray-900 text-lg">
                  <span>{tr.total}</span>
                  <span className="text-green-700">{formatAED(finalTotal)}</span>
                </div>
              </div>

              {formError && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center font-medium">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || checkoutBlocked}
                title={checkoutBlocked
                  ? (lang === 'ar' ? 'يرجى حل المشكلات في السلة قبل المتابعة' : 'Please resolve the issues above before continuing')
                  : undefined}
                className="w-full mt-4 bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-colors text-lg shadow-lg min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                    {lang === 'ar' ? 'جاري التأكيد...' : 'Placing order...'}
                  </>
                ) : checkoutBlocked ? (
                  <>{lang === 'ar' ? 'حل مشكلات السلة أولاً' : 'Fix cart issues to continue'}</>
                ) : (
                  <>{tr.placeOrder} →</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-4 inline-flex items-center justify-center gap-1.5 w-full">
                <Lock size={11} aria-hidden="true" /> {tr.secureNote}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
