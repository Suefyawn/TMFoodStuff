// Self-service "my invite link expired — send me a fresh one" endpoint.
// Public (the invitee has no session yet) but safe: it only ever emails a
// fresh set-password link to an address that is ALREADY an active team member,
// and only to that address — so it leaks nothing and can't grant new access.
// Rate-limited. This makes the one-time invite token's expiry self-healing.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { readJsonBody } from '@/lib/http'
import { isValidEmail } from '@/lib/validators'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!rateLimit(`team-resend:${getClientIp(request)}`, 5, 300_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })
  }
  const body = await readJsonBody<{ email?: string }>(request)
  const email = (body?.email || '').trim().toLowerCase()
  if (!isValidEmail(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Only act for an active team member. Respond 200 either way so this can't be
  // used to probe who's on the team.
  const { data: member } = await supabase
    .from('admin_users')
    .select('email, is_active')
    .eq('email', email)
    .maybeSingle()

  if (member && member.is_active !== false) {
    try {
      const redirectTo = `${SITE_URL}/dashboard/set-password`
      // recovery works whether or not they've set a password yet; falls back to
      // invite for an account that doesn't exist in auth yet.
      let linkType: 'recovery' | 'invite' = 'recovery'
      let gen = await supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
      if (gen.error) {
        linkType = 'invite'
        gen = await supabase.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
      }
      const tokenHash = gen.data?.properties?.hashed_token
      const resend = getResend()
      if (tokenHash && resend) {
        const link = `${SITE_URL}/dashboard/set-password?token_hash=${encodeURIComponent(tokenHash)}&type=${linkType}`
        await resend.emails.send({
          from: `TM FoodStuff <${FROM_EMAIL}>`,
          to: email,
          subject: 'Your TM FoodStuff dashboard link',
          html: `<!DOCTYPE html><html><body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
            <table width="100%"><tr><td align="center">
              <table width="520" style="max-width:520px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
                <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:800;font-size:18px">TM FoodStuff</td></tr>
                <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65">
                  <p style="margin:0 0 14px">Here's a fresh link to set your password and open the dashboard. It expires in about an hour, so please use it soon.</p>
                  <p style="margin:18px 0;text-align:center">
                    <a href="${link}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px">Set your password →</a>
                  </p>
                  <p style="margin:18px 0 0;color:#9ca3af;font-size:12px">If you didn't request this, you can ignore it.</p>
                </td></tr>
              </table>
            </td></tr></table>
          </body></html>`,
        })
      }
    } catch (err) {
      console.error('[team/resend] failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
