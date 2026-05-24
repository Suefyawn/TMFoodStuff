// Admin moderation: list every review (regardless of status) and
// approve/reject/delete. Audit-logged.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface PatchBody { id?: number | string; status?: 'approved' | 'rejected' | 'pending' }
interface DeleteBody { id?: number | string }

export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as PatchBody
  const id = Number(body.id)
  if (!id || !body.status || !['approved', 'rejected', 'pending'].includes(body.status)) {
    return NextResponse.json({ error: 'id and valid status required.' }, { status: 400 })
  }
  const supabase = getSupabase()
  const { data: before } = await supabase.from('product_reviews').select('status').eq('id', id).maybeSingle()
  const { error } = await supabase
    .from('product_reviews')
    .update({
      status: body.status,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction({
    supabase,
    action: 'review.moderate',
    entity: `review:${id}`,
    before: before || undefined,
    after: { status: body.status },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as DeleteBody
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = getSupabase()
  const { error } = await supabase.from('product_reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction({ supabase, action: 'review.delete', entity: `review:${id}` })
  return NextResponse.json({ ok: true })
}
