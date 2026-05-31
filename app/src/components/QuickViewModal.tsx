'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight, Leaf, MapPin } from 'lucide-react'
import { ProductImage } from './ProductImage'
import AddToCartButton from './AddToCartButton'
import { formatAED } from '@/lib/utils'
import { useLang } from '@/lib/use-lang'

interface Product {
  id: string
  name: string
  nameAr?: string
  slug: string
  priceAED: number
  compareAtPrice?: number
  unit: string
  description?: string
  descriptionAr?: string
  isOrganic?: boolean
  stock: number
  emoji?: string
  origin?: string
  imageUrl?: string
}

interface Props {
  product: Product
  onClose: () => void
}

// Quick-look modal triggered from product cards in the shop grid. Avoids a
// full page navigation when a customer just wants to add an item from the
// listing. Uses the existing AddToCartButton so qty-in-cart state stays
// consistent with the rest of the storefront. Press-Escape and click-outside
// dismiss; body scroll locked while open.
export default function QuickViewModal({ product, onClose }: Props) {
  const { lang } = useLang()
  const displayName = lang === 'ar' && product.nameAr ? product.nameAr : product.name
  const displayDesc = lang === 'ar' && product.descriptionAr ? product.descriptionAr : product.description
  const inStock = product.stock > 0
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.priceAED

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === 'ar' ? 'إغلاق العرض السريع' : 'Close quick view'}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shadow-md"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="grid sm:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square bg-cream flex items-center justify-center">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.isOrganic && (
                <span className="tag-outline border-forest/30 text-forest bg-white/90 backdrop-blur-sm">
                  <Leaf size={10} aria-hidden="true" />
                  {lang === 'ar' ? 'عضوي' : 'Organic'}
                </span>
              )}
              {onSale && (
                <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                  -{Math.round((1 - product.priceAED / product.compareAtPrice!) * 100)}%
                </span>
              )}
              {!inStock && (
                <span className="bg-gray-700 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                  {lang === 'ar' ? 'نفد المخزون' : 'Sold out'}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-7 flex flex-col">
            <h2 className="text-2xl font-black text-gray-900 leading-tight pr-8">{displayName}</h2>

            {product.origin && (
              <p className="inline-flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <MapPin size={13} aria-hidden="true" />
                <span>{product.origin}</span>
              </p>
            )}

            <div className="mt-4 leading-none">
              <span className="text-3xl font-black text-forest">{formatAED(product.priceAED)}</span>
              <span className="text-sm text-gray-500 ml-1.5">/{product.unit}</span>
              {onSale && (
                <span className="text-sm text-gray-400 line-through ml-3">
                  {formatAED(product.compareAtPrice!)}
                </span>
              )}
            </div>

            {displayDesc && (
              <p className="mt-4 text-sm text-gray-600 line-clamp-4 leading-relaxed">{displayDesc}</p>
            )}

            <div className="mt-6">
              {inStock ? (
                <AddToCartButton product={product} size="lg" />
              ) : (
                <button
                  disabled
                  className="w-full text-center font-bold text-gray-400 py-4 rounded-2xl bg-gray-100 cursor-not-allowed"
                >
                  {lang === 'ar' ? 'نفد المخزون' : 'Out of stock'}
                </button>
              )}
            </div>

            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-forest-dark hover:text-forest-dark transition-colors"
            >
              {lang === 'ar' ? 'عرض التفاصيل الكاملة' : 'View full details'}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
