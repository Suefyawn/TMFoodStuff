import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createDashboardSupabaseServer } from '@/lib/dashboard-supabase-server'
import { createServerSupabaseAdmin } from '@/lib/supabase-service-role'

type DashboardRole = 'owner' | 'manager' | 'admin' | 'staff'

export { createServerSupabaseAdmin } from '@/lib/supabase-service-role'

export type DashboardSession = {
  user: { id: string; email?: string }
  role: DashboardRole
  /** Cookie-backed client; use this for dashboard reads/writes under RLS. */
  supabase: SupabaseClient
}

async function getDashboardSession(): Promise<DashboardSession | null> {
  const supabase = await createDashboardSupabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return null

  const admin = createServerSupabaseAdmin()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role,is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileError && profile?.is_active) {
    return { user, role: profile.role as DashboardRole, supabase }
  }

  const { data: adminUser, error: adminError } = await admin
    .from('admin_users')
    .select('role,is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError || !adminUser || !adminUser.is_active) return null
  return { user, role: adminUser.role as DashboardRole, supabase }
}

async function requireDashboardAuthWithRole(requiredRole?: DashboardRole) {
  const session = await getDashboardSession()
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const isAdmin = session.role === 'owner' || session.role === 'manager' || session.role === 'admin'
  if (requiredRole === 'admin' && !isAdmin) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { ok: true as const, session }
}

export async function requireDashboardUser() {
  return requireDashboardAuthWithRole()
}

export async function requireDashboardAuth() {
  return requireDashboardAuthWithRole()
}

export async function requireDashboardRole(role: DashboardRole = 'staff') {
  return requireDashboardAuthWithRole(role)
}

export async function requireDashboardStaff() {
  return requireDashboardRole('staff')
}

/** @deprecated Legacy cookie names — use createDashboardSupabaseServer(). */
export const dashboardCookieNames = {
  access: 'sb-access-token',
  refresh: 'sb-refresh-token',
}
