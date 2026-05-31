import { NextResponse } from 'next/server'

// Single source of truth for cron authentication.
//
// Cron jobs are authenticated by the CRON_SECRET bearer token. Vercel
// automatically attaches `Authorization: Bearer $CRON_SECRET` to scheduled
// invocations when the env var is set, so this one check covers both Vercel
// Cron and manual/staging triggers.
//
// We deliberately do NOT trust the mere presence of the
// `x-vercel-cron-signature` header: any external caller can set that header,
// and these routes have real side effects (cancelling orders, expiring
// points, emailing customers). Without a configured secret we fail closed.
//
// Returns a NextResponse to short-circuit the handler with, or null when the
// caller is authorized.
export function checkCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron] CRON_SECRET is not set — refusing to run scheduled job.')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
  }
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
