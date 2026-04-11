import { NextResponse } from 'next/server'
import { createServerSupabaseForUser, requireDashboardUser } from '@/lib/dashboard-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireDashboardUser()
  if (!auth.ok) return auth.response

  const supabase = createServerSupabaseForUser(auth.session.accessToken)

  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })

  // Aggregate by customer phone (unique identifier)
  const customers: Record<string, any> = {}
  for (const order of (orders || [])) {
    const key = order.customer_phone || order.customer_email || order.customer_name || 'unknown'
    if (!customers[key]) {
      customers[key] = {
        name: order.customer_name || '—',
        phone: order.customer_phone || '',
        email: order.customer_email || '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: order.created_at,
        orders: [],
      }
    }
    customers[key].totalOrders++
    customers[key].totalSpent += Number(order.total_aed ?? order.total ?? 0)
    customers[key].orders.push({
      id: order.id,
      order_number: order.order_number,
      total: order.total_aed ?? order.total,
      status: order.status,
      created_at: order.created_at,
    })
  }

  const list = Object.values(customers).sort((a: any, b: any) => b.totalSpent - a.totalSpent)

  return NextResponse.json(list)
}
