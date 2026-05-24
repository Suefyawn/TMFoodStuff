// CRUD for the admin_users table — the allowlist that controls who can sign
// into /dashboard. Admin-only (staff and drivers can read their own session
// but can't grant access to others).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAdminAuthed, getDashboardSession } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

type Role = 'admin' | 'staff' | 'driver'

function isRole(v: unknown): v is Role {
  return v === 'admin' || v === 'staff' || v === 'driver'
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
    .from('admin_users')
    .select('id, email, role, is_active, created_at')
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data || [] })
}

interface CreateBody { email?: string; role?: string }

export async function POST(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as CreateBody
  const email = (body.email || '').trim().toLowerCase()
  const role = body.role || 'staff'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('admin_users')
    .upsert({ email, role, is_active: true }, { onConflict: 'email' })
    .select('id, email, role, is_active')
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'team.member_added',
    entity: `admin_user:${data.id}`,
    metadata: { email, role },
  })
  return NextResponse.json({ row: data })
}

interface PatchBody { id?: number; role?: string; is_active?: boolean }

export async function PATCH(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as PatchBody
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.role !== undefined) {
    if (!isRole(body.role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    updates.role = body.role
  }
  if (body.is_active !== undefined) updates.is_active = !!body.is_active
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Don't allow an admin to demote / deactivate themselves into a lockout.
  const session = await getDashboardSession()
  const { data: target } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('id', id)
    .maybeSingle()
  if (target && session.state === 'ok' && target.email === session.email) {
    if (updates.role && updates.role !== 'admin') {
      return NextResponse.json({ error: "You can't demote your own account." }, { status: 400 })
    }
    if (updates.is_active === false) {
      return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select('id, email, role, is_active')
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'team.member_updated',
    entity: `admin_user:${id}`,
    metadata: updates,
  })
  return NextResponse.json({ row: data })
}

interface DeleteBody { id?: number }

export async function DELETE(request: Request) {
  if (!(await isAdminAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as DeleteBody
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const session = await getDashboardSession()
  const { data: target } = await supabase
    .from('admin_users')
    .select('email')
    .eq('id', id)
    .maybeSingle()
  if (target && session.state === 'ok' && target.email === session.email) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 })
  }
  const { error } = await supabase.from('admin_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction({
    supabase,
    action: 'team.member_removed',
    entity: `admin_user:${id}`,
    metadata: { email: target?.email },
  })
  return NextResponse.json({ ok: true })
}
