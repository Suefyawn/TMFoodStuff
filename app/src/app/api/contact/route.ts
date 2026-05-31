// Public contact form → support inbox. Drops the message straight into a
// support thread (recordInboundMessage), so it shows up in Dashboard → Inbox
// exactly like an inbound email — no email round-trip / MX setup required.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { readJsonBody } from '@/lib/http'
import { recordInboundMessage } from '@/lib/support-inbox'
import { isValidEmail } from '@/lib/validators'

export const dynamic = 'force-dynamic'

interface Body { name?: string; email?: string; subject?: string; message?: string }

export async function POST(request: Request) {
  if (!rateLimit(`contact:${getClientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many messages. Please try again shortly.' }, { status: 429 })
  }
  const body = await readJsonBody<Body>(request)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const name = (body.name || '').trim().slice(0, 120)
  const email = (body.email || '').trim().toLowerCase()
  const subject = (body.subject || '').trim().slice(0, 200)
  const message = (body.message || '').trim().slice(0, 5000)

  if (!isValidEmail(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  if (message.length < 2) return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    await recordInboundMessage(supabase, {
      from_email: email,
      from_name: name || null,
      to_email: 'support@tmfoodstuff.ae',
      subject: subject || 'Contact form message',
      body_text: message,
      // Unique synthetic id so Resend-style dedupe treats each submit distinctly.
      message_id: `<contact-${Date.now()}-${Math.random().toString(36).slice(2)}@tmfoodstuff.ae>`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] failed to record message:', err)
    return NextResponse.json({ error: 'Could not send your message. Please try WhatsApp instead.' }, { status: 500 })
  }
}
