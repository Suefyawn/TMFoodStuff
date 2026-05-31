// CRUD for the admin_users table — the allowlist that controls who can sign
// into /dashboard. Admin-only (staff and drivers can read their own session
// but can't grant access to others).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission, getDashboardSession } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

async function sendInvitationEmail(email: string, role: 'admin' | 'staff' | 'driver', invitedBy: string, actionLink: string | null) {
  const resend = getResend()
  if (!resend) return
  const roleLabels: Record<string, string> = {
    admin: 'Admin (full access)',
    staff: 'Staff (orders, products, customers)',
    driver: 'Driver (delivery queue only)',
  }
  // When we have a Supabase action link, the CTA takes the invitee straight to
  // set their password (they have no account/password otherwise). Fall back to
  // the plain login URL only if link generation failed.
  const cta = actionLink || `${SITE_URL}/dashboard/login`
  const ctaText = actionLink ? 'Set your password &amp; open the dashboard' : 'Open the dashboard'
  const intro = actionLink
    ? 'Click below to set your password and access the dashboard. The link expires in 24 hours.'
    : "Sign in at the link below with this email address. If you don't have an account yet, you'll be able to create one on the same page."
  try {
    await resend.emails.send({
      from: `TM FoodStuff <${FROM_EMAIL}>`,
      to: email,
      subject: `You've been invited to the TM FoodStuff team`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        <table width="100%"><tr><td align="center">
          <table width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:900;font-size:18px">TM FoodStuff</td></tr>
            <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65">
              <p style="margin:0 0 14px;font-size:16px;color:#111827">You're invited to the team</p>
              <p style="margin:0 0 14px"><strong>${invitedBy.replace(/[<>&]/g, '')}</strong> has added you to the TM FoodStuff dashboard as <strong>${roleLabels[role]}</strong>.</p>
              <p style="margin:0 0 18px">${intro}</p>
              <p style="margin:18px 0;text-align:center">
                <a href="${cta}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:800;font-size:14px">${ctaText} →</a>
              </p>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">If you weren't expecting this email, you can safely ignore it — without signing in, no access is granted.</p>
            </td></tr>
          </table>
        </td></tr></table>
      </body></html>`,
    })
  } catch (err) {
    console.error('[team] invitation email failed:', err)
  }
}

export const dynamic = 'force-dynamic'

type Role = 'super_admin' | 'admin' | 'staff' | 'driver'

function isRole(v: unknown): v is Role {
  return v === 'super_admin' || v === 'admin' || v === 'staff' || v === 'driver'
}

export async function GET() {
  if (!(await requirePermission('team.manage'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active, created_at')
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ rows: data || [] })
}

interface CreateBody { email?: string; role?: string }

export async function POST(request: Request) {
  if (!(await requirePermission('team.manage'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as CreateBody
  const email = (body.email || '').trim().toLowerCase()
  const role = body.role || 'staff'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  // Only a super admin can mint another super admin.
  const session = await getDashboardSession()
  if (role === 'super_admin' && (session.state !== 'ok' || session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Only a super admin can grant the super admin role.' }, { status: 403 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase
    .from('admin_users')
    .upsert({ email, role, is_active: true }, { onConflict: 'email' })
    .select('id, email, role, is_active')
    .single()
  if (error || !data) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'team.member_added',
    entity: `admin_user:${data.id}`,
    metadata: { email, role },
  })

  // Generate a Supabase action link so the invitee can actually get in: the
  // dashboard login is password-only with no self-signup, and a new member has
  // no auth account yet. `invite` creates the auth user; if they already have
  // an account, fall back to `recovery`. We build our OWN link to
  // /dashboard/set-password carrying the token_hash, and verify it there with
  // verifyOtp — this is the @supabase/ssr-recommended flow and, unlike the raw
  // action_link, isn't consumed by email link-scanners (a plain GET doesn't run
  // verifyOtp, so the one-time token survives until the real click).
  let actionLink: string | null = null
  try {
    const redirectTo = `${SITE_URL}/dashboard/set-password`
    let linkType: 'invite' | 'recovery' = 'invite'
    let gen = await supabase.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
    if (gen.error) {
      linkType = 'recovery'
      gen = await supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
    }
    const tokenHash = gen.data?.properties?.hashed_token
    if (tokenHash) {
      actionLink = `${SITE_URL}/dashboard/set-password?token_hash=${encodeURIComponent(tokenHash)}&type=${linkType}`
    }
  } catch (err) {
    console.error('[team] generateLink failed:', err)
  }

  // Await the invitation email so it actually completes — a fire-and-forget
  // send is unreliable on serverless, where the function can be frozen the
  // moment the response returns. sendInvitationEmail swallows its own errors.
  const invitedBy = session.state === 'ok' ? session.email : 'an administrator'
  await sendInvitationEmail(email, role as 'admin' | 'staff' | 'driver', invitedBy, actionLink)

  return NextResponse.json({ row: data, invited: true })
}

interface PatchBody { id?: string; role?: string; is_active?: boolean }

export async function PATCH(request: Request) {
  if (!(await requirePermission('team.manage'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as PatchBody
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.role !== undefined) {
    if (!isRole(body.role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    updates.role = body.role
  }
  if (body.is_active !== undefined) updates.is_active = !!body.is_active
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Don't allow an admin to demote / deactivate themselves into a lockout.
  const session = await getDashboardSession()
  const { data: target } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('id', id)
    .maybeSingle()
  const actorIsSuper = session.state === 'ok' && session.role === 'super_admin'
  // Only a super admin may modify a super admin, or promote anyone to one.
  if (target && !actorIsSuper) {
    if (target.role === 'super_admin') {
      return NextResponse.json({ error: 'Only a super admin can modify a super admin.' }, { status: 403 })
    }
    if (updates.role === 'super_admin') {
      return NextResponse.json({ error: 'Only a super admin can grant the super admin role.' }, { status: 403 })
    }
  }
  // Never strip the last active super admin (lockout protection).
  if (target?.role === 'super_admin' && (updates.is_active === false || (typeof updates.role === 'string' && updates.role !== 'super_admin'))) {
    const { count } = await supabase.from('admin_users').select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin').eq('is_active', true)
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "You can't deactivate or demote the last super admin." }, { status: 400 })
    }
  }
  if (target && session.state === 'ok' && target.email === session.email) {
    if (updates.role && updates.role !== 'admin' && updates.role !== 'super_admin') {
      return NextResponse.json({ error: "You can't demote your own account." }, { status: 400 })
    }
    if (updates.is_active === false) {
      return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select('id, email, role, is_active')
    .single()
  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'team.member_updated',
    entity: `admin_user:${id}`,
    metadata: updates,
  })
  return NextResponse.json({ row: data })
}

interface DeleteBody { id?: string }

export async function DELETE(request: Request) {
  if (!(await requirePermission('team.manage'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json()) as DeleteBody
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const session = await getDashboardSession()
  const { data: target } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('id', id)
    .maybeSingle()
  if (target && session.state === 'ok' && target.email === session.email) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 })
  }
  // Super admins can only be removed by another super admin, and never the last one.
  if (target?.role === 'super_admin') {
    if (!(session.state === 'ok' && session.role === 'super_admin')) {
      return NextResponse.json({ error: 'Only a super admin can remove a super admin.' }, { status: 403 })
    }
    const { count } = await supabase.from('admin_users').select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin').eq('is_active', true)
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "You can't remove the last super admin." }, { status: 400 })
    }
  }
  const { error } = await supabase.from('admin_users').delete().eq('id', id)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  await logAdminAction({
    supabase,
    action: 'team.member_removed',
    entity: `admin_user:${id}`,
    metadata: { email: target?.email },
  })
  return NextResponse.json({ ok: true })
}
