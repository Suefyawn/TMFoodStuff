// Scheduled daily by Vercel Cron. Finds earned points past their expiry and
// inserts an offset 'expired' row so the customer's balance + visible
// history both reflect the lapse. Idempotent: each earn row is only offset
// once (we record the source ledger id in the new row's metadata so a
// subsequent run can skip rows that already have a matching offset).
//
// Also fires the admin daily digest after the expiry pass — piggybacked here
// rather than added as a third cron so we stay inside Vercel Hobby's 2-cron
// limit. The digest is best-effort; its failures never fail this handler.
//
// Auth model matches the abandoned-orders cleanup: accepts Vercel's signed
// cron header, or a bearer with the CRON_SECRET.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDailyDigest } from '@/lib/daily-digest'
import { dispatchDueSubscriptions } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

const BATCH = 500

export async function GET(request: Request) {
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const isVercelCron = !!request.headers.get('x-vercel-cron-signature')
  const secret = process.env.CRON_SECRET
  if (!isVercelCron && !(secret && provided === secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const nowIso = new Date().toISOString()

  // Pull lapsed earn rows. We process at most BATCH per invocation so a huge
  // backfill doesn't time out the cron lambda; the daily schedule will chip
  // away at any backlog.
  const { data: lapsed, error: selectErr } = await supabase
    .from('customer_points_ledger')
    .select('id, customer_id, delta')
    .eq('reason', 'order_earned')
    .lt('expires_at', nowIso)
    .limit(BATCH)
  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500 })
  }
  if (!lapsed || lapsed.length === 0) {
    return NextResponse.json({ expired: 0 })
  }

  // Filter out earn rows that already have a matching 'expired' offset.
  const ids = lapsed.map(r => r.id)
  const { data: existingOffsets } = await supabase
    .from('customer_points_ledger')
    .select('description')
    .eq('reason', 'expired')
    .in('description', ids.map(id => `expired:earn_id:${id}`))
  const already = new Set((existingOffsets || []).map(o => o.description))

  const reversals = lapsed
    .filter(r => !already.has(`expired:earn_id:${r.id}`))
    .map(r => ({
      customer_id: r.customer_id,
      delta: -r.delta,
      reason: 'expired' as const,
      description: `expired:earn_id:${r.id}`,
    }))

  let expired = 0
  if (reversals.length > 0) {
    const { error: insertErr } = await supabase.from('customer_points_ledger').insert(reversals)
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
    expired = reversals.length
  }

  const digest = await sendDailyDigest(supabase).catch(err => {
    console.error('[expire-points] digest threw:', err)
    return { sent: false, reason: 'threw' as const }
  })

  // Piggyback the subscription dispatcher here — we're at the 2-cron limit
  // on Vercel Hobby and this is the earliest daily run, which gives ops
  // the longest lead time to react if something looks off.
  const subscriptions = await dispatchDueSubscriptions(supabase).catch(err => {
    console.error('[expire-points] subscriptions dispatcher threw:', err)
    return { scanned: 0, dispatched: 0, failed: 0, skipped: 0 }
  })

  return NextResponse.json({ expired, scanned: lapsed.length, digest, subscriptions })
}
