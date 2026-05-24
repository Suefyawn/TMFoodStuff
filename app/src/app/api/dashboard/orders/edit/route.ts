import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const EDITABLE_FIELDS = [
  'customer_name',
  'customer_phone',
  'customer_email',
  'delivery_emirate',
  'delivery_area',
  'delivery_building',
  'delivery_makani',
  'delivery_slot',
  'delivery_date',
  'delivery_notes',
  'admin_notes',
] as const

type EditableField = (typeof EDITABLE_FIELDS)[number]

const VALID_SLOTS = ['morning', 'afternoon', 'evening']

interface EditBody {
  id?: number | string
  changes?: Partial<Record<EditableField, string>>
}

// PATCH — admin edits delivery / contact details on an order. Refuses edits
// to delivered or cancelled orders because those are settled state and the
// audit story gets weird if we let them change. Customer-facing notification
// is deliberately NOT fired (the admin owns that communication out-of-band).
export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as EditBody
  const orderId = Number(body.id)
  if (!orderId) return NextResponse.json({ error: 'Order id required' }, { status: 400 })
  if (!body.changes || typeof body.changes !== 'object') {
    return NextResponse.json({ error: 'changes object required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: existing } = await supabase
    .from('orders')
    .select('id, order_number, status, customer_name, customer_phone, customer_email, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_slot, delivery_date, delivery_notes, admin_notes')
    .eq('id', orderId)
    .maybeSingle() as { data: (Record<EditableField, string | null> & { id: number; order_number: string; status: string }) | null }
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (existing.status === 'delivered' || existing.status === 'cancelled') {
    return NextResponse.json(
      { error: `Cannot edit a ${existing.status} order.` },
      { status: 409 },
    )
  }

  // Sanitise + validate each field. Only allow keys in EDITABLE_FIELDS so a
  // crafty body can't smuggle in payment_status / total / status changes.
  const updates: Partial<Record<EditableField, string | null>> = {}
  for (const key of EDITABLE_FIELDS) {
    if (!(key in body.changes)) continue
    const raw = body.changes[key]
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (key === 'delivery_slot' && value && !VALID_SLOTS.includes(value)) {
      return NextResponse.json({ error: `Invalid delivery slot.` }, { status: 400 })
    }
    if (key === 'delivery_date' && value) {
      // YYYY-MM-DD shape only.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return NextResponse.json({ error: `Invalid delivery date.` }, { status: 400 })
      }
    }
    // Length caps mirror the customer-facing rules.
    const max: Partial<Record<EditableField, number>> = {
      customer_name: 120,
      customer_phone: 40,
      customer_email: 160,
      delivery_emirate: 100,
      delivery_area: 200,
      delivery_building: 200,
      delivery_makani: 100,
      delivery_notes: 1000,
      admin_notes: 2000,
    }
    const capped = max[key] ? value.slice(0, max[key]) : value
    updates[key] = capped === '' ? null : capped
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  // Only the columns the operator actually changed — keeps the audit diff
  // honest and prevents accidental updates with the same value.
  const before: Partial<Record<EditableField, string | null>> = {}
  const after: Partial<Record<EditableField, string | null>> = {}
  for (const key of Object.keys(updates) as EditableField[]) {
    if ((existing[key] ?? null) === (updates[key] ?? null)) continue
    before[key] = existing[key] ?? null
    after[key] = updates[key] ?? null
  }
  if (Object.keys(after).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true })
  }

  const { error } = await supabase
    .from('orders')
    .update({ ...after, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'order.update',
    entity: `order:${existing.id}`,
    before,
    after,
    metadata: { order_number: existing.order_number },
  })

  return NextResponse.json({ ok: true, changedFields: Object.keys(after) })
}
