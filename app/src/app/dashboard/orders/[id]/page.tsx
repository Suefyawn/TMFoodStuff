import { MongoClient, ObjectId } from 'mongodb'
import Link from 'next/link'
import OrderStatusUpdater from './OrderStatusUpdater'

async function getOrder(id: string) {
  const client = new MongoClient(process.env.MONGODB_URI!)
  try {
    await client.connect()
    const db = client.db()
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) })
    await client.close()
    return order ? JSON.parse(JSON.stringify(order)) : null
  } catch {
    await client.close().catch(() => {})
    return null
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Order not found</div>
    </div>
  )

  const customer = order.customer || order.form || {}
  const delivery = order.delivery || order.form || {}
  const pricing = order.pricing || order.payment || {}
  const items = order.items || []
  const phone = customer.phone || ''
  const waMsg = encodeURIComponent(
    `Hi ${customer.fullName}! Your TMFoodStuff order #${order.orderNumber} has been confirmed. We'll deliver during your ${delivery.slot || 'selected'} slot. Thank you! 🥦`
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders" className="text-gray-500 hover:text-white text-sm transition-colors">← Orders</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-white font-black">{order.orderNumber}</h1>
        </div>
        {phone && (
          <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            💬 WhatsApp Customer
          </a>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        
        {/* Status updater */}
        <OrderStatusUpdater orderId={String(order._id)} currentStatus={order.status || 'pending'} />

        <div className="grid md:grid-cols-2 gap-5">
          {/* Customer */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-4">👤 Customer</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-white font-semibold">{customer.fullName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-white">{phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-300">{customer.email || '—'}</span></div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-4">📍 Delivery</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Slot</span><span className="text-white font-semibold capitalize">{delivery.slot || order.form?.deliverySlot || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="text-white">{delivery.area || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Emirate</span><span className="text-white">{delivery.emirate || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Building</span><span className="text-gray-300">{delivery.building || '—'}</span></div>
              {delivery.makani && <div className="flex justify-between"><span className="text-gray-500">Makani</span><span className="text-gray-300">{delivery.makani}</span></div>}
              {delivery.notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span className="text-yellow-400">{delivery.notes}</span></div>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <h3 className="text-white font-black p-5 border-b border-gray-800">🛒 Order Items</h3>
          <div className="divide-y divide-gray-800">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white font-semibold text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity} {item.unit}</p>
                </div>
                <span className="text-green-400 font-bold text-sm">AED {(item.priceAED * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-gray-800 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>AED {(pricing.subtotal || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>VAT 5%</span><span>AED {(pricing.vat || 0).toFixed(2)}</span></div>
            {pricing.promoDiscount > 0 && <div className="flex justify-between text-green-400"><span>Promo ({pricing.promoCode})</span><span>-AED {pricing.promoDiscount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-white font-black text-base border-t border-gray-700 pt-2"><span>Total</span><span className="text-green-400">AED {(pricing.total || 0).toFixed(2)}</span></div>
          </div>
        </div>
      </main>
    </div>
  )
}
