// Manage staff notification recipients + the email logo. Admin-only.
//
// Recipients live in notification_recipients (per-type toggles). The email
// logo URL is stored as the `email_logo_url` setting and rendered in the
// branded header of every transactional email.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { readJsonBody } from '@/lib/http'

export const dynamic = 'force-dynamic'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

interface RecipientBody {
  id?: number
  email?: string
  name?: string
  notify_new_order?: boolean
  notify_low_stock?: boolean
  notify_daily_digest?: boolean
  is_active?: boolean
  logoUrl?: string
}

export async function GET() {
  if (!(await requirePermission('settings.edit'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = svc()
  const [{ data: recipients }, { data: logoRow }] = await Promise.all([
    supabase.from('notification_recipients').select('*').order('created_at', { ascending: true }),
    supabase.from('settings').select('value').eq('key', 'email_logo_url').maybeSingle(),
  ])
  return NextResponse.json({
    recipients: recipients || [],
    logoUrl: logoRow?.value || '',
  })
}

export async function POST(request: Request) {
  if (!(await requirePermission('settings.edit'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await readJsonBody<RecipientBody>(request)
  if (!body || !isEmail(body.email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  const supabase = svc()
  const row = {
    email: body.email.trim().toLowerCase(),
    name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) || null : null,
    notify_new_order: body.notify_new_order ?? true,
    notify_low_stock: body.notify_low_stock ?? true,
    notify_daily_digest: body.notify_daily_digest ?? false,
    is_active: true,
  }
  const { data, error } = await supabase
    .from('notification_recipients')
    .insert(row)
    .select('*')
    .single()
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'That email is already a recipient.' }, { status: 409 })
    }
    console.error('[notifications] insert failed:', error)
    return NextResponse.json({ error: 'Could not add recipient.' }, { status: 500 })
  }
  await logAdminAction({ supabase, action: 'notification_recipient.add', entity: `recipient:${data.id}`, after: row })
  return NextResponse.json({ recipient: data })
}

export async function PATCH(request: Request) {
  if (!(await requirePermission('settings.edit'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await readJsonBody<RecipientBody>(request)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const supabase = svc()

  // Logo update path: { logoUrl }
  if (typeof body.logoUrl === 'string' && body.id == null) {
    const url = body.logoUrl.trim().slice(0, 1000)
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'email_logo_url', value: url }, { onConflict: 'key' })
    if (error) {
      console.error('[notifications] logo save failed:', error)
      return NextResponse.json({ error: 'Could not save logo.' }, { status: 500 })
    }
    await logAdminAction({ supabase, action: 'email_logo.update', metadata: { url } })
    return NextResponse.json({ ok: true, logoUrl: url })
  }

  // Recipient update path: { id, ...fields }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.name === 'string') updates.name = body.name.trim().slice(0, 120) || null
  for (const k of ['notify_new_order', 'notify_low_stock', 'notify_daily_digest', 'is_active'] as const) {
    if (typeof body[k] === 'boolean') updates[k] = body[k]
  }
  const { data, error } = await supabase
    .from('notification_recipients')
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .single()
  if (error) {
    console.error('[notifications] update failed:', error)
    return NextResponse.json({ error: 'Could not update recipient.' }, { status: 500 })
  }
  await logAdminAction({ supabase, action: 'notification_recipient.update', entity: `recipient:${body.id}`, after: updates })
  return NextResponse.json({ recipient: data })
}

export async function DELETE(request: Request) {
  if (!(await requirePermission('settings.edit'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await readJsonBody<{ id?: number }>(request)
  if (!body?.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = svc()
  const { error } = await supabase.from('notification_recipients').delete().eq('id', body.id)
  if (error) {
    console.error('[notifications] delete failed:', error)
    return NextResponse.json({ error: 'Could not remove recipient.' }, { status: 500 })
  }
  await logAdminAction({ supabase, action: 'notification_recipient.remove', entity: `recipient:${body.id}` })
  return NextResponse.json({ ok: true })
}
