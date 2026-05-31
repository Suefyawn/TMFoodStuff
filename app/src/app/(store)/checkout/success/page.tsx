import Link from 'next/link'
import { CheckCircle, ShoppingBag, Package } from 'lucide-react'
import { getServerLocale } from '@/lib/server-locale'

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const locale = await getServerLocale()
  const isAr = locale === 'ar'

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-forest" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-playfair font-bold text-stone-900 mb-3">
        {isAr ? 'تم الدفع بنجاح!' : 'Payment successful!'}
      </h1>
      <p className="text-stone-500 mb-2 text-lg">
        {isAr ? 'شكراً لك — تم تأكيد طلبك.' : 'Thank you — your order is confirmed.'}
      </p>
      {order && <p className="text-forest-dark font-black text-2xl mb-3 font-mono">#{order}</p>}
      <p className="text-stone-500 mb-8 text-sm max-w-md mx-auto">
        {isAr
          ? 'أرسلنا إيصالاً عبر البريد الإلكتروني وسنتواصل معك قبل التوصيل.'
          : "We've emailed a receipt and will contact you before delivery."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={order ? `/track?o=${encodeURIComponent(order)}` : '/track'}
          className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          <Package size={18} aria-hidden="true" />
          {isAr ? 'تتبع طلبك' : 'Track your order'}
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <ShoppingBag size={18} aria-hidden="true" />
          {isAr ? 'متابعة التسوق' : 'Continue shopping'}
        </Link>
      </div>
    </div>
  )
}
