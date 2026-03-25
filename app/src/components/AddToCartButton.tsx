'use client'
import { useState } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { formatAED } from '@/lib/utils'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    priceAED: number
    unit: string
    imageUrl?: string
  }
  size?: 'sm' | 'lg'
}

export default function AddToCartButton({ product, size = 'lg' }: Props) {
  const [qty, setQty] = useState(0)

  if (size === 'lg') {
    return (
      <div>
        {qty === 0 ? (
          <button
            onClick={() => setQty(1)}
            className="w-full flex items-center justify-center gap-3 bg-green-600 text-white font-black py-4 rounded-2xl text-lg hover:bg-green-700 transition-colors shadow-lg active:scale-[0.99]"
          >
            <ShoppingCart size={20} /> Add to Cart
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQty(q => Math.max(0, q - 1))}
              className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xl transition-colors"
            >
              <Minus size={18} />
            </button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-black text-gray-900">{qty}</div>
              <div className="text-xs text-gray-400">{formatAED(product.priceAED * qty)}</div>
            </div>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-14 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center font-bold text-xl transition-colors shadow"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // sm size for ProductCard
  return (
    <div>
      {qty === 0 ? (
        <button
          onClick={() => setQty(1)}
          className="w-full flex items-center justify-center gap-1.5 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors active:scale-95"
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={() => setQty(q => Math.max(0, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Minus size={13} />
          </button>
          <span className="flex-1 text-center font-black text-gray-900 text-base">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors">
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
