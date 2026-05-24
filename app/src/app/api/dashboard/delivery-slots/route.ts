// Admin CRUD for delivery slots. Admin-only — staff/drivers can't edit
// the slot config because it directly affects the live storefront.
//
// `key` is immutable on update — changing it would orphan existing orders
// that reference the old key.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAdminAuthed } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const KEY_RE = /^[a-z][a-z0-9_]{0,30}$/

interface CreateBody {
  key?: string
  label_en?: string
  label_ar?: string
  time_label_en?: string
  time_label_ar?: string
  cutoff_hour?: number | null
  max_orders_per_day?: number | null
  day_of_week_mask?: number
  position?: number
  is_active?: boolean
}

interface UpdateBody extends Omit<CreateBody, 'key'> {
  id?: number
}

export async function GET() {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('delivery_slots')
    .select('*')
    .order('position', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slots: data || [] })
}

export async function POST(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as CreateBody
  const key = (body.key || '').trim().toLowerCase()
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: 'Key must be lowercase letters, digits, and underscores (start with a letter, max 31 chars).' }, { status: 400 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('delivery_slots')
    .insert({
      key,
      label_en: (body.label_en || '').trim().slice(0, 60) || key,
      label_ar: (body.label_ar || '').trim().slice(0, 60) || key,
      time_label_en: (body.time_label_en || '').trim().slice(0, 40) || '',
      time_label_ar: (body.time_label_ar || '').trim().slice(0, 40) || '',
      cutoff_hour: body.cutoff_hour ?? null,
      max_orders_per_day: body.max_orders_per_day ?? null,
      day_of_week_mask: body.day_of_week_mask ?? 127,
      position: body.position ?? 99,
      is_active: body.is_active ?? true,
    })
    .select('*')
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message || 'Create failed' }, { status: 500 })
  await logAdminAction({ supabase, action: 'delivery_slot.created', entity: `slot:${data.id}`, metadata: { key } })
  return NextResponse.json({ slot: data })
}

export async function PATCH(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as UpdateBody
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // `key` is immutable. Strip if present in the payload.
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.label_en !== undefined) updates.label_en = String(body.label_en).trim().slice(0, 60)
  if (body.label_ar !== undefined) updates.label_ar = String(body.label_ar).trim().slice(0, 60)
  if (body.time_label_en !== undefined) updates.time_label_en = String(body.time_label_en).trim().slice(0, 40)
  if (body.time_label_ar !== undefined) updates.time_label_ar = String(body.time_label_ar).trim().slice(0, 40)
  if (body.cutoff_hour !== undefined) updates.cutoff_hour = body.cutoff_hour
  if (body.max_orders_per_day !== undefined) updates.max_orders_per_day = body.max_orders_per_day
  if (body.day_of_week_mask !== undefined) updates.day_of_week_mask = body.day_of_week_mask
  if (body.position !== undefined) updates.position = body.position
  if (body.is_active !== undefined) updates.is_active = !!body.is_active

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('delivery_slots')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
  await logAdminAction({ supabase, action: 'delivery_slot.updated', entity: `slot:${id}`, metadata: updates })
  return NextResponse.json({ slot: data })
}

// Soft-delete only via deactivation. We never hard-delete because existing
// orders + subscriptions reference the slot key.
export async function DELETE(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as { id?: number }
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await supabase.from('delivery_slots').update({ is_active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction({ supabase, action: 'delivery_slot.deactivated', entity: `slot:${id}` })
  return NextResponse.json({ ok: true })
}
