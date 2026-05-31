// Sends a reply on a support thread. Outgoing mail goes through Resend
// using the FROM_EMAIL the rest of the app uses; the email's Message-ID
// gets stored on the outbound row so when the customer hits "Reply" in
// their mail client we can match the resulting In-Reply-To back to the
// thread.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { getResend, SUPPORT_FROM_EMAIL } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface ReplyBody { body: string; markResolved?: boolean }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('customers.message')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = (await request.json()) as ReplyBody
  const text = String(body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'Empty reply' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Pull the thread + the most recent inbound message so we can quote
  // it in the reply and copy its Message-ID into In-Reply-To.
  const { data: thread } = await supabase
    .from('support_threads')
    .select('id, customer_email, customer_name, subject')
    .eq('id', id)
    .maybeSingle()
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const { data: lastInbound } = await supabase
    .from('support_messages')
    .select('message_id, body_text')
    .eq('thread_id', id)
    .eq('direction', 'in')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const resend = getResend()
  if (!resend) {
    return NextResponse.json({ error: 'Email is not configured on this site.' }, { status: 503 })
  }

  const replySubject = thread.subject?.toLowerCase().startsWith('re:')
    ? thread.subject
    : `Re: ${thread.subject || 'your message'}`

  // Compose HTML — plain quoted-reply style. The recipient's mail
  // client will collapse the quote naturally.
  const escaped = (s: string) => s.replace(/[<>&]/g, c => c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;')
  const replyHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#374151">
    <p style="white-space:pre-line;margin:0 0 18px">${escaped(text)}</p>
    <p style="margin:0;color:#9ca3af;font-size:12px">— TM FoodStuff Support</p>
    ${lastInbound?.body_text ? `<blockquote style="margin:24px 0 0;padding:0 0 0 12px;border-left:2px solid #e5e7eb;color:#6b7280;font-size:12px;white-space:pre-line">On a previous message, you wrote:<br><br>${escaped(lastInbound.body_text.slice(0, 1500))}</blockquote>` : ''}
  </div>`

  try {
    const sendArgs: {
      from: string
      to: string
      subject: string
      html: string
      text: string
      headers?: Record<string, string>
    } = {
      from: `TM FoodStuff Support <${SUPPORT_FROM_EMAIL}>`,
      to: thread.customer_email,
      subject: replySubject,
      html: replyHtml,
      text: text + '\n\n— TM FoodStuff Support',
    }
    // Threading: set In-Reply-To + References so the customer's client
    // groups our reply under the original conversation.
    if (lastInbound?.message_id) {
      sendArgs.headers = {
        'In-Reply-To': lastInbound.message_id,
        'References': lastInbound.message_id,
      }
    }
    const { data: sent, error: sendErr } = await resend.emails.send(sendArgs)
    if (sendErr) {
      return NextResponse.json({ error: sendErr.message || 'Send failed' }, { status: 500 })
    }

    const adminEmail = session.state === 'ok' ? session.email : null

    // Persist the outbound message. resend_message_id is what Resend
    // returned; we also store our own message_id as the Resend id (best
    // approximation — Resend uses it as the actual SMTP Message-ID).
    const { error: insertErr } = await supabase.from('support_messages').insert({
      thread_id: id,
      direction: 'out',
      from_email: SUPPORT_FROM_EMAIL,
      from_name: 'TM FoodStuff Support',
      to_email: thread.customer_email,
      subject: replySubject,
      body_text: text,
      body_html: replyHtml,
      message_id: sent?.id ? `<${sent.id}@resend>` : null,
      in_reply_to: lastInbound?.message_id || null,
      resend_message_id: sent?.id || null,
      sent_by: adminEmail,
    })
    if (insertErr) {
      console.error('[inbox/reply] persist outbound failed:', insertErr)
    }

    if (body.markResolved) {
      await supabase
        .from('support_threads')
        .update({ status: 'resolved', updated_at: new Date().toISOString() })
        .eq('id', id)
    } else {
      // Reply implies we're waiting on the customer.
      await supabase
        .from('support_threads')
        .update({ status: 'pending_customer', updated_at: new Date().toISOString() })
        .eq('id', id)
    }

    await logAdminAction({
      supabase,
      action: 'support_thread.replied',
      entity: `thread:${id}`,
      metadata: { resend_message_id: sent?.id, resolved: !!body.markResolved },
    })

    return NextResponse.json({ ok: true, message_id: sent?.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Send failed'
    console.error('[inbox/reply] send failed:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
