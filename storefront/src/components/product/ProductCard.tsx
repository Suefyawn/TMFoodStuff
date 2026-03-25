'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { formatAED } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = product.variants?.[0]?.prices?.[0]?.amount ?? 0
  // Medusa stores prices in smallest unit (fils for AED; 1 fil = 0.01 AED)
  const priceInAED = price / 100

  return (
    <div className="card group hover:shadow-md transition-shadow duration-200">
      {/* Product image */}
      <Link href={`/shop/${product.handle}`} className="block relative overflow-hidden bg-gray-100 h-48">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🥬
          </div>
        )}
        {/* Fresh badge */}
        <span className="absolute top-2 left-2 bg-brand-green text-white text-xs px-2 py-0.5 rounded-full font-semibold">
          Fresh
        </span>
      </Link>

      {/* Product info */}
      <div className="p-4">
        <Link href={`/shop/${product.handle}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 hover:text-brand-green transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        {product.subtitle && (
          <p className="text-xs text-gray-500 mb-2">{product.subtitle}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Price in AED */}
          <div>
            <span className="text-brand-green font-bold text-base">
              {formatAED(priceInAED)}
            </span>
            <span className="text-gray-400 text-xs ml-1">/kg</span>
          </div>

          {/* Add to cart */}
          <button
            onClick={() => onAddToCart?.(product.id)}
            className="flex items-center gap-1.5 bg-brand-green text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors"
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
