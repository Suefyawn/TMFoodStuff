'use client'
import Link from 'next/link'
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useLang } from '@/lib/use-lang'

interface WishlistProduct {
  id: string
  slug: string
  name: string
  nameAr: string
  priceAED: number
  compareAtPrice?: number
  unit: string
  stock: number
  emoji: string
  imageUrl?: string
  isOrganic: boolean
  isFeatured: boolean
  origin: string
}

export default function WishlistClient({ initialItems }: { initialItems: WishlistProduct[] }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-forest-dark mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
          <Heart size={22} className="text-rose-600 fill-rose-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">{isAr ? 'قائمة المفضلة' : 'My Wishlist'}</h1>
          <p className="text-sm text-gray-500">
            {initialItems.length} {isAr ? 'منتج' : initialItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {initialItems.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={26} className="text-rose-300" aria-hidden="true" />
          </div>
          <p className="text-gray-700 font-bold mb-1">{isAr ? 'لا توجد منتجات محفوظة بعد' : 'No saved products yet'}</p>
          <p className="text-sm text-gray-500 mb-5">
            {isAr ? 'اضغط على القلب على أي منتج لحفظه هنا.' : 'Tap the heart on any product to save it here.'}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <ShoppingBag size={16} aria-hidden="true" />
            {isAr ? 'تصفّح المنتجات' : 'Browse products'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {initialItems.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
