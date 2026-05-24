// Fires a broadcast inline. Bounded at 1000 recipients per send (lambda
// timeout budget); larger audiences should be split. Records one row in
// `broadcasts` with per-channel sent/failed counters so /dashboard/broadcasts
// becomes the campaign history.
//
// Concurrency: small parallel batches (5 at a time per channel) so we don't
// flood the email/SMS providers with bursty traffic while still finishing
// in a reasonable wall-clock.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed, getDashboardSession } from '@/lib/admin-auth'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { sendSms } from '@/lib/notify'
import { logAdminAction } from '@/lib/audit'
import { SITE_URL } from '@/lib/site'
import { resolveAudience, type BroadcastAudience } from '@/lib/broadcast-audience'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_RECIPIENTS = 1000
const CONCURRENCY = 5

type Channel = 'email' | 'sms' | 'both'

interface SendBody {
  channel: Channel
  audience: BroadcastAudience
  subject?: string
  body: string
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function htmlTemplate(subject: string, body: string): string {
  // Same shell as the admin-message composer so all broadcasted email
  // looks consistent with one-off operator messages.
  return `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%"><tr><td align="center">
    <table width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
      <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:900;font-size:18px">TM FoodStuff</td></tr>
      <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65;white-space:pre-line">${escapeHtml(body)}</td></tr>
      <tr><td style="background:#f9fafb;padding:14px 28px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
        Sent by TM FoodStuff · <a href="${SITE_URL}" style="color:#16a34a;text-decoration:none">tmfoodstuff.ae</a>
        · <a href="${SITE_URL}/unsubscribe" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

async function runBatched<T>(items: T[], worker: (item: T) => Promise<boolean>): Promise<{ ok: number; fail: number }> {
  let ok = 0, fail = 0
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const slice = items.slice(i, i + CONCURRENCY)
    const results = await Promise.all(slice.map(it => worker(it).catch(() => false)))
    for (const r of results) r ? ok++ : fail++
  }
  return { ok, fail }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as SendBody

  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Body is required.' }, { status: 400 })
  }
  if (body.body.length > 4000) {
    return NextResponse.json({ error: 'Body is too long (4000 chars max).' }, { status: 400 })
  }
  const subject = (body.subject || '').trim().slice(0, 140) || 'A note from TM FoodStuff'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const targets = (await resolveAudience(supabase, body.audience)).slice(0, MAX_RECIPIENTS)

  const wantsEmail = body.channel === 'email' || body.channel === 'both'
  const wantsSms = body.channel === 'sms' || body.channel === 'both'

  // Email run.
  let emailRes = { ok: 0, fail: 0 }
  if (wantsEmail) {
    const resend = getResend()
    const html = htmlTemplate(subject, body.body)
    const emailTargets = targets.filter(t => t.email)
    if (!resend) {
      emailRes = { ok: 0, fail: emailTargets.length }
    } else {
      emailRes = await runBatched(emailTargets, async (t) => {
        await resend.emails.send({
          from: `TM FoodStuff <${FROM_EMAIL}>`,
          to: t.email!,
          subject,
          html,
        })
        return true
      })
    }
  }

  // SMS run.
  let smsRes = { ok: 0, fail: 0 }
  if (wantsSms) {
    const smsTargets = targets.filter(t => t.phone)
    smsRes = await runBatched(smsTargets, async (t) => {
      await sendSms(t.phone!, body.body.slice(0, 1500))
      return true
    })
  }

  const session = await getDashboardSession()
  const actor = session.state === 'ok' ? session.email : 'unknown'

  // Persist the campaign record.
  const { data: inserted } = await supabase.from('broadcasts').insert({
    channel: body.channel,
    audience: body.audience,
    subject: wantsEmail ? subject : null,
    body: body.body.slice(0, 4000),
    total_targeted: targets.length,
    email_sent: emailRes.ok,
    email_failed: emailRes.fail,
    sms_sent: smsRes.ok,
    sms_failed: smsRes.fail,
    created_by: actor,
  }).select('id').single()

  await logAdminAction({
    supabase,
    action: 'broadcast.sent',
    entity: `broadcast:${inserted?.id ?? 'unknown'}`,
    metadata: {
      channel: body.channel,
      audience: body.audience,
      subject: wantsEmail ? subject : undefined,
      total_targeted: targets.length,
      email: emailRes,
      sms: smsRes,
    },
  })

  return NextResponse.json({
    ok: true,
    id: inserted?.id,
    total_targeted: targets.length,
    email: emailRes,
    sms: smsRes,
  })
}
