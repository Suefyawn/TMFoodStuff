'use client'
import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { formatAED } from '@/lib/utils'
import { Toast } from './Toast'
import { useLang } from '@/lib/use-lang'

interface Props {
  product: {
    id: string
    name: string
    nameAr?: string
    slug: string
    priceAED: number
    unit: string
    imageUrl?: string
    emoji?: string
  }
  size?: 'sm' | 'lg'
}

export default function AddToCartButton({ product, size = 'sm' }: Props) {
  const { items, addItem, updateQty } = useCartStore()
  const cartItem = items.find(i => i.id === product.id)
  const qty = cartItem?.quantity ?? 0
  const [showToast, setShowToast] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { lang, tr } = useLang()

  useEffect(() => setMounted(true), [])

  const displayName = lang === 'ar' && product.nameAr ? product.nameAr : product.name

  function handleAdd() {
    addItem(product, 1)
    setShowToast(true)
  }

  // Prevent hydration mismatch: render neutral button until client store is loaded
  if (!mounted) {
    if (size === 'lg') {
      return (
        <button className="w-full flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-4 rounded-2xl text-lg hover:bg-green-700 transition-colors shadow-lg active:scale-[0.99] min-h-[52px] focus-ring">
          <ShoppingCart size={20} /> {tr.addToCart}
        </button>
      )
    }
    return (
      <button className="w-full flex items-center justify-center gap-1.5 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors active:scale-95 min-h-[44px] focus-ring">
        <ShoppingCart size={14} /> {tr.addShort}
      </button>
    )
  }

  if (size === 'lg') {
    return (
      <div>
        <Toast
          message={`${displayName} ${tr.addedToCart}`}
          show={showToast}
          onClose={() => setShowToast(false)}
        />
        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-4 rounded-2xl text-lg hover:bg-green-700 transition-colors shadow-lg active:scale-[0.99] min-h-[52px] focus-ring"
          >
            <ShoppingCart size={20} /> {tr.addToCart}
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateQty(product.id, qty - 1)}
              className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-ring"
              aria-label={lang === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
            >
              <Minus size={18} />
            </button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-black text-gray-900">{qty}</div>
              <div className="text-xs text-gray-400">{formatAED(product.priceAED * qty)}</div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="w-14 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors shadow focus-ring"
              aria-label={lang === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <Toast
        message={`${displayName} ${tr.addedToCart}`}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
      {qty === 0 ? (
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-1.5 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors active:scale-95 min-h-[44px] focus-ring"
        >
          <ShoppingCart size={14} /> {tr.addShort}
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateQty(product.id, qty - 1)}
            className="w-11 h-11 md:w-9 md:h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 focus-ring"
            aria-label={lang === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
          >
            <Minus size={13} />
          </button>
          <span className="flex-1 text-center font-black text-gray-900 text-base">{qty}</span>
          <button
            type="button"
            onClick={handleAdd}
            className="w-11 h-11 md:w-9 md:h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors flex-shrink-0 focus-ring"
            aria-label={lang === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
          >
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
