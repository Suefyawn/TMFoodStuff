'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ShoppingBag, Package, ShieldCheck } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { formatAED, calculateTotal } from '@/lib/utils'

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']

const DELIVERY_SLOTS = [
  { id: 'morning', label: 'Morning', time: '8:00 AM – 12:00 PM', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM – 5:00 PM', icon: '☀️' },
  { id: 'evening', label: 'Evening', time: '5:00 PM – 10:00 PM', icon: '🌙' },
]

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState('telr')
  const [submitted, setSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    emirate: '',
    area: '',
    building: '',
    makani: '',
    notes: '',
    deliverySlot: '',
  })

  const sub = subtotal()
  const { vat, deliveryFee, total } = calculateTotal(sub)
  const finalTotal = total - promoDiscount

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function applyPromo() {
    if (promoCode.toUpperCase() === 'FRESH10') {
      const discount = parseFloat((sub * 0.10).toFixed(2))
      setPromoApplied(true)
      setPromoDiscount(discount)
    } else {
      alert('Invalid promo code')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.emirate || !form.area) {
      alert('Please fill in all required fields')
      return
    }
    if (!form.deliverySlot) {
      alert('Please select a delivery slot')
      return
    }
    setOrderNumber(`TM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`)
    clearCart()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Order Placed!</h1>
        <p className="text-gray-500 mb-2 text-lg">Thank you, {form.fullName}.</p>
        {orderNumber && (
          <p className="text-green-700 font-black text-xl mb-2">Order #{orderNumber}</p>
        )}
        <p className="text-gray-500 mb-8">We&apos;ll send you a WhatsApp confirmation shortly.</p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          <ShoppingBag size={18} /> Continue Shopping
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Nothing to checkout</h2>
        <p className="text-gray-500 mb-8">Your cart is empty. Add some fresh produce first!</p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-black text-gray-900 text-xl mb-6">Delivery Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Ahmed Al Mansouri"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+971 50 000 0000"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="emirate" className="block text-sm font-semibold text-gray-700 mb-1.5">Emirate *</label>
                  <select
                    id="emirate"
                    name="emirate"
                    value={form.emirate}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors bg-white"
                    required
                  >
                    <option value="">Select Emirate</option>
                    {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="area" className="block text-sm font-semibold text-gray-700 mb-1.5">Area / District *</label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="JLT, Marina, Deira, Khalidiyah..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="building" className="block text-sm font-semibold text-gray-700 mb-1.5">Building / Villa</label>
                  <input
                    type="text"
                    id="building"
                    name="building"
                    value={form.building}
                    onChange={handleChange}
                    placeholder="Tower name or villa number"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="makani" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Makani Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="makani"
                    name="makani"
                    value={form.makani}
                    onChange={handleChange}
                    placeholder="Dubai address code"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">Order Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    rows={2}
                    placeholder="Leave at door, call on arrival, specific instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Delivery Slot */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-black text-gray-900 text-xl mb-5">Delivery Slot</h2>
              <div className="grid grid-cols-3 gap-3">
                {DELIVERY_SLOTS.map(slot => (
                  <label
                    key={slot.id}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                      form.deliverySlot === slot.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot.id}
                      checked={form.deliverySlot === slot.id}
                      onChange={e => setForm(f => ({ ...f, deliverySlot: e.target.value }))}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">{slot.icon}</span>
                    <span className="font-bold text-gray-900 text-sm">{slot.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{slot.time}</span>
                    {form.deliverySlot === slot.id && (
                      <span className="text-green-600 font-black text-xs mt-1">✓ Selected</span>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                🚚 Free delivery · Same day delivery available
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-black text-gray-900 text-xl mb-6">Payment Method</h2>
              <div className="space-y-3 mb-6">
                {[
                  { id: 'telr', label: 'Pay by Card', sub: 'Visa, Mastercard, AMEX — card charged only if COD order not fulfilled', icon: '💳' },
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Card required as guarantee — charged only if delivery fails', icon: '💵' },
                ].map(method => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="sr-only"
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{method.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{method.sub}</div>
                    </div>
                    {paymentMethod === method.id && <span className="text-green-600 font-black text-lg">✓</span>}
                  </label>
                ))}
              </div>

              {/* Card Details — shown for both methods */}
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-4">Card Details (Required as security guarantee)</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {paymentMethod === 'cod'
                      ? 'Card required as delivery guarantee — only charged if you\'re unavailable at delivery'
                      : 'Secure card payment via Telr'}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono"
                      onChange={e => {
                        const v = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
                        e.target.value = v
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date *</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVV *</label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono"
                    />
                  </div>
                </div>
                {paymentMethod === 'cod' && (
                  <p className="text-xs text-amber-700 mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    ⚠️ For COD orders, your card will only be charged if you are unavailable at delivery time.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="font-black text-gray-900 text-xl mb-4">Order Summary</h2>

              {/* Cart items */}
              <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : item.emoji ? (
                        <span className="text-xl">{item.emoji}</span>
                      ) : (
                        <Package size={18} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{formatAED(item.priceAED * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>{formatAED(sub)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (5%)</span>
                  <span>{formatAED(vat)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0
                      ? <span className="text-green-600 font-bold">Free</span>
                      : formatAED(deliveryFee)
                    }
                  </span>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-800 font-semibold flex items-center gap-1.5">
                  🎉 <span>Free delivery — Grand Launch Offer!</span>
                </div>

                {/* Promo Code */}
                <div className="border-t pt-4 mt-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Promo Code</label>
                  {promoApplied ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                      <CheckCircle size={16} />
                      FRESH10 applied — AED {promoDiscount.toFixed(2)} off!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        className="bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Promo (FRESH10)</span>
                    <span>-{formatAED(promoDiscount)}</span>
                  </div>
                )}
                <div className="border-t-2 pt-4 flex justify-between font-black text-gray-900 text-lg">
                  <span>Total</span>
                  <span className="text-green-700">{formatAED(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-colors text-lg shadow-lg"
              >
                Place Order →
              </button>
              <p className="text-xs text-gray-400 text-center mt-4">🔒 Secure checkout · All prices include 5% UAE VAT</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
