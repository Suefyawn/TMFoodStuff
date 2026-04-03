import { MongoClient } from 'mongodb'
import Link from 'next/link'

async function getStats() {
  const client = new MongoClient(process.env.MONGODB_URI!)
  try {
    await client.connect()
    const db = client.db()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [totalOrders, pendingOrders, todayOrders, totalProducts, recentOrders] = await Promise.all([
      db.collection('orders').countDocuments(),
      db.collection('orders').countDocuments({ status: 'pending' }),
      db.collection('orders').countDocuments({ createdAt: { $gte: today } }),
      db.collection('products').countDocuments({ isActive: true }),
      db.collection('orders').find({}).sort({ createdAt: -1 }).limit(10).toArray(),
    ])
    
    // Calculate today's revenue
    const todayOrderDocs = await db.collection('orders')
      .find({ createdAt: { $gte: today } })
      .toArray()
    const todayRevenue = todayOrderDocs.reduce((sum: number, o: any) => sum + (o.pricing?.total || o.payment?.total || 0), 0)
    
    await client.close()
    return { totalOrders, pendingOrders, todayOrders, totalProducts, recentOrders: JSON.parse(JSON.stringify(recentOrders)), todayRevenue }
  } catch (e) {
    await client.close().catch(() => {})
    return { totalOrders: 0, pendingOrders: 0, todayOrders: 0, totalProducts: 0, recentOrders: [], todayRevenue: 0 }
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-purple-500/15 text-purple-400',
  out_for_delivery: 'bg-orange-500/15 text-orange-400',
  delivered: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

const statusLabels: Record<string, string> = {
  pending: '🟡 Pending',
  confirmed: '✅ Confirmed',
  processing: '🔄 Processing',
  out_for_delivery: '🚚 Out for Delivery',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white font-black text-sm">TM</div>
          <div>
            <h1 className="text-white font-black text-lg leading-tight">TMFoodStuff</h1>
            <p className="text-gray-500 text-xs">Admin Dashboard</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/dashboard" className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm font-semibold">Overview</Link>
          <Link href="/dashboard/orders" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors">Orders</Link>
          <Link href="/dashboard/products" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors">Products</Link>
          <Link href="/dashboard/logout" className="px-3 py-1.5 text-gray-600 hover:text-gray-400 rounded-lg text-sm transition-colors">Sign Out</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Orders", value: stats.todayOrders, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: "Today's Revenue", value: `AED ${stats.todayRevenue.toFixed(2)}`, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Pending Orders', value: stats.pendingOrders, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Active Products', value: stats.totalProducts, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} border border-gray-800 rounded-2xl p-5`}>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h2 className="text-white font-black text-lg">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-green-400 text-sm hover:text-green-300 transition-colors">View all →</Link>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-600">No orders yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {stats.recentOrders.map((order: any) => (
                <Link href={`/dashboard/orders/${order._id}`} key={String(order._id)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[order.status] || 'bg-gray-700 text-gray-400'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {order.customer?.fullName || order.form?.fullName} · {order.customer?.phone || order.form?.phone}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 font-black">AED {(order.pricing?.total || order.payment?.total || 0).toFixed(2)}</p>
                    <p className="text-gray-600 text-xs">{order.delivery?.slot || order.form?.deliverySlot}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
