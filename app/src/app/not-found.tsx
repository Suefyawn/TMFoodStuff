import Link from 'next/link'
import { Search, Home, Apple, Leaf } from 'lucide-react'
import { getServerLocale } from '@/lib/server-locale'

export default async function NotFound() {
  const locale = await getServerLocale()
  const isAr = locale === 'ar'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center py-16" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-7xl mb-4" aria-hidden="true">🥦</div>
      <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">404</h1>
      <p className="text-lg font-bold text-gray-700 mb-2">
        {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
      </p>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">
        {isAr
          ? 'يبدو أن هذه الصفحة نفدت من المخزون. لنعدك إلى المنتجات الطازجة.'
          : "Looks like this page went out of stock. Let's get you back to the fresh stuff."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors shadow-sm"
        >
          <Apple size={16} aria-hidden="true" />
          {isAr ? 'تصفح المتجر' : 'Browse the shop'}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-bold px-6 py-3 rounded-2xl border border-gray-200 transition-colors"
        >
          <Home size={16} aria-hidden="true" />
          {isAr ? 'الصفحة الرئيسية' : 'Go home'}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md w-full">
        {([
          ['fruits', isAr ? 'فواكه' : 'Fruits', Apple],
          ['vegetables', isAr ? 'خضروات' : 'Vegetables', Leaf],
          ['organic', isAr ? 'عضوي' : 'Organic', Leaf],
          ['gifts', isAr ? 'صناديق' : 'Boxes', Search],
        ] as const).map(([slug, label, Icon]) => (
          <Link
            key={slug}
            href={`/shop?category=${slug}`}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 hover:text-green-700 bg-white border border-gray-200 hover:border-green-400 rounded-xl px-3 py-2.5 transition-colors"
          >
            <Icon size={12} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
