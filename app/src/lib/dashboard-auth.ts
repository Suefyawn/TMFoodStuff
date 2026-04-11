import { NextResponse } from 'next/server'
import { getDashboardSession, type DashboardRole } from '@/lib/dashboard-session'

export { createServerSupabaseAdmin } from '@/lib/supabase-service-role'
export type { DashboardSession } from '@/lib/dashboard-session'

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

/** @deprecated Legacy cookie names */
export const dashboardCookieNames = {
  access: 'sb-access-token',
  refresh: 'sb-refresh-token',
}
