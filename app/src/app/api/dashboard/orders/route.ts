import { NextResponse } from 'next/server'
import { requireDashboardRole } from '@/lib/dashboard-auth'

export async function PATCH(request: Request) {
  const auth = await requireDashboardRole()
  if (!auth.ok) return auth.response

  const { id, status } = await request.json()
  const supabase = auth.session.supabase
  const orderId = parseInt(id)

  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const prevStatus = existing.status

  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'cancelled' && prevStatus !== 'cancelled') {
    const { error: restockError } = await supabase.rpc('cancel_order_restock', { p_order_id: orderId })
    if (restockError) return NextResponse.json({ error: restockError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
