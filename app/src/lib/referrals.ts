// Referral programme — server-side helpers.
//
// Flow:
//   1. Visitor lands with /?ref=CODE — client component sets `tmf-ref` cookie.
//   2. Visitor signs up and places their first order. /api/orders calls
//      `recordReferralOnFirstOrder` which (a) finds the referring customer
//      from the code, (b) checks the referred customer has no prior orders,
//      (c) inserts a pending row in customer_referrals.
//   3. Order reaches `delivered` — /api/dashboard/orders calls
//      `rewardReferralOnDelivery` which marks the referral rewarded and
//      credits points to both customers via the existing ledger.
//
// All steps are best-effort: a failure to find the referrer / write the row
// must never block the order itself. We log and move on.
import type { SupabaseClient } from '@supabase/supabase-js'

export const REFERRAL_COOKIE = 'tmf-ref'
export const REFERRAL_REWARD_POINTS = 50

interface RewardRow {
  referrer_id: number
  referred_id: number
  reward_points: number
}

// Look up the referring customer by their share code. Returns null if no
// match — possibly mistyped, possibly the customer was deleted.
export async function findReferrerByCode(
  supabase: SupabaseClient,
  code: string,
): Promise<{ id: number; email: string } | null> {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z2-9]{8}$/.test(normalized)) return null
  const { data } = await supabase
    .from('customers')
    .select('id, email')
    .eq('referral_code', normalized)
    .maybeSingle()
  return data ? { id: data.id, email: data.email } : null
}

// Records the referral attempt right after an order is created. Only fires
// when:
//   - we have a referrer cookie that resolves to a real customer
//   - the referred customer hasn't placed an order before this one
//   - the referrer isn't the customer themselves (self-referral guard)
// Idempotent thanks to the (referrer_id, referred_id) unique index.
export async function recordReferralOnFirstOrder(
  supabase: SupabaseClient,
  args: {
    referralCode: string | null | undefined
    referredCustomerId: number | null
    orderId: number
  },
): Promise<void> {
  if (!args.referralCode || !args.referredCustomerId) return
  try {
    const referrer = await findReferrerByCode(supabase, args.referralCode)
    if (!referrer) return
    if (referrer.id === args.referredCustomerId) return

    // First-order guard: skip if this customer already has a previous order.
    const { count: priorOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', args.referredCustomerId)
      .neq('id', args.orderId)
    if ((priorOrders || 0) > 0) return

    await supabase
      .from('customer_referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: args.referredCustomerId,
        referred_order_id: args.orderId,
        status: 'pending',
        reward_points: REFERRAL_REWARD_POINTS,
      })
  } catch (err) {
    console.error('[referrals] recordReferralOnFirstOrder failed:', err)
  }
}

// Called when an order reaches `delivered`. Looks for any pending referral
// row tied to this order; if found, marks it rewarded and credits both the
// referrer and the referred via the loyalty ledger (idempotent on the
// existing UNIQUE (order_id, reason) constraint we already enforce).
export async function rewardReferralOnDelivery(
  supabase: SupabaseClient,
  args: { orderId: number },
): Promise<void> {
  try {
    const { data: rows } = await supabase
      .from('customer_referrals')
      .select('id, referrer_id, referred_id, reward_points')
      .eq('referred_order_id', args.orderId)
      .eq('status', 'pending')
    const referrals = (rows || []) as RewardRow[] & Array<{ id: number }>
    if (referrals.length === 0) return

    const now = new Date().toISOString()
    for (const r of referrals) {
      const points = r.reward_points || REFERRAL_REWARD_POINTS
      // Two ledger entries with distinct descriptions so the unique index
      // (which uses description) won't collide with prior order earns.
      const { error: ledgerErr } = await supabase.from('customer_points_ledger').insert([
        {
          customer_id: r.referrer_id,
          delta: points,
          reason: 'referral_reward',
          description: `referral:gave:${(r as { id: number }).id}`,
        },
        {
          customer_id: r.referred_id,
          delta: points,
          reason: 'referral_reward',
          description: `referral:got:${(r as { id: number }).id}`,
        },
      ])
      if (ledgerErr) {
        console.error('[referrals] ledger insert failed:', ledgerErr)
        continue
      }
      await supabase
        .from('customer_referrals')
        .update({ status: 'rewarded', rewarded_at: now })
        .eq('id', (r as { id: number }).id)
    }
  } catch (err) {
    console.error('[referrals] rewardReferralOnDelivery failed:', err)
  }
}
