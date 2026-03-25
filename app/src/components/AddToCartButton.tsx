'use client'
import { useState } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

interface AddToCartButtonProps {
  inStock: boolean
}

export default function AddToCartButton({ inStock }: AddToCartButtonProps) {
  const [qty, setQty] = useState(0)

  function handleAdd() {
    setQty(q => q + 1)
  }
  function handleMinus() {
    setQty(q => Math.max(0, q - 1))
  }

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        disabled={!inStock}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <ShoppingCart size={15} /> Add to Cart
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleMinus}
        className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition-colors"
      >
        <Minus size={14} />
      </button>
      <span className="flex-1 text-center font-black text-gray-900">{qty}</span>
      <button
        onClick={handleAdd}
        className="w-9 h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center font-bold transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
