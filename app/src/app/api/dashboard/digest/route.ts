// Admin-triggered preview of the daily digest. Sends the same email the cron
// would send so the admin can confirm formatting + thresholds without waiting
// for 02:30 UTC.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { sendDailyDigest } from '@/lib/daily-digest'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!(await requirePermission('analytics.view'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const result = await sendDailyDigest(supabase)
  if (!result.sent) {
    return NextResponse.json({ error: result.reason || 'send_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
