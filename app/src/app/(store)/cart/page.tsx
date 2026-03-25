'use client'
import Link from 'next/link'
import { ShoppingCart, ArrowRight } from 'lucide-react'

export default function CartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingCart className="text-green-600" /> Your Cart
      </h1>
      <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="text-7xl mb-5">🛒</div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 text-lg">Add some fresh produce to get started</p>
        <Link href="/shop" className="bg-green-600 text-white font-black px-8 py-4 rounded-2xl text-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 shadow-lg">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
