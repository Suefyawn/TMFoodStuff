import Link from 'next/link'

export default function CartPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Empty state */}
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Add some fresh produce to get started!</p>
              <Link href="/shop" className="btn-primary inline-block">
                Browse Products
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>AED 0.00</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (5%)</span>
                  <span>AED 0.00</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-brand-green font-medium">Calculated at checkout</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>AED 0.00</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Inclusive of 5% UAE VAT</p>
                </div>
              </div>
              <Link
                href="/checkout"
                className="mt-6 w-full btn-primary text-center block"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/shop"
                className="mt-3 w-full text-center block text-brand-green hover:underline text-sm"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
