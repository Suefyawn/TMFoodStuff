import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseForUser, dashboardCookieNames } from '@/lib/dashboard-auth'

/** Supabase client for dashboard RSC — uses staff JWT from cookie (RLS applies). */
export async function getDashboardSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const token = cookieStore.get(dashboardCookieNames.access)?.value
  if (!token) redirect('/dashboard/login')
  return createServerSupabaseForUser(token)
}
