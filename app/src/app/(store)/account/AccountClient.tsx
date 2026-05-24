'use client'
import Link from 'next/link'
import { Package, LogOut, ShoppingBag, User as UserIcon, MapPin, Heart, ChevronRight, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface OrderRow {
  id: number
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  delivery_slot: string | null
  delivery_emirate: string | null
  delivery_area: string | null
  total: number
  total_aed: number | null
  items: unknown
}

interface AccountClientProps {
  email: string
  fullName: string
  orders: OrderRow[]
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-200 text-gray-600',
}

function statusLabel(s: string, isAr: boolean): string {
  const en: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  const ar: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'تم التأكيد',
    processing: 'قيد التحضير',
    out_for_delivery: 'خرج للتوصيل',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
  }
  return (isAr ? ar : en)[s] ?? s
}

export default function AccountClient({ email, fullName, orders }: AccountClientProps) {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
              <UserIcon size={22} className="text-green-700" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 truncate">
                {fullName || (isAr ? 'مرحباً' : 'Welcome')}
              </h1>
              <p className="text-sm text-gray-500 truncate">{email}</p>
            </div>
          </div>
          <a
            href="/account/logout"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} aria-hidden="true" />
            {isAr ? 'تسجيل الخروج' : 'Sign out'}
          </a>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link
          href="/account/points"
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-green-300 hover:bg-green-50/30 transition-colors group"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-emerald-700" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{isAr ? 'النقاط' : 'Points'}</p>
            <p className="text-xs text-gray-500">{isAr ? 'الرصيد والمكافآت' : 'Balance & rewards'}</p>
          </div>
          <ChevronRight size={16} className={`text-gray-300 group-hover:text-green-700 ${isAr ? 'rotate-180' : ''}`} aria-hidden="true" />
        </Link>
        <Link
          href="/account/addresses"
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-green-300 hover:bg-green-50/30 transition-colors group"
        >
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-green-700" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{isAr ? 'العناوين' : 'Addresses'}</p>
            <p className="text-xs text-gray-500">{isAr ? 'حفظ عناوين التوصيل' : 'Save delivery addresses'}</p>
          </div>
          <ChevronRight size={16} className={`text-gray-300 group-hover:text-green-700 ${isAr ? 'rotate-180' : ''}`} aria-hidden="true" />
        </Link>
        <Link
          href="/account/wishlist"
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-green-300 hover:bg-green-50/30 transition-colors group"
        >
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
            <Heart size={18} className="text-rose-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{isAr ? 'قائمة المفضلة' : 'Wishlist'}</p>
            <p className="text-xs text-gray-500">{isAr ? 'المنتجات التي حفظتها' : 'Products you saved'}</p>
          </div>
          <ChevronRight size={16} className={`text-gray-300 group-hover:text-green-700 ${isAr ? 'rotate-180' : ''}`} aria-hidden="true" />
        </Link>
      </div>

      {/* Orders */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Package size={18} className="text-gray-400" aria-hidden="true" />
          <h2 className="text-lg font-black text-gray-900">
            {isAr ? 'طلباتي' : 'My Orders'} ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={26} className="text-gray-300" aria-hidden="true" />
            </div>
            <p className="text-gray-700 font-bold mb-1">
              {isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              {isAr ? 'تسوّق وستظهر طلباتك هنا.' : 'Start shopping and your orders will appear here.'}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              {isAr ? 'تصفّح المنتجات' : 'Browse products'}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.map(o => {
              const items = Array.isArray(o.items) ? (o.items as Array<{ name: string; quantity: number }>) : []
              const itemSummary = items.slice(0, 3).map(i => `${i.name} ×${i.quantity}`).join(', ')
                + (items.length > 3 ? ` +${items.length - 3}` : '')
              const total = Number(o.total_aed ?? o.total ?? 0)
              return (
                <li key={o.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-gray-900 text-sm">#{o.order_number}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel(o.status, isAr)}
                        </span>
                        {o.payment_status === 'paid' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {isAr ? 'مدفوع' : 'PAID'}
                          </span>
                        )}
                      </div>
                      {itemSummary && (
                        <p className="text-xs text-gray-500 line-clamp-1">{itemSummary}</p>
                      )}
                      {o.delivery_area && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {o.delivery_area}, {o.delivery_emirate}
                        </p>
                      )}
                    </div>
                    <div className={`text-${isAr ? 'left' : 'right'} flex flex-col items-end shrink-0`}>
                      <span className="text-sm font-black text-green-700">AED {total.toFixed(2)}</span>
                      <Link
                        href={`/account/orders/${o.order_number}`}
                        className="text-xs font-bold text-gray-500 hover:text-green-700 mt-1"
                      >
                        {isAr ? 'التفاصيل' : 'View'} →
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
