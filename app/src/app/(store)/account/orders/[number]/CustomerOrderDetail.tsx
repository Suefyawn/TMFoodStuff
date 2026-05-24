'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Clock, MapPin, CreditCard, Wallet, CheckCircle2, Truck, XCircle, ShoppingCart, Loader2, FileText } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useLang } from '@/lib/use-lang'
import { useState } from 'react'

interface OrderRow {
  id: number
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  customer_name: string
  customer_phone: string
  delivery_emirate: string | null
  delivery_area: string | null
  delivery_building: string | null
  delivery_makani: string | null
  delivery_slot: string | null
  delivery_date: string | null
  delivery_notes: string | null
  subtotal_aed: number | null
  subtotal: number | null
  vat_aed: number | null
  vat: number | null
  delivery_fee_aed: number | null
  delivery_fee: number | null
  promo_code: string | null
  promo_discount_aed: number | null
  promo_discount: number | null
  total_aed: number | null
  total: number | null
  items: unknown
  created_at: string
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered']

function statusLabel(s: string, isAr: boolean): string {
  const en: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', processing: 'Preparing',
    out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
  }
  const ar: Record<string, string> = {
    pending: 'قيد الانتظار', confirmed: 'تم التأكيد', processing: 'قيد التحضير',
    out_for_delivery: 'خرج للتوصيل', delivered: 'تم التسليم', cancelled: 'ملغي',
  }
  return (isAr ? ar : en)[s] ?? s
}

function slotLabel(slot: string | null, isAr: boolean): string {
  if (!slot) return '—'
  const en: Record<string, string> = {
    morning: 'Morning · 8 AM – 12 PM',
    afternoon: 'Afternoon · 12 – 5 PM',
    evening: 'Evening · 5 – 10 PM',
  }
  const ar: Record<string, string> = {
    morning: 'صباحاً · ٨ – ١٢',
    afternoon: 'ظهراً · ١٢ – ٥',
    evening: 'مساءً · ٥ – ١٠',
  }
  return (isAr ? ar : en)[slot] ?? slot
}

