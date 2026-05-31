// Returns the audience size + a small sample for the broadcaster composer
// to render confidence ("will reach ~382 customers") before the admin
// fires the actual send.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { resolveAudience, type BroadcastAudience } from '@/lib/broadcast-audience'

export const dynamic = 'force-dynamic'

interface PreviewBody { audience: BroadcastAudience; channel: 'email' | 'sms' | 'both' }

export async function POST(request: Request) {
  if (!(await requirePermission('broadcasts.send'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as PreviewBody
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const targets = await resolveAudience(supabase, body.audience)
  const reachableEmail = targets.filter(t => t.email).length
  const reachableSms = targets.filter(t => t.phone).length
  const sample = targets.slice(0, 5).map(t => ({
    name: t.name || '—',
    email: t.email ? maskEmail(t.email) : null,
    phone: t.phone ? maskPhone(t.phone) : null,
  }))

  return NextResponse.json({
    total: targets.length,
    reachable_email: reachableEmail,
    reachable_sms: reachableSms,
    sample,
  })
}

function maskEmail(e: string): string {
  const [local, domain] = e.split('@')
  if (!local || !domain) return e
  return `${local.slice(0, 2)}***@${domain}`
}

function maskPhone(p: string): string {
  const digits = p.replace(/\D/g, '')
  if (digits.length < 6) return p
  return `${digits.slice(0, 3)}…${digits.slice(-3)}`
}
