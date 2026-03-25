'use client'

import Link from 'next/link'
import { X, ShoppingBag } from 'lucide-react'
import { formatAED, formatWithVAT } from '@/lib/utils'
import type { Cart } from '@/types'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart?: Cart | null
}

export default function CartDrawer({ isOpen, onClose, cart }: CartDrawerProps) {
  const subtotal = cart?.subtotal ?? 0
  const subtotalAED = subtotal / 100 // Convert fils to AED
  const vatFormatted = formatWithVAT(subtotalAED)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-green" />
            <h2 className="font-bold text-lg text-gray-900">Your Cart</h2>
            {cart?.items && cart.items.length > 0 && (
              <span className="bg-brand-green text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                {cart.items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!cart?.items || cart.items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="font-semibold text-gray-700 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 text-sm mb-6">Add some fresh produce!</p>
              <button onClick={onClose} className="btn-primary">
                Browse Products
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3 border-b last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">
                    🥬
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm leading-tight truncate">
                      {item.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-brand-green font-semibold text-sm">
                        {formatAED((item.unit_price / 100) * item.quantity)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {item.quantity} × {formatAED(item.unit_price / 100)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with totals */}
        {cart?.items && cart.items.length > 0 && (
          <div className="border-t px-6 py-5 bg-gray-50">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{vatFormatted.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (5%)</span>
                <span>{vatFormatted.vat}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                <span>Total (AED)</span>
                <span>{vatFormatted.total}</span>
              </div>
              <p className="text-xs text-gray-400">Inclusive of 5% UAE VAT</p>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full btn-primary text-center block mb-2"
            >
              Checkout
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="w-full text-center block text-brand-green hover:underline text-sm"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