export default function CustomerOrderDetail({ order }: { order: OrderRow }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const router = useRouter()
  const { addItem } = useCartStore()
  const [reordered, setReordered] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const items = Array.isArray(order.items) ? (order.items as Array<{
    id: number | string; name: string; quantity: number; price_aed: number; emoji?: string; slug?: string; unit?: string;
  }>) : []
  const total = Number(order.total_aed ?? order.total ?? 0)
  const subtotal = Number(order.subtotal_aed ?? order.subtotal ?? 0)
  const vat = Number(order.vat_aed ?? order.vat ?? 0)
  const deliveryFee = Number(order.delivery_fee_aed ?? order.delivery_fee ?? 0)
  const promoDiscount = Number(order.promo_discount_aed ?? order.promo_discount ?? 0)
  const stepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const paidOnline = order.payment_method === 'card' && order.payment_status === 'paid'

  function reorder() {
    for (const item of items) {
      addItem({
        id: String(item.id || item.name),
        name: item.name,
        slug: item.slug || (item.name || '').toLowerCase().replace(/\s+/g, '-'),
        priceAED: Number(item.price_aed || 0),
        unit: item.unit || 'kg',
        emoji: item.emoji,
      }, item.quantity)
    }
    setReordered(true)
  }

  const isCancellable = order.status === 'pending' || order.status === 'confirmed'
  const isPaidCard = order.payment_method === 'card' && order.payment_status === 'paid'

  async function cancelOrder() {
    const confirmText = isPaidCard
      ? (isAr
          ? 'سيتم إلغاء الطلب واسترداد المبلغ إلى بطاقتك. هل أنت متأكد؟'
          : 'This will cancel the order and refund the charge to your card. Are you sure?')
      : (isAr ? 'هل أنت متأكد من إلغاء الطلب؟' : 'Cancel this order?')
    if (!confirm(confirmText)) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await fetch('/api/account/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: order.order_number }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCancelError(data.error || (isAr ? 'تعذّر الإلغاء.' : 'Could not cancel.'))
        return
      }
      router.refresh()
    } catch {
      setCancelError(isAr ? 'خطأ في الاتصال.' : 'Network error.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-700 mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{isAr ? 'الطلب' : 'Order'}</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-mono">#{order.order_number}</h1>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${
            isCancelled ? 'bg-gray-200 text-gray-700'
            : order.status === 'delivered' ? 'bg-green-100 text-green-700'
            : order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-700'
            : 'bg-blue-100 text-blue-700'
          }`}>
            {isCancelled ? <XCircle size={14} aria-hidden="true" /> : order.status === 'delivered' ? <CheckCircle2 size={14} aria-hidden="true" /> : order.status === 'out_for_delivery' ? <Truck size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
            {statusLabel(order.status, isAr)}
          </span>
        </div>

        {/* Progress */}
        {!isCancelled && (
          <div className="mb-5">
            <div className="flex items-center gap-1">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIndex
                const active = i === stepIndex
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={`w-full h-2 rounded-full transition-colors ${done ? 'bg-green-500' : 'bg-gray-200'} ${active ? 'ring-2 ring-green-300 ring-offset-1' : ''}`} />
                    <span className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-green-700' : 'text-gray-400'}`}>
                      {statusLabel(step, isAr).split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Delivery + payment summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-gray-400" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{isAr ? 'التوصيل' : 'Delivery'}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {order.delivery_area}{order.delivery_building ? `, ${order.delivery_building}` : ''}
            </p>
            <p className="text-xs text-gray-500">{order.delivery_emirate}</p>
            <p className="text-xs text-gray-500 mt-1">{slotLabel(order.delivery_slot, isAr)}</p>
            {order.delivery_date && (
              <p className="text-xs text-gray-500">
                {new Date(order.delivery_date + 'T00:00:00').toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
              </p>
            )}
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {paidOnline ? <CreditCard size={14} className="text-gray-400" aria-hidden="true" /> : <Wallet size={14} className="text-gray-400" aria-hidden="true" />}
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{isAr ? 'الدفع' : 'Payment'}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {paidOnline
                ? (isAr ? 'بطاقة · مدفوع' : 'Card · Paid')
                : (isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery')}
            </p>
            {order.payment_status === 'refunded' && (
              <p className="text-xs text-orange-600 font-bold mt-1">{isAr ? 'تم الاسترداد' : 'Refunded'}</p>
            )}
            {order.payment_status === 'partially_refunded' && (
              <p className="text-xs text-orange-600 font-bold mt-1">{isAr ? 'استرداد جزئي' : 'Partially refunded'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-gray-400" aria-hidden="true" />
          <h2 className="font-black text-gray-900">{isAr ? 'المنتجات' : 'Items'} ({items.length})</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <li key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.emoji && <span className="text-2xl shrink-0" aria-hidden="true">{item.emoji}</span>}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">×{item.quantity} · AED {Number(item.price_aed).toFixed(2)} {isAr ? 'لكل' : 'per'} {item.unit || 'kg'}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0">AED {(Number(item.price_aed) * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Invoice link */}
      <Link
        href={`/account/orders/${order.order_number}/invoice`}
        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 mb-5 hover:border-green-300 hover:bg-green-50/30 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={18} className="text-gray-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm">
              {isAr ? 'فاتورة ضريبية' : 'Tax invoice'}
            </p>
            <p className="text-xs text-gray-500">
              {isAr ? 'مع رقم TRN وتفصيل ضريبة القيمة المضافة' : 'With VAT TRN and full VAT breakdown'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-green-700 group-hover:underline shrink-0">
          {isAr ? 'عرض / تنزيل' : 'View / Print'} →
        </span>
      </Link>

      {/* Totals */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</dt>
            <dd>AED {subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-gray-600">
            <dt>{isAr ? 'الضريبة' : 'VAT (5%)'}</dt>
            <dd>AED {vat.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-gray-600">
            <dt>{isAr ? 'التوصيل' : 'Delivery'}</dt>
            <dd className={deliveryFee === 0 ? 'text-green-600 font-bold' : ''}>
              {deliveryFee === 0 ? (isAr ? 'مجاناً' : 'FREE') : `AED ${deliveryFee.toFixed(2)}`}
            </dd>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-700 font-semibold">
              <dt>{isAr ? `كود (${order.promo_code})` : `Promo (${order.promo_code})`}</dt>
              <dd>-AED {promoDiscount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100">
            <dt>{isAr ? 'الإجمالي' : 'Total'}</dt>
            <dd className="text-green-700 text-lg">AED {total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      {/* Reorder */}
      {!isCancelled && items.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-5">
          {reordered ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-green-700 font-bold text-sm inline-flex items-center gap-2">
                <CheckCircle2 size={16} aria-hidden="true" />
                {isAr ? 'تمت إضافة المنتجات إلى السلة' : 'Items added to cart'}
              </span>
              <Link href="/cart" className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {isAr ? 'الذهاب إلى السلة' : 'Go to cart'} →
              </Link>
            </div>
          ) : (
            <button
              onClick={reorder}
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              <ShoppingCart size={16} aria-hidden="true" />
              {isAr ? 'إعادة الطلب' : 'Reorder these items'}
            </button>
          )}
        </div>
      )}

      {/* Cancel — only while the order hasn't started processing */}
      {isCancellable && (
        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">
                {isAr ? 'هل تحتاج إلى إلغاء هذا الطلب؟' : 'Need to cancel this order?'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPaidCard
                  ? (isAr ? 'سيتم استرداد المبلغ إلى بطاقتك تلقائياً.' : 'A full refund will be issued to your card automatically.')
                  : (isAr ? 'يمكنك الإلغاء قبل بدء التحضير.' : 'You can cancel before preparation starts.')}
              </p>
            </div>
            <button
              onClick={cancelOrder}
              disabled={cancelling}
              className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {cancelling ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <XCircle size={14} aria-hidden="true" />}
              {cancelling ? (isAr ? 'جاري الإلغاء…' : 'Cancelling…') : (isAr ? 'إلغاء الطلب' : 'Cancel order')}
            </button>
          </div>
          {cancelError && <p role="alert" className="text-sm text-red-600 mt-3">{cancelError}</p>}
        </div>
      )}
    </div>
  )
}
