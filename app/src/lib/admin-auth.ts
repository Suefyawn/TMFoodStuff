import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'

// 'driver' is a scoped role that only sees the delivery queue + their own
// shifts. They use the same /dashboard/login but the dashboard layout
// auto-routes them to /dashboard/deliveries on entry and blocks everything
// else. Admin/staff retain full or near-full access.
export type AdminRole = 'admin' | 'staff' | 'driver'

// Allowlist of paths a driver can navigate to. Everything else under
// /dashboard/* redirects to /dashboard/deliveries.
const DRIVER_ALLOWED_PATHS = [
  '/dashboard/deliveries',
  '/dashboard/logout',
]

export function isDriverAllowedPath(pathname: string): boolean {
  return DRIVER_ALLOWED_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

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
  const role: AdminRole = data.role === 'admin' ? 'admin' : data.role === 'driver' ? 'driver' : 'staff'
  return { role }
}

// Lets driver-only routes (and shared routes like /dashboard/deliveries)
// authorise drivers without granting full dashboard access.
export async function isDriverOrAdminAuthed(): Promise<boolean> {
  const session = await getDashboardSession()
  return session.state === 'ok'
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
//
// Prefer `requirePermission(...)` for new code — this stays for the routes
// that pre-date the permission catalog.
export async function isAdminAdminAuthed(): Promise<boolean> {
  const session = await getDashboardSession()
  return session.state === 'ok' && session.role === 'admin'
}

// Returns the session if it has the given permission, otherwise returns
// null. Lazy-imports the permission catalog to avoid a circular dep.
export async function requirePermission(
  permission: import('./permissions').Permission,
): Promise<DashboardSession & { state: 'ok' } | null> {
  const session = await getDashboardSession()
  if (session.state !== 'ok') return null
  const { hasPermission } = await import('./permissions')
  if (!hasPermission(session.role, permission)) return null
  return session
}
