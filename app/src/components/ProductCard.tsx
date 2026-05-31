'use client'
import Link from 'next/link'
import { formatAED } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'
import { ProductImage } from './ProductImage'
import WishlistButton from './WishlistButton'
import { Leaf, MapPin } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface ProductCardProps {
  product: {
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
    isFeatured?: boolean
    stock: number
    emoji?: string
    origin?: string
    imageUrl?: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const inStock = product.stock > 0
  const { lang, tr } = useLang()

  const displayName = lang === 'ar' && product.nameAr ? product.nameAr : product.name
  const perUnit = lang === 'ar' ? `لكل ${product.unit}` : `per ${product.unit}`

  return (
    <div className={`surface-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 group flex flex-col ${!inStock ? 'opacity-80' : ''}`}>
      <Link href={`/product/${product.slug}`} className="block active:scale-[0.98] transition-transform">
        <div className={`relative aspect-square overflow-hidden bg-cream flex items-center justify-center ${!inStock ? 'grayscale' : ''}`}>
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.isOrganic && (
              <span className="tag-outline border-forest/30 text-forest bg-white/90 backdrop-blur-sm">
                <Leaf size={9} />
                <span className="hidden sm:inline">{lang === 'ar' ? 'عضوي' : 'Organic'}</span>
              </span>
            )}
            {!inStock && (
              <span className="tag-outline border-stone-300 text-stone-600 bg-white/90 backdrop-blur-sm">
                {lang === 'ar' ? 'نفد' : 'Out of stock'}
              </span>
            )}
          </div>
          {/* Sale badge top-right */}
          {product.compareAtPrice && product.compareAtPrice > product.priceAED && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center bg-clay text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
                -{Math.round((1 - product.priceAED / product.compareAtPrice) * 100)}%
              </span>
            </div>
          )}
          {/* Wishlist heart — bottom-right of image. WishlistButton stops
              click propagation so it doesn't trigger the parent Link. */}
          <div className="absolute bottom-2 right-2">
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </div>
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-playfair font-medium text-stone-900 text-sm md:text-base mb-0.5 hover:text-forest transition-colors line-clamp-2 leading-snug">
            {displayName}
          </h3>
        </Link>

        {product.origin && (
          <p className="inline-flex items-center gap-1 text-xs text-stone-400 mb-1">
            <MapPin size={9} className="flex-shrink-0" />
            <span className="truncate">{product.origin}</span>
          </p>
        )}

        <p className="text-xs text-stone-400 mb-2">{perUnit}</p>

        <div className="mt-auto">
          <div className="mb-2.5 leading-none">
            <span className="text-base md:text-xl font-semibold text-forest">
              {formatAED(product.priceAED)}
            </span>
            <span className="text-xs text-stone-400 font-normal ml-0.5">/{product.unit}</span>
            {product.compareAtPrice && product.compareAtPrice > product.priceAED && (
              <span className="text-xs text-stone-400 line-through ml-2">{formatAED(product.compareAtPrice)}</span>
            )}
          </div>
          {inStock ? (
            <AddToCartButton product={product} size="sm" />
          ) : (
            <button
              disabled
              className="w-full text-center text-xs font-semibold text-stone-400 py-2.5 rounded-lg bg-cream cursor-not-allowed border border-sand"
            >
              {tr.outOfStock}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
