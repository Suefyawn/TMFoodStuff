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
import { createClient } from '@supabase/supabase-js'
import { recordInboundMessage, type IncomingMessage } from '@/lib/support-inbox'

export const dynamic = 'force-dynamic'

interface ResendInboundPayload {
  type?: string
  data?: {
    from?: { email?: string; name?: string }
    to?: Array<{ email?: string; name?: string }>
    subject?: string
    text?: string
    html?: string
    message_id?: string
    in_reply_to?: string
    headers?: Record<string, string>
  }
}

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
    const ok = await verifySvixSignature({
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
      body: rawBody,
      secret,
    })
    if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  } else {
    console.warn('[inbound/email] RESEND_WEBHOOK_SECRET not set — accepting unsigned webhook. Configure the secret before production traffic.')
  }

  let payload: ResendInboundPayload
  try {
    payload = JSON.parse(rawBody) as ResendInboundPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const data = payload.data
  if (!data?.from?.email) {
    return NextResponse.json({ error: 'Missing from address' }, { status: 400 })
  }

  const msg: IncomingMessage = {
    from_email: data.from.email,
    from_name: data.from.name || null,
    to_email: data.to?.[0]?.email || null,
    subject: data.subject || null,
    body_text: data.text || null,
    body_html: data.html || null,
    message_id: data.message_id || data.headers?.['message-id'] || null,
    in_reply_to: data.in_reply_to || data.headers?.['in-reply-to'] || null,
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    const result = await recordInboundMessage(supabase, msg)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[inbound/email] insert failed:', err)
    // Return 200 so Resend doesn't retry forever on persistent failures —
    // we've logged enough to investigate.
    return NextResponse.json({ ok: false, error: 'Insert failed' }, { status: 200 })
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

  // Header is space-separated list of "v1,<sig>" pairs.
  return args.signature
    .split(' ')
    .map(s => s.trim())
    .some(s => s.startsWith('v1,') && s.slice(3) === expected)
}
