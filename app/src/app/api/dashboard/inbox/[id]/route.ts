// Single thread + its messages. PATCH for status / assignment changes.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('customers.message')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: thread }, { data: messages }] = await Promise.all([
    supabase
      .from('support_threads')
      .select('id, customer_id, customer_email, customer_name, subject, status, assigned_to, last_message_at, message_count, created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('support_messages')
      .select('id, direction, from_email, from_name, to_email, subject, body_text, body_html, message_id, in_reply_to, sent_by, created_at')
      .eq('thread_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ thread, messages: messages || [] })
}

interface PatchBody { status?: string; assigned_to?: string | null }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('customers.message')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = (await request.json()) as PatchBody
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status) {
    if (!['open', 'pending_customer', 'resolved', 'spam'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }
  if (body.assigned_to !== undefined) {
    updates.assigned_to = body.assigned_to ? String(body.assigned_to).trim().toLowerCase() : null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await supabase.from('support_threads').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'support_thread.updated',
    entity: `thread:${id}`,
    after: updates,
  })
  return NextResponse.json({ ok: true })
}
