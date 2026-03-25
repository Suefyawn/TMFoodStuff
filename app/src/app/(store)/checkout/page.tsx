'use client'
import { useState } from 'react'
import { formatAED, calculateTotal } from '@/lib/utils'

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('telr')
  const subtotal = 0

  const { vat, deliveryFee, total } = calculateTotal(subtotal)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-black text-gray-900 text-xl mb-6">Delivery Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Full Name *', type: 'text', placeholder: 'Ahmed Al Mansouri', span: false },
                { label: 'Phone Number *', type: 'tel', placeholder: '+971 50 000 0000', span: false },
                { label: 'Email', type: 'email', placeholder: 'you@example.com', span: false },
              ].map(field => (
                <div key={field.label} className={field.span ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Emirate *</label>
                <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors bg-white">
                  <option value="">Select Emirate</option>
                  {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Area / District *</label>
                <input type="text" placeholder="JLT, Marina, Deira, Khalidiyah..." className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Building / Villa</label>
                <input type="text" placeholder="Tower name or villa number" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Makani Number <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="Dubai address code" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order Notes</label>
                <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors" rows={2} placeholder="Leave at door, call on arrival, specific instructions..." />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-black text-gray-900 text-xl mb-6">Payment Method</h2>
            <div className="space-y-3">
              {[
                { id: 'telr', label: 'Pay Online', sub: 'Visa, Mastercard, AMEX — secured by Telr', icon: '💳' },
                { id: 'cod', label: 'Cash on Delivery', sub: 'Pay in cash when your order arrives', icon: '💵' },
              ].map(method => (
                <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === method.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="sr-only" />
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{method.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{method.sub}</div>
                  </div>
                  {paymentMethod === method.id && <span className="text-green-600 font-black text-lg">✓</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="font-black text-gray-900 text-xl mb-6">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatAED(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (5%)</span>
                <span>{formatAED(vat)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600 font-bold">Free</span> : formatAED(deliveryFee)}</span>
              </div>
              <div className="border-t-2 pt-4 flex justify-between font-black text-gray-900 text-lg">
                <span>Total</span>
                <span className="text-green-700">{formatAED(total)}</span>
              </div>
            </div>
            <button className="w-full mt-6 bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-colors text-lg shadow-lg">
              Place Order →
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">🔒 Secure checkout · All prices include 5% UAE VAT</p>
          </div>
        </div>
      </div>
    </div>
  )
}
