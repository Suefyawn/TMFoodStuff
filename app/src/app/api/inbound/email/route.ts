// Resend inbound webhook receiver. Configure in Resend dashboard:
// Webhooks → Add endpoint → URL = https://yourdomain/api/inbound/email,
// event type = email.inbound. Resend sends the parsed message (text +
// html + headers) as JSON.
//
// Optional secret: set RESEND_WEBHOOK_SECRET to the secret from the
// Resend dashboard and we'll verify svix-signature on every call. When
// unset, the endpoint accepts all requests but logs a warning — useful
// for local dev / first-time integration before the secret is rotated.
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { recordInboundMessage, type IncomingMessage } from '@/lib/support-inbox'

export const dynamic = 'force-dynamic'

interface ResendInboundPayload {
  type?: string
  created_at?: string
  data?: {
    email_id?: string
    from?: { email?: string; name?: string }
    to?: Array<{ email?: string; name?: string }>
    subject?: string
    text?: string
    html?: string
    message_id?: string
    in_reply_to?: string
    created_at?: string
    headers?: Record<string, string>
  }
}

// Resend event types that carry an actual inbound message (someone emailing us)
// vs. delivery-status events about mail we sent (delivered/opened/bounced/...).
const INBOUND_TYPES = new Set(['email.received', 'email.inbound', 'inbound.email'])

export async function POST(request: Request) {
  // Verify the webhook signature if a secret is configured. Resend uses
  // the Svix signature scheme (svix-id, svix-timestamp, svix-signature).
  // We do the verification ourselves to keep the dependency surface flat.
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const rawBody = await request.text()

  if (secret) {
    const svixId = request.headers.get('svix-id') || ''
    const svixTimestamp = request.headers.get('svix-timestamp') || ''
    const svixSignature = request.headers.get('svix-signature') || ''
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 401 })
    }
    // Reject stale/replayed deliveries: the signed timestamp must be within a
    // 5-minute window of now.
    const tsSec = Number(svixTimestamp)
    if (!Number.isFinite(tsSec) || Math.abs(Date.now() / 1000 - tsSec) > 300) {
      return NextResponse.json({ error: 'Timestamp outside tolerance' }, { status: 401 })
    }
    const ok = await verifySvixSignature({
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
      body: rawBody,
      secret,
    })
    if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  } else if (process.env.NODE_ENV === 'production') {
    // Fail closed: never accept unsigned inbound mail in production, where it
    // would let anyone write attacker-controlled rows into the support inbox.
    console.error('[inbound/email] RESEND_WEBHOOK_SECRET not set in production — rejecting unsigned webhook.')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  } else {
    console.warn('[inbound/email] RESEND_WEBHOOK_SECRET not set — accepting unsigned webhook (non-production only).')
  }

  let payload: ResendInboundPayload
  try {
    payload = JSON.parse(rawBody) as ResendInboundPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const eventType = payload.type || 'unknown'
  const data = payload.data

  // Delivery-status events (and anything that isn't a parseable inbound
  // message) are logged to email_events for the dashboard delivery view.
  const isInbound = INBOUND_TYPES.has(eventType) && !!data?.from?.email
  if (!isInbound) {
    await recordEmailEvent(supabase, eventType, payload, rawBody)
    return NextResponse.json({ ok: true, recorded: 'event', type: eventType })
  }

  const msg: IncomingMessage = {
    from_email: data!.from!.email!,
    from_name: data!.from!.name || null,
    to_email: data!.to?.[0]?.email || null,
    subject: data!.subject || null,
    body_text: data!.text || null,
    body_html: data!.html || null,
    message_id: data!.message_id || data!.headers?.['message-id'] || null,
    in_reply_to: data!.in_reply_to || data!.headers?.['in-reply-to'] || null,
  }

  try {
    const result = await recordInboundMessage(supabase, msg)
    // Also log the inbound event to the delivery-status feed.
    await recordEmailEvent(supabase, eventType, payload, rawBody)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[inbound/email] insert failed:', err)
    // Return 200 so Resend doesn't retry forever on persistent failures —
    // we've logged enough to investigate.
    return NextResponse.json({ ok: false, error: 'Insert failed' }, { status: 200 })
  }
}

// Persist a Resend webhook event (delivered, opened, clicked, bounced,
// complained, failed, delivery_delayed, sent, inbound, domain.*, ...) into
// email_events so the dashboard can show per-email delivery status. Best-effort
// — never throws into the webhook response.
async function recordEmailEvent(
  supabase: SupabaseClient,
  eventType: string,
  payload: ResendInboundPayload,
  rawBody: string,
): Promise<void> {
  try {
    const d = (payload.data || {}) as Record<string, unknown>
    const toRaw = d.to
    let recipient: string | null = null
    if (Array.isArray(toRaw)) {
      recipient = toRaw
        .map(t => (typeof t === 'string' ? t : (t as { email?: string })?.email))
        .filter(Boolean)
        .join(', ') || null
    }
    const occurred = payload.created_at || (typeof d.created_at === 'string' ? d.created_at : null)
    await supabase.from('email_events').insert({
      resend_email_id: (typeof d.email_id === 'string' ? d.email_id : null),
      event_type: eventType,
      recipient,
      subject: (typeof d.subject === 'string' ? d.subject : null),
      occurred_at: occurred,
      payload: rawBody.length <= 20000 ? JSON.parse(rawBody) : { truncated: true },
    })
  } catch (err) {
    console.error('[inbound/email] email_events insert failed:', err)
  }
}

// Svix signature verification. The signature header contains one or
// more `v1,<base64-hmac>` pairs; we accept any that matches our secret.
// The HMAC is over `${id}.${timestamp}.${body}` with the decoded secret.
async function verifySvixSignature(args: {
  id: string
  timestamp: string
  signature: string
  body: string
  secret: string
}): Promise<boolean> {
  // Secret format from Resend: "whsec_<base64>" — strip the prefix.
  const rawSecret = args.secret.startsWith('whsec_') ? args.secret.slice(6) : args.secret
  const keyBytes = Uint8Array.from(atob(rawSecret), c => c.charCodeAt(0))
  const enc = new TextEncoder()
  const signedPayload = `${args.id}.${args.timestamp}.${args.body}`
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
  const expectedBuf = Buffer.from(expected)

  // Header is a space-separated list of "v1,<sig>" pairs. Compare in
  // constant time to avoid leaking the signature via timing.
  return args.signature
    .split(' ')
    .map(s => s.trim())
    .some(s => {
      if (!s.startsWith('v1,')) return false
      const provided = Buffer.from(s.slice(3))
      return provided.length === expectedBuf.length && timingSafeEqual(provided, expectedBuf)
    })
}
