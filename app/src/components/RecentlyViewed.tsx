'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { useRecentlyViewedStore } from '@/lib/recently-viewed-store'
import { useLang } from '@/lib/use-lang'

// Horizontal strip of products the visitor has recently opened. Hidden when
// the store is empty so it doesn't take up space on a fresh session.
//
// `excludeSlug` lets the product detail page omit the product the visitor is
// currently looking at.
export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const items = useRecentlyViewedStore(s => s.items)
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [mounted, setMounted] = useState(false)

  // Avoid an SSR/hydration mismatch — zustand-persist hydrates after mount.
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const list = excludeSlug ? items.filter(i => i.slug !== excludeSlug) : items
  if (list.length === 0) return null

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <h2 className="text-base md:text-lg font-black text-gray-900 mb-4 inline-flex items-center gap-2">
        <Clock size={16} className="text-gray-400" aria-hidden="true" />
        {isAr ? 'تصفّحتها مؤخراً' : 'Recently viewed'}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {list.map(item => (
          <Link
            key={item.slug}
            href={`/product/${item.slug}`}
            className="flex-shrink-0 w-32 group"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 mb-1.5 relative">
              <ProductImage
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-forest-dark transition-colors">
              {isAr && item.nameAr ? item.nameAr : item.name}
            </p>
            <p className="text-xs text-forest-dark font-black mt-0.5">
              AED {item.priceAED.toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
