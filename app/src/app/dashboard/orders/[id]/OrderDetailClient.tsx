'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import OrderStatusUpdater from './OrderStatusUpdater'

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/orders/${orderId}`, { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        if (data?.error) setOrder(null)
        else setOrder(data)
        setLoading(false)
      })
      .catch(() => {
        setOrder(null)
        setLoading(false)
      })
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading order…</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Order not found</div>
      </div>
    )
  }

  const phone = order.customer_phone || ''
  const waMsg = encodeURIComponent(
    `Hi ${(order.customer_full_name || order.customer_name) || ''}! Your TMFoodStuff order #${order.order_number} has been confirmed. We'll deliver during your ${order.delivery_slot || 'selected'} slot. Thank you! 🥦`
  )
  const items = (order as any)._items || []

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders" className="text-gray-500 hover:text-white text-sm transition-colors">← Orders</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-white font-black">{order.order_number}</h1>
        </div>
        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            💬 WhatsApp Customer
          </a>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <OrderStatusUpdater orderId={String(order.id)} currentStatus={order.status || 'pending'} />

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-4">👤 Customer</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-white font-semibold">{order.customer_full_name || order.customer_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-white">{phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-300">{order.customer_email || '—'}</span></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-4">📍 Delivery</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Slot</span><span className="text-white font-semibold capitalize">{order.delivery_slot || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="text-white">{order.delivery_area || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Emirate</span><span className="text-white">{order.delivery_emirate || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Building</span><span className="text-gray-300">{order.delivery_building || '—'}</span></div>
              {order.delivery_makani && <div className="flex justify-between"><span className="text-gray-500">Makani</span><span className="text-gray-300">{order.delivery_makani}</span></div>}
              {order.delivery_notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span className="text-yellow-400">{order.delivery_notes}</span></div>}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <h3 className="text-white font-black p-5 border-b border-gray-800">🛒 Order Items</h3>
          <div className="divide-y divide-gray-800">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white font-semibold text-sm">{item.product_name || item.name}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity} {item.unit}</p>
                </div>
                <span className="text-green-400 font-bold text-sm">AED {((item.unit_price_aed || item.price_aed || item.priceAED || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-gray-800 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>AED {Number(order.subtotal_aed ?? order.subtotal ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>VAT 5%</span><span>AED {Number(order.vat_aed ?? order.vat ?? 0).toFixed(2)}</span></div>
            {Number(order.promo_discount_aed ?? order.promo_discount ?? 0) > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Promo ({order.promo_code})</span>
                <span>-AED {Number(order.promo_discount_aed ?? order.promo_discount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-black text-base border-t border-gray-700 pt-2"><span>Total</span><span className="text-green-400">AED {Number(order.total_aed ?? order.total ?? 0).toFixed(2)}</span></div>
          </div>
        </div>
      </main>
    </div>
  )
}
