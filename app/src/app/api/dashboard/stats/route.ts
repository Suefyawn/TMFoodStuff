import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireDashboardStaff } from '@/lib/dashboard-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const now = new Date()
  const today = new Date(now); today.setHours(0,0,0,0)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { data: recentOrders },
    { data: lowStockProducts },
    { data: weeklyOrders },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('id, name, stock, emoji').eq('is_active', true).lt('stock', 10).order('stock'),
    supabase.from('orders').select('id, total, total_aed, status, created_at').gte('created_at', weekAgo.toISOString()),
  ])

  // Revenue calculations
  const totalRevenue = (weeklyOrders || []).reduce((sum, o: any) => sum + (Number(o.total_aed ?? o.total) || 0), 0)
  const todayRevenue = (weeklyOrders || [])
    .filter(o => new Date(o.created_at) >= today)
    .reduce((sum, o: any) => sum + (Number(o.total_aed ?? o.total) || 0), 0)

  // Daily revenue for chart (last 7 days)
  const dailyRevenue = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1)
    const dayOrders = (weeklyOrders || []).filter(o => {
      const t = new Date(o.created_at)
      return t >= d && t < nextD
    })
    dailyRevenue.push({
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      revenue: dayOrders.reduce((s, o: any) => s + (Number(o.total_aed ?? o.total) || 0), 0),
      orders: dayOrders.length,
    })
  }

  // Status distribution
  const statusCounts: Record<string, number> = {}
  for (const o of (weeklyOrders || [])) {
    statusCounts[o.status || 'pending'] = (statusCounts[o.status || 'pending'] || 0) + 1
  }

  // Top selling from normalized order_items for recent orders
  const productSales: Record<string, { name: string, qty: number, revenue: number }> = {}

  const weeklyIds = (weeklyOrders || []).map((o: any) => o.id).filter(Boolean)
  const { data: weeklyOrderItems } = weeklyIds.length
    ? await supabase
      .from('order_items')
      .select('order_id, product_id, product_name, quantity, unit_price_aed, subtotal_aed')
      .in('order_id', weeklyIds)
    : { data: [] as any[] }

  const items = (weeklyOrderItems || []) as any[]

  for (const item of items) {
    const name = item.product_name || item.name || 'Unknown'
    const key = String(item.product_id || item.productId || name)
    if (!productSales[key]) productSales[key] = { name, qty: 0, revenue: 0 }
    const qty = Number(item.quantity) || 1
    const unitPrice = Number(item.unit_price_aed ?? item.price_aed ?? item.priceAED) || 0
    const subtotal = Number(item.subtotal_aed ?? item.subtotal) || (unitPrice * qty)
    productSales[key].qty += qty
    productSales[key].revenue += subtotal
  }

  const topSelling = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return NextResponse.json({
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    totalRevenue,
    todayRevenue,
    dailyRevenue,
    statusCounts,
    topSelling,
    lowStockProducts: lowStockProducts || [],
    recentOrders: recentOrders || [],
  })
}
