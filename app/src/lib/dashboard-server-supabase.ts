import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createDashboardSupabaseServer } from '@/lib/dashboard-supabase-server'
import { createServerSupabaseAdmin } from '@/lib/supabase-service-role'

/**
 * Supabase client for dashboard RSC pages.
 * Uses the same cookie session as middleware (getUser), not getSession() — getSession()
 * is unreliable in Server Components and caused redirects to login on child routes.
 */
export async function getDashboardSupabase(): Promise<SupabaseClient> {
  const supabase = await createDashboardSupabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect('/dashboard/login')

  const admin = createServerSupabaseAdmin()
  const { data: profile } = await admin.from('profiles').select('is_active').eq('id', user.id).maybeSingle()
  if (profile?.is_active) return supabase

  const { data: adminUser } = await admin.from('admin_users').select('is_active').eq('user_id', user.id).maybeSingle()
  if (adminUser?.is_active) return supabase

  redirect('/dashboard/login')
}
