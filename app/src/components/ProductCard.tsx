import Link from 'next/link'
import { formatAED } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'

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
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
              {product.emoji || '🛒'}
            </span>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isOrganic && (
              <span className="bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">🌱 Organic</span>
            )}
            {!inStock && (
              <span className="bg-gray-700 text-white text-xs font-black px-2 py-0.5 rounded-full">Out of Stock</span>
            )}
          </div>
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-bold text-gray-900 text-sm mb-0.5 hover:text-green-600 transition-colors line-clamp-2 leading-snug">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-400 mb-1">per {product.unit}</p>
        {product.origin && <p className="text-xs text-gray-400 mb-3">🌍 {product.origin}</p>}
        <div className="mt-auto">
          <div className="text-xl font-black text-green-700 mb-3">{formatAED(product.priceAED)}</div>
          {inStock ? (
            <AddToCartButton product={product} size="sm" />
          ) : (
            <button disabled className="w-full text-center text-xs font-bold text-gray-400 py-2.5 rounded-xl bg-gray-50 cursor-not-allowed">
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
