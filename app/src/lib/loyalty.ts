// Server-side helpers that the order routes call to manage the loyalty
// ledger. Kept here (separate from points.ts which holds the rules) so it
// can pull in the service-role client without dragging it into pages.
import type { SupabaseClient } from '@supabase/supabase-js'
import { pointsEarnedFor, pointsExpiryDate } from './points'

export async function getCustomerBalance(
  supabase: SupabaseClient,
  customerId: number,
): Promise<number> {
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('customer_points_ledger')
    .select('delta, expires_at')
    .eq('customer_id', customerId)
  return (data || [])
    .filter((r: { delta: number; expires_at: string | null }) =>
      !r.expires_at || r.expires_at > nowIso,
    )
    .reduce((s: number, r: { delta: number }) => s + r.delta, 0)
}

/**
 * Resolve which customer (if any) is on the hook for the given order email
 * and return their id. Returns null when we can't link.
 */
export async function findCustomerByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<number | null> {
  if (!email) return null
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Credit points for a delivered order, idempotent on (order_id,
 * 'order_earned'). Safe to call multiple times — the unique index
 * uniq_points_earn_per_order prevents duplicates.
 */
export async function earnPointsForOrder(
  supabase: SupabaseClient,
  args: { customerId: number; orderId: number; subtotalAed: number; orderNumber: string },
): Promise<number> {
  const points = pointsEarnedFor(args.subtotalAed)
  if (points <= 0) return 0
  const { error } = await supabase.from('customer_points_ledger').insert({
    customer_id: args.customerId,
    order_id: args.orderId,
    delta: points,
    reason: 'order_earned',
    description: `Earned from order ${args.orderNumber}`,
    expires_at: pointsExpiryDate().toISOString(),
  })
  if (error) {
    // Unique violation (23505) means we already credited this order — fine.
    const code = (error as { code?: string }).code
    if (code !== '23505') {
      console.error('[loyalty] earn insert failed:', error)
    }
    return 0
  }
  return points
}

/**
 * Record a redemption against a fresh order. Caller is responsible for
 * verifying the customer has the points (resolveRedemption() + balance
 * lookup) and for actually applying the AED discount to the order total.
 */
export async function recordRedemption(
  supabase: SupabaseClient,
  args: { customerId: number; orderId: number; points: number; aed: number; orderNumber: string },
): Promise<void> {
  if (args.points <= 0) return
  const { error } = await supabase.from('customer_points_ledger').insert({
    customer_id: args.customerId,
    order_id: args.orderId,
    delta: -args.points,
    reason: 'order_redeemed',
    description: `Redeemed ${args.points} pts for AED ${args.aed.toFixed(2)} on order ${args.orderNumber}`,
  })
  if (error) console.error('[loyalty] redeem insert failed:', error)
}

/**
 * Reverse the points side of an order that's being refunded:
 *   - cancel any earned credit that hadn't yet expired
 *   - restore any redeemed points so the customer can use them again
 */
export async function reverseOrderPoints(
  supabase: SupabaseClient,
  args: { orderId: number; orderNumber: string },
): Promise<void> {
  const { data: rows } = await supabase
    .from('customer_points_ledger')
    .select('id, customer_id, delta, reason')
    .eq('order_id', args.orderId)
    .in('reason', ['order_earned', 'order_redeemed'])
  if (!rows || rows.length === 0) return
  const reversals = rows.map(r => ({
    customer_id: r.customer_id,
    order_id: args.orderId,
    delta: -r.delta,
    reason: r.reason === 'order_earned'
      ? 'order_refunded_earn_reversal' as const
      : 'order_refunded_redeem_restore' as const,
    description: `Refund of order ${args.orderNumber}`,
  }))
  const { error } = await supabase.from('customer_points_ledger').insert(reversals)
  if (error) console.error('[loyalty] reversal insert failed:', error)
}
