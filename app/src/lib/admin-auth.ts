import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'

export type DashboardSession =
  | { state: 'guest' }
  | { state: 'denied'; email: string }
  | { state: 'ok'; email: string }

// Checks the admin allowlist (admin_users table) with the service-role client.
// The client is created per-call so importing this module never touches env
// vars at load time (keeps the production build from failing).
async function isAllowlisted(email: string): Promise<boolean> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await admin
    .from('admin_users')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return !!data
}

// Resolves the full dashboard session state. Used by the dashboard layout to
// distinguish a logged-out visitor from an authenticated-but-unauthorised one.
export async function getDashboardSession(): Promise<DashboardSession> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { state: 'guest' }
  return (await isAllowlisted(user.email))
    ? { state: 'ok', email: user.email }
    : { state: 'denied', email: user.email }
}

// True only when the caller is an authenticated, allowlisted admin.
// Used by every /api/dashboard/* route handler.
export async function isAdminAuthed(): Promise<boolean> {
  return (await getDashboardSession()).state === 'ok'
}
