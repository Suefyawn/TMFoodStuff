import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createDashboardSupabaseServer } from '@/lib/dashboard-supabase-server'
import { createServerSupabaseAdmin } from '@/lib/supabase-service-role'

export type DashboardRole = 'owner' | 'manager' | 'admin' | 'staff'

export type DashboardSession = {
  user: { id: string; email?: string }
  role: DashboardRole
  supabase: SupabaseClient
}

/**
 * Single source of truth: cookie-backed Supabase user + staff row (profiles or admin_users).
 * Used by RSC pages, API routes, and must match any dashboard access checks.
 */
export async function getDashboardSession(): Promise<DashboardSession | null> {
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

export async function getDashboardSupabase(): Promise<SupabaseClient> {
  const session = await getDashboardSession()
  if (!session) redirect('/dashboard/login')
  return session.supabase
}
