// Pause / resume / cancel / edit a single subscription. Customer-scoped:
// the PATCH/DELETE only succeeds when the row's customer_id matches the
// signed-in customer's id.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

interface PatchBody {
  action?: 'pause' | 'resume' | 'cancel' | 'skip_next'
  // When `pause`: optional pause_until date. When omitted, pauses indefinitely.
  pause_until?: string
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = (await request.json()) as PatchBody
  const supabase = getServiceRoleClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, customer_id, status, next_delivery_date, frequency_days')
    .eq('id', id)
    .maybeSingle()
  if (!sub || sub.customer_id !== customer.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.action === 'pause') {
    updates.status = 'paused'
    if (body.pause_until && /^\d{4}-\d{2}-\d{2}$/.test(body.pause_until)) {
      updates.pause_until = body.pause_until
    }
  } else if (body.action === 'resume') {
    updates.status = 'active'
    updates.pause_until = null
  } else if (body.action === 'cancel') {
    updates.status = 'cancelled'
    updates.cancelled_at = new Date().toISOString()
  } else if (body.action === 'skip_next') {
    // Bump next_delivery_date forward by one frequency window without
    // changing status. Lighter-touch than a pause.
    const d = new Date(sub.next_delivery_date + 'T00:00:00Z')
    d.setDate(d.getDate() + sub.frequency_days)
    updates.next_delivery_date = d.toISOString().slice(0, 10)
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const { error } = await supabase.from('subscriptions').update(updates).eq('id', id)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const supabase = getServiceRoleClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('customer_id')
    .eq('id', id)
    .maybeSingle()
  if (!sub || sub.customer_id !== customer.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Soft-cancel rather than hard-delete so the orders.subscription_id link
  // stays intact for past dispatched orders.
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', id)
  return NextResponse.json({ ok: true })
}
