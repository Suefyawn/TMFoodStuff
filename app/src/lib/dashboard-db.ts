import { createServerSupabaseAdmin } from '@/lib/supabase-service-role'

/**
 * After `requireDashboard*` validates the Supabase session + staff profile, use this
 * client for DB reads/writes. Matches admin dashboard expectations and avoids JWT/RLS
 * edge cases on nested queries (e.g. order_items) in some deployments.
 */
export function getDashboardDb() {
  return createServerSupabaseAdmin()
}
