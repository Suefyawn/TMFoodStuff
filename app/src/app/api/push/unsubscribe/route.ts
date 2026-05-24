// Removes a single subscription by endpoint. Doesn't require auth — the
// caller had to have the endpoint already.
import { NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

interface UnsubscribeBody { endpoint?: string }

export async function POST(request: Request) {
  const body = (await request.json()) as UnsubscribeBody
  if (!body.endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }
  const supabase = getServiceRoleClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint)
  return NextResponse.json({ ok: true })
}
