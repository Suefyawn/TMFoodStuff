// Assign / unassign a driver on an order. Admin or staff can call this
// (operations work, not money-moving). Audit-logged.
//
// driver_id null/empty = unassign. Validating the target user exists +
// has the driver role keeps the operator from accidentally assigning to
// a deleted account or to an admin.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface AssignBody {
  order_id?: number | string
  driver_id?: string | null
}

export async function POST(request: Request) {
  const session = await requirePermission('orders.edit')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as AssignBody
  const orderId = Number(body.order_id)
  if (!Number.isFinite(orderId)) return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let driverId: string | null = null
  if (body.driver_id) {
    // Resolve + validate. We only allow assigning to a driver-role
    // member; an admin/staff being "the driver" would confuse the
    // delivery queue's visibility rules.
    const { data: driver } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('id', body.driver_id)
      .maybeSingle()
    if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    if (driver.role !== 'driver') return NextResponse.json({ error: 'That user is not a driver.' }, { status: 400 })
    if (!driver.is_active) return NextResponse.json({ error: 'That driver account is inactive.' }, { status: 400 })
    driverId = driver.id
  }

  const { error } = await supabase
    .from('orders')
    .update({ driver_id: driverId, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }

  await logAdminAction({
    supabase,
    action: driverId ? 'order.driver_assigned' : 'order.driver_unassigned',
    entity: `order:${orderId}`,
    metadata: { driver_id: driverId },
  })
  return NextResponse.json({ ok: true })
}
