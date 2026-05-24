// Admin-triggered ad-hoc message to a customer. Supports email (Resend)
// and SMS (Twilio); admin picks one or both channels. Body is rendered as
// plain text inside a minimal email template; SMS sends as-is.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { sendSms } from '@/lib/notify'
import { logAdminAction } from '@/lib/audit'
import { isValidEmail } from '@/lib/validators'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

interface MessageBody {
  email?: string
  phone?: string
  subject?: string
  body?: string
  channels?: Array<'email' | 'sms'>
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = (await request.json()) as MessageBody

  const channels = Array.isArray(data.channels) ? data.channels : []
  if (channels.length === 0) {
    return NextResponse.json({ error: 'Pick at least one channel.' }, { status: 400 })
  }

  const body = String(data.body || '').trim()
  if (!body) return NextResponse.json({ error: 'Message body is required.' }, { status: 400 })
  if (body.length > 4000) return NextResponse.json({ error: 'Message is too long (4000 chars max).' }, { status: 400 })

  const results: Record<string, 'sent' | 'skipped' | 'error'> = {}

  if (channels.includes('email')) {
    const email = String(data.email || '').trim().toLowerCase()
    if (!isValidEmail(email)) {
      results.email = 'skipped'
    } else {
      const resend = getResend()
      if (!resend) {
        results.email = 'skipped'
      } else {
        const subject = String(data.subject || '').trim().slice(0, 140) || 'A note from TM FoodStuff'
        const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:900;font-size:18px">TM FoodStuff</td></tr>
        <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65;white-space:pre-line">${escapeHtml(body)}</td></tr>
        <tr><td style="background:#f9fafb;padding:14px 28px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
          Sent by TM FoodStuff · <a href="${SITE_URL}" style="color:#16a34a;text-decoration:none">tmfoodstuff.ae</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
        try {
          await resend.emails.send({
            from: `TM FoodStuff <${FROM_EMAIL}>`,
            to: email,
            subject,
            html,
          })
          results.email = 'sent'
        } catch (err) {
          console.error('[admin-message] email failed:', err)
          results.email = 'error'
        }
      }
    }
  }

  if (channels.includes('sms')) {
    const phone = String(data.phone || '').trim()
    if (!phone) {
      results.sms = 'skipped'
    } else {
      try {
        await sendSms(phone, body.slice(0, 1500))
        results.sms = 'sent'
      } catch (err) {
        console.error('[admin-message] sms failed:', err)
        results.sms = 'error'
      }
    }
  }

  // Audit it — operational accountability for ad-hoc outreach.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  await logAdminAction({
    supabase,
    action: 'customer.message',
    entity: data.email || data.phone || 'unknown',
    metadata: {
      channels: channels,
      subject: data.subject?.slice(0, 140),
      body_length: body.length,
      results,
    },
  })

  return NextResponse.json({ ok: true, results })
}
