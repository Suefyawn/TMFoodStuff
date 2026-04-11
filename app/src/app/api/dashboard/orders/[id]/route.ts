import { NextResponse } from 'next/server'
import { requireDashboardStaff } from '@/lib/dashboard-auth'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response

  const { id } = await params
  const orderId = parseInt(id, 10)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
  }

  const supabase = auth.session.supabase
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('id'),
  ])

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...order,
    _items: items || [],
  })
}
