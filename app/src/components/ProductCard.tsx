import Link from 'next/link'
import { formatAED } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'
import { ProductImage } from './ProductImage'
import { Leaf, MapPin } from 'lucide-react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    priceAED: number
    unit: string
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

  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-1 group flex flex-col shadow-sm hover:shadow-xl ${!inStock ? 'opacity-80' : ''}`}>
      <Link href={`/product/${product.slug}`} className="block active:scale-95 transition-transform">
        <div className={`relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${!inStock ? 'grayscale' : ''}`}>
          {product.imageUrl ? (
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              emoji={product.emoji}
            />
          ) : (
            <span className="text-5xl md:text-7xl group-hover:scale-110 transition-transform duration-300">
              {product.emoji || ''}
            </span>
          )}
          {/* Badges top-left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isOrganic && (
              <span className="inline-flex items-center gap-0.5 bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                <Leaf size={9} />
                <span className="hidden sm:inline">Organic</span>
              </span>
            )}
            {!inStock && (
              <span className="bg-gray-700 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                Out
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-2.5 md:p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-bold text-gray-900 text-xs md:text-sm mb-0.5 hover:text-green-600 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {product.origin && (
          <p className="inline-flex items-center gap-1 text-xs text-gray-400 mb-1">
            <MapPin size={9} className="flex-shrink-0" />
            <span className="truncate">{product.origin}</span>
          </p>
        )}

        <p className="text-xs text-gray-400 mb-2">per {product.unit}</p>

        <div className="mt-auto">
          <div className="text-base md:text-xl font-black text-green-600 mb-2 leading-none">
            {formatAED(product.priceAED)}
            <span className="text-xs text-gray-400 font-normal ml-0.5">/{product.unit}</span>
          </div>
          {inStock ? (
            <AddToCartButton product={product} size="sm" />
          ) : (
            <button
              disabled
              className="w-full text-center text-xs font-bold text-gray-400 py-2.5 rounded-xl bg-gray-50 cursor-not-allowed border border-gray-200"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
