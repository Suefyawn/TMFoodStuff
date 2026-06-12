// Records dashboard sign-in / sign-out events in the audit log.
//
// Login happens client-side (supabase.auth.signInWithPassword), so there is no
// server mutation to hook. Instead the login/logout pages call this endpoint
// right after auth succeeds / right before signing out. The actor is derived
// from the *server-verified* session — the client only says which event type
// occurred, so it cannot forge an actor or log events without a valid session.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDashboardSession } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { readJsonBody } from '@/lib/http'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!rateLimit(`auth-event:${getClientIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ ok: true }) // silently drop floods
  }

  const session = await getDashboardSession()
  if (session.state !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await readJsonBody<{ event?: string }>(request)
  const event = body?.event === 'logout' ? 'logout' : 'login'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  await logAdminAction({
    supabase,
    action: `auth.${event}`,
    entity: `member:${session.email}`,
    metadata: { role: session.role, ip: getClientIp(request) },
  })

  return NextResponse.json({ ok: true })
}
