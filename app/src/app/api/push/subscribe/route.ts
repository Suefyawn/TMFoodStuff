// Push subscription endpoints.
//
// GET  /api/push/subscribe — returns the VAPID public key for the client
//                            to use when calling pushManager.subscribe()
//                            (the key has to ship with the client).
// POST /api/push/subscribe — persists the subscription. Public route: a
//                            customer can subscribe before signing in (we
//                            link the row to customer_id when one is
//                            available).
// POST /api/push/unsubscribe — removes by endpoint.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { getVapidPublicKey } from '@/lib/push'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const publicKey = await getVapidPublicKey()
    return NextResponse.json({ publicKey })
  } catch (err) {
    console.error('[push] get vapid key failed:', err)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  userAgent?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubscribeBody
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'Missing endpoint or keys' }, { status: 400 })
  }
  const customer = await getCurrentCustomer()
  const supabase = getServiceRoleClient()

  // Upsert by endpoint: a returning subscriber on the same browser
  // updates the keys + refreshes last_seen_at without dupes.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      customer_id: customer?.id ?? null,
      user_agent: (body.userAgent || '').slice(0, 200) || null,
      last_seen_at: new Date().toISOString(),
      failure_count: 0,
    }, { onConflict: 'endpoint' })

  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
