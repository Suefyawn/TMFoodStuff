// Driver self-claim. Lets a driver assign an unassigned order to
// themselves in one tap — no admin in the loop.
//
// Guard: only fires when the order is currently unassigned. Trying to
// claim an order assigned to someone else returns 409 so the UI can
// say "another driver got there first" instead of silently overwriting.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDashboardSession } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface ClaimBody { order_id?: number | string }

export async function POST(request: Request) {
  const session = await getDashboardSession()
  if (session.state !== 'ok') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'driver') {
    return NextResponse.json({ error: 'Only drivers can claim. Admins should assign instead.' }, { status: 403 })
  }

  const body = (await request.json()) as ClaimBody
  const orderId = Number(body.order_id)
  if (!Number.isFinite(orderId)) return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Resolve the driver's admin_users.id from their session email.
  const { data: driver } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', session.email)
    .maybeSingle()
  if (!driver) return NextResponse.json({ error: 'Driver row not found' }, { status: 404 })

  // Conditional update — only succeeds when driver_id is still null.
  const { data: updated, error } = await supabase
    .from('orders')
    .update({ driver_id: driver.id, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('driver_id', null)
    .select('id, driver_id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated) {
    // Either the order doesn't exist or someone else claimed it first.
    return NextResponse.json({ error: 'Already claimed by another driver.' }, { status: 409 })
  }

  await logAdminAction({
    supabase,
    action: 'order.driver_self_claimed',
    entity: `order:${orderId}`,
    metadata: { driver_id: driver.id },
  })
  return NextResponse.json({ ok: true })
}
