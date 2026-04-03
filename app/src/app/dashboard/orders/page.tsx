import { MongoClient } from 'mongodb'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  out_for_delivery: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  delivered: 'bg-green-500/15 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
}

async function getOrders() {
  const client = new MongoClient(process.env.MONGODB_URI!)
  try {
    await client.connect()
    const db = client.db()
    const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(100).toArray()
    await client.close()
    return JSON.parse(JSON.stringify(orders))
  } catch {
    await client.close().catch(() => {})
    return []
  }
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">← Dashboard</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-white font-black">Orders</h1>
        </div>
        <span className="text-gray-500 text-sm">{orders.length} total</span>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-16 text-center text-gray-600">No orders yet. When customers place orders they&apos;ll appear here.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slot</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {orders.map((order: any) => {
                    const customer = order.customer || order.form || {}
                    const delivery = order.delivery || order.form || {}
                    const total = order.pricing?.total || order.payment?.total || 0
                    const phone = customer.phone || ''
                    const waText = encodeURIComponent(`Hi ${customer.fullName}, your TMFoodStuff order #${order.orderNumber} `)
                    return (
                      <tr key={String(order._id)} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <Link href={`/dashboard/orders/${order._id}`} className="text-white font-bold hover:text-green-400 transition-colors text-sm">
                            {order.orderNumber}
                          </Link>
                          <p className="text-gray-600 text-xs mt-0.5">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-white text-sm font-semibold">{customer.fullName || '—'}</p>
                          <p className="text-gray-500 text-xs">{phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-300 text-sm">{delivery.area || '—'}</p>
                          <p className="text-gray-500 text-xs">{delivery.emirate}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-gray-400 text-sm capitalize">{delivery.slot || order.form?.deliverySlot || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-green-400 font-black text-sm">AED {total.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColors[order.status] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/orders/${order._id}`}
                              className="text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                              View
                            </Link>
                            {phone && (
                              <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${waText}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs px-2.5 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors">
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
