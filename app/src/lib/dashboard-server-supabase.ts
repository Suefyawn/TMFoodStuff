import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createDashboardSupabaseServer } from '@/lib/dashboard-supabase-server'
import { createServerSupabaseForUser } from '@/lib/dashboard-auth'

/** Supabase client for dashboard RSC — session from SSR cookies (RLS applies). */
export async function getDashboardSupabase(): Promise<SupabaseClient> {
  const supabase = await createDashboardSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) redirect('/dashboard/login')
  return createServerSupabaseForUser(token)
}
