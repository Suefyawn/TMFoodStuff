export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 mb-8 text-sm">All prices in AED · 5% UAE VAT applied</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact */}
            <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Phone (UAE)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg bg-gray-50 text-gray-600 text-sm">
                      +971
                    </span>
                    <input
                      type="tel"
                      placeholder="5X XXX XXXX"
                      className="flex-1 border rounded-r-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Address */}
            <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emirates</label>
                  <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green">
                    <option value="">Select Emirate</option>
                    <option>Dubai</option>
                    <option>Abu Dhabi</option>
                    <option>Sharjah</option>
                    <option>Ajman</option>
                    <option>Ras Al Khaimah</option>
                    <option>Fujairah</option>
                    <option>Umm Al Quwain</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area / District</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street & Building</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apartment / Villa</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Makani / Plus Code</label>
                  <input type="text" placeholder="Optional" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-green transition-colors">
                  <input type="radio" name="payment" value="card" className="accent-brand-green" defaultChecked />
                  <span className="font-medium text-gray-800">💳 Credit / Debit Card (Telr)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-green transition-colors">
                  <input type="radio" name="payment" value="paytabs" className="accent-brand-green" />
                  <span className="font-medium text-gray-800">🏦 PayTabs</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-green transition-colors">
                  <input type="radio" name="payment" value="cod" className="accent-brand-green" />
                  <span className="font-medium text-gray-800">💵 Cash on Delivery</span>
                </label>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="text-gray-500 text-sm mb-4 italic">No items in cart.</div>
              <div className="border-t pt-4 space-y-2 text-sm">
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
                  <span>AED —</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total (AED)</span>
                    <span>AED 0.00</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Inclusive of 5% UAE Federal VAT</p>
                </div>
              </div>
              <button className="mt-6 w-full btn-primary">
                Place Order
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                By placing your order you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
