import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

type DashboardRole = 'admin' | 'staff'

const ACCESS_COOKIE = 'sb-access-token'
const REFRESH_COOKIE = 'sb-refresh-token'

function getAnonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export function createServerSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getDashboardSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
  if (!accessToken) return null

  const supabase = getAnonClient()
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null

  const admin = createServerSupabaseAdmin()
  const { data: adminUser, error: adminError } = await admin
    .from('admin_users')
    .select('role,is_active')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (adminError || !adminUser || !adminUser.is_active) return null
  return { user: data.user, role: adminUser.role as DashboardRole }
}

async function requireDashboardAuthWithRole(requiredRole?: DashboardRole) {
  const session = await getDashboardSession()
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (requiredRole === 'admin' && session.role !== 'admin') {
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

export const dashboardCookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
}
