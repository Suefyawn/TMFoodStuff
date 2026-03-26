import Link from 'next/link'
import { formatAED } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'
import { Leaf, MapPin, ShoppingCart } from 'lucide-react'

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
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${!inStock ? 'grayscale' : ''}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
              {product.emoji || ''}
            </span>
          )}
          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.isOrganic && (
              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                <Leaf size={10} />
                Organic
              </span>
            )}
            {!inStock && (
              <span className="bg-gray-700 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-bold text-gray-900 text-sm mb-0.5 hover:text-green-600 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {product.origin && (
          <p className="inline-flex items-center gap-1 text-xs text-gray-400 mb-2">
            <MapPin size={10} className="flex-shrink-0" />
            {product.origin}
          </p>
        )}

        <p className="text-xs text-gray-400 mb-3">per {product.unit}</p>

        <div className="mt-auto">
          <div className="text-xl font-black text-green-600 mb-3 leading-none">
            {formatAED(product.priceAED)}
            <span className="text-xs text-gray-400 font-normal ml-1">/{product.unit}</span>
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
