// Read-only feed of Resend delivery events (delivered / opened / clicked /
// bounced / complained / failed / ...) for the dashboard email delivery-status
// page. Ingested by /api/inbound/email.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const HEADLINE_TYPES = ['email.delivered', 'email.opened', 'email.bounced', 'email.complained', 'email.failed'] as const

export async function GET(request: Request) {
  if (!(await requirePermission('analytics.view'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString()

  let listQuery = supabase
    .from('email_events')
    .select('id, resend_email_id, event_type, recipient, subject, occurred_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (type) listQuery = listQuery.eq('event_type', type)

  const counts = await Promise.all(
    HEADLINE_TYPES.map(async t => {
      const { count } = await supabase
        .from('email_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', t)
        .gte('created_at', sevenDaysAgo)
      return [t, count || 0] as const
    }),
  )

  const { data: events, error } = await listQuery
  if (error) {
    console.error('[email-events] list failed:', error)
    return NextResponse.json({ error: 'Could not load events.' }, { status: 500 })
  }

  return NextResponse.json({
    events: events || [],
    counts7d: Object.fromEntries(counts),
  })
}
