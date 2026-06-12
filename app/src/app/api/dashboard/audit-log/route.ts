// Cursor-paginated reads of the audit log, used by the Activity log page's
// "Load older" button. The page server-renders the newest 500; this endpoint
// serves anything older. Cursor is the numeric row id — the log is
// append-only, so id order matches time order.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 200

export async function GET(request: Request) {
  if (!(await requirePermission('audit_log.view'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const beforeId = Number(new URL(request.url).searchParams.get('before_id'))
  if (!Number.isFinite(beforeId) || beforeId <= 0) {
    return NextResponse.json({ error: 'before_id required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, actor_email, action, entity, before, after, metadata, created_at')
    .lt('id', beforeId)
    .order('id', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data || [], hasMore: (data || []).length === PAGE_SIZE })
}
