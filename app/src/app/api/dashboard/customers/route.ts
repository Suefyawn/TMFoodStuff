import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
    customers[key].totalSpent += order.total || 0
    customers[key].orders.push({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    })
  }

  const list = Object.values(customers).sort((a: any, b: any) => b.totalSpent - a.totalSpent)

  return NextResponse.json(list)
}
