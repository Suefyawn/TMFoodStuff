'use client'
import { useState } from 'react'
import { Search, Package, CheckCircle, Truck, Clock, XCircle, MapPin, Calendar, ShoppingCart, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useLang } from '@/lib/use-lang'
import { isValidEmail } from '@/lib/validators'
import type { Lang } from '@/lib/translations'
import Link from 'next/link'

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered']

function statusMeta(lang: Lang): Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> {
  const isAr = lang === 'ar'
  return {
    pending:          { label: isAr ? 'تم استلام الطلب' : 'Order Received',   color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Clock size={18} /> },
    confirmed:        { label: isAr ? 'تم التأكيد' : 'Confirmed',              color: 'text-blue-600',   bg: 'bg-blue-100',   icon: <CheckCircle size={18} /> },
    processing:       { label: isAr ? 'قيد التحضير' : 'Being Prepared',        color: 'text-purple-600', bg: 'bg-purple-100', icon: <Package size={18} /> },
    out_for_delivery: { label: isAr ? 'خرج للتوصيل' : 'Out for Delivery',      color: 'text-orange-600', bg: 'bg-orange-100', icon: <Truck size={18} /> },
    delivered:        { label: isAr ? 'تم التسليم' : 'Delivered',              color: 'text-green-600',  bg: 'bg-green-100',  icon: <CheckCircle size={18} /> },
    cancelled:        { label: isAr ? 'ملغي' : 'Cancelled',                    color: 'text-red-600',    bg: 'bg-red-100',    icon: <XCircle size={18} /> },
  }
}

function slotLabel(slot: string, lang: Lang): string {
  const en: Record<string, string> = {
    morning: 'Morning · 8:00 AM – 12:00 PM',
    afternoon: 'Afternoon · 12:00 PM – 5:00 PM',
    evening: 'Evening · 5:00 PM – 10:00 PM',
  }
  const ar: Record<string, string> = {
    morning: 'صباحاً · ٨:٠٠ – ١٢:٠٠',
    afternoon: 'ظهراً · ١٢:٠٠ – ٥:٠٠',
    evening: 'مساءً · ٥:٠٠ – ١٠:٠٠',
  }
  return (lang === 'ar' ? ar : en)[slot] ?? slot
}

export default function TrackPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const STATUS_META = statusMeta(lang)
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNumber.trim() || !email.trim()) return
    if (!isValidEmail(email)) {
      setError(isAr ? 'البريد الإلكتروني غير صحيح.' : 'Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || (isAr ? 'حدث خطأ ما.' : 'Something went wrong.'))
      } else {
        setOrder(data)
      }
    } catch {
      setError(isAr ? 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.' : 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const { addItem } = useCartStore()
  const [reordered, setReordered] = useState(false)

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1
  const isCancelled = order?.status === 'cancelled'
  const meta = order ? (STATUS_META[order.status] || STATUS_META.pending) : null

  function handleReorder() {
    if (!order?.items) return
    for (const item of order.items) {
      addItem({
        id: String(item.id || item.name),
        name: item.name,
        slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-'),
        priceAED: item.price_aed || item.priceAED || 0,
        unit: item.unit || 'kg',
        emoji: item.emoji,
      }, item.quantity)
    }
    setReordered(true)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-16" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-green-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          {isAr ? 'تتبع طلبك' : 'Track Your Order'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isAr ? 'أدخل رقم الطلب والبريد الإلكتروني الذي استخدمته عند الدفع.' : 'Enter your order number and the email you used at checkout.'}
        </p>
      </div>

      <form onSubmit={handleTrack} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 mb-6" noValidate>
        <div>
          <label htmlFor="track-order-number" className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'رقم الطلب' : 'Order Number'}
          </label>
          <input
            id="track-order-number"
            type="text"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="TM-XXXXXX"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 transition-colors font-mono"
            required
          />
        </div>
        <div>
          <label htmlFor="track-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'البريد الإلكتروني' : 'Email Address'}
          </label>
          <input
            id="track-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={error ? 'true' : undefined}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 transition-colors"
            required
          />
        </div>
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
          {loading
            ? (isAr ? 'جاري البحث…' : 'Looking up…')
            : (isAr ? 'تتبع الطلب' : 'Track Order')}
        </button>
      </form>

      {order && meta && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  {isAr ? 'الطلب' : 'Order'}
                </p>
                <p className="text-xl font-black text-gray-900 font-mono">{order.order_number}</p>
                {order.customer_name && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isAr ? `مرحباً، ${order.customer_name}!` : `Hi, ${order.customer_name}!`}
                  </p>
                )}
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm ${meta.bg} ${meta.color}`}>
                {meta.icon}
                {meta.label}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!isCancelled && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStepIndex
                  const active = i === currentStepIndex
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className={`w-full h-2 rounded-full transition-colors ${
                        done ? 'bg-green-500' : 'bg-gray-200'
                      } ${active ? 'ring-2 ring-green-300 ring-offset-1' : ''}`} />
                      <span className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-green-600' : 'text-gray-400'}`}>
                        {STATUS_META[step]?.label.split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Delivery info */}
          <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                  {isAr ? 'العنوان' : 'Delivery To'}
                </p>
                <p className="text-sm text-gray-700 font-semibold mt-0.5">
                  {order.delivery_area}{order.delivery_building ? `, ${order.delivery_building}` : ''}
                </p>
                <p className="text-xs text-gray-500">{order.delivery_emirate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                  {isAr ? 'وقت التوصيل' : 'Delivery Slot'}
                </p>
                <p className="text-sm text-gray-700 font-semibold mt-0.5">
                  {slotLabel(order.delivery_slot, lang) || '—'}
                </p>
                <p className="text-xs text-gray-500">
                  {isAr ? 'تاريخ الطلب' : 'Ordered'}{' '}
                  {new Date(order.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase mb-3">
                {isAr ? 'المنتجات' : 'Items'}
              </p>
              <div className="space-y-2">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {item.emoji && <span className="text-lg">{item.emoji}</span>}
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-xs text-gray-400">×{item.quantity}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      AED {((item.price_aed || item.priceAED || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="px-6 py-4 border-b border-gray-100">
            {order.promo_code && order.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-semibold mb-1">
                <span>{isAr ? `كود الخصم (${order.promo_code})` : `Promo (${order.promo_code})`}</span>
                <span>-AED {Number(order.promo_discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-black text-gray-900">{isAr ? 'الإجمالي' : 'Total'}</span>
              <span className="text-lg font-black text-green-700">AED {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Reorder */}
          <div className="px-6 py-4">
            {reordered ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-green-600 font-semibold text-sm">
                  {isAr ? '✓ تمت إضافة المنتجات إلى السلة!' : '✓ Items added to cart!'}
                </span>
                <Link href="/cart" className="text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-colors">
                  {isAr ? 'الذهاب إلى السلة ←' : 'Go to Cart →'}
                </Link>
              </div>
            ) : (
              <button
                onClick={handleReorder}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors text-sm focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                <ShoppingCart size={16} aria-hidden="true" /> {isAr ? 'إعادة الطلب' : 'Order Again'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
