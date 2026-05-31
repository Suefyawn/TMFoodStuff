// Push-notification fan-out to admin/staff devices. Used for operations
// alerts that need to reach the team fast — low stock, big incoming orders,
// failed payments — without waiting on email.
//
// Resolves admin/staff customer ids from admin_users, then calls
// sendPushToCustomer for each. Best-effort: never throws.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToCustomer, type PushPayload } from './push'
import { SITE_URL } from './site'

async function getAdminCustomerIds(supabase: SupabaseClient): Promise<number[]> {
  // Match by email: admin_users.email → customers.email → customers.id.
  // A team member may not have a customers row yet (they've never placed
  // an order) — those simply get no push, which is correct: no device
  // has subscribed for them anyway.
  const { data: admins } = await supabase
    .from('admin_users')
    .select('email')
    .eq('is_active', true)
    .in('role', ['admin', 'staff'])
  const emails = (admins || []).map(a => a.email).filter(Boolean)
  if (emails.length === 0) return []

  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .in('email', emails)
  return (customers || []).map(c => c.id)
}

export async function notifyAdminsLowStock(
  supabase: SupabaseClient,
  productName: string,
  productSlug: string,
  remaining: number,
): Promise<void> {
  try {
    const ids = await getAdminCustomerIds(supabase)
    if (ids.length === 0) return
    const payload: PushPayload = {
      title: `Low stock: ${productName}`,
      body: `${remaining} left — restock soon.`,
      url: `${SITE_URL}/dashboard/products?filter=low-stock`,
      tag: `low-stock-${productSlug}`,
    }
    // Await all device sends so they aren't dropped when the caller's
    // serverless function freezes after responding.
    await Promise.allSettled(ids.map(id => sendPushToCustomer(supabase, id, payload)))
  } catch (err) {
    console.error('[push-admin] notifyAdminsLowStock failed:', err)
  }
}
