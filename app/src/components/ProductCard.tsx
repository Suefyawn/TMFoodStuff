import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { formatAED } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    priceAED: number
    unit: string
    isOrganic?: boolean
    stock: number
    images?: Array<{ image: { url: string; alt?: string } }>
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.image?.url || null
  const inStock = product.stock > 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🛒</div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isOrganic && (
              <span className="bg-green-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">🌱 Organic</span>
            )}
            {!inStock && (
              <span className="bg-gray-800 text-white text-xs font-black px-2.5 py-1 rounded-full">Out of Stock</span>
            )}
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-bold text-gray-900 text-sm mb-0.5 hover:text-green-600 transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-400 mb-3">per {product.unit}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-black text-green-700">{formatAED(product.priceAED)}</span>
          <button disabled={!inStock} className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
            <ShoppingCart size={13} /> Add
          </button>
        </div>
      </div>
    </div>
  )
}
