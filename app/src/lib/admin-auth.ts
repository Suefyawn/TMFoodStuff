import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'

export type AdminRole = 'admin' | 'staff'

export type DashboardSession =
  | { state: 'guest' }
  | { state: 'denied'; email: string }
  | { state: 'ok'; email: string; role: AdminRole }

// Checks the admin allowlist (admin_users table) with the service-role client.
// Returns the row when present so callers also get the role.
async function getAllowlistRow(email: string): Promise<{ role: AdminRole } | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await admin
    .from('admin_users')
    .select('role, is_active')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  if (!data || data.is_active === false) return null
  const role: AdminRole = data.role === 'admin' ? 'admin' : 'staff'
  return { role }
}

// Resolves the full dashboard session state. Used by the dashboard layout to
// distinguish a logged-out visitor from an authenticated-but-unauthorised one.
export async function getDashboardSession(): Promise<DashboardSession> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { state: 'guest' }
  const row = await getAllowlistRow(user.email)
  if (!row) return { state: 'denied', email: user.email }
  return { state: 'ok', email: user.email, role: row.role }
}

// True only when the caller is an authenticated, allowlisted admin (any role).
// Used by every /api/dashboard/* route handler that requires general access.
export async function isAdminAuthed(): Promise<boolean> {
  return (await getDashboardSession()).state === 'ok'
}

// Strict gate: only role='admin' (not 'staff'). Use for destructive operations
// like refunds, product deletes, and bulk actions. Staff get read-write on
// orders/products but can't fire money-moving or irreversible changes.
export async function isAdminAdminAuthed(): Promise<boolean> {
  const session = await getDashboardSession()
  return session.state === 'ok' && session.role === 'admin'
}
