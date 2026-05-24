// GDPR data export. Returns every piece of personal data we hold about
// the signed-in customer as a downloadable JSON file.
//
// Covers: profile, addresses, orders (with items + delivery info),
// loyalty ledger, reviews, referrals (sent + received), wishlist,
// subscriptions, push subscription endpoints (without keys for
// security), and audit-log entries that touched their record.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceRoleClient()
  const [
    { data: profile },
    { data: addresses },
    { data: orders },
    { data: ledger },
    { data: reviews },
    { data: referralsGiven },
    { data: referralsReceived },
    { data: wishlist },
    { data: subscriptions },
    { data: pushSubs },
  ] = await Promise.all([
    supabase.from('customers').select('id, email, full_name, phone, tier, marketing_email, marketing_sms, marketing_push, referral_code, created_at').eq('id', customer.id).maybeSingle(),
    supabase.from('customer_addresses').select('*').eq('customer_id', customer.id),
    supabase.from('orders').select('order_number, status, payment_method, payment_status, customer_name, customer_email, customer_phone, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_notes, delivery_slot, delivery_date, items, subtotal_aed, vat_aed, delivery_fee_aed, promo_discount_aed, total_aed, promo_code, created_at, updated_at').eq('customer_id', customer.id),
    supabase.from('customer_points_ledger').select('delta, reason, description, created_at, expires_at').eq('customer_id', customer.id).order('created_at', { ascending: true }),
    supabase.from('product_reviews').select('product_id, rating, title, body, images, verified_purchase, status, created_at').eq('customer_id', customer.id),
    supabase.from('customer_referrals').select('referred_id, referred_order_id, status, reward_points, created_at, rewarded_at').eq('referrer_id', customer.id),
    supabase.from('customer_referrals').select('referrer_id, referred_order_id, status, reward_points, created_at, rewarded_at').eq('referred_id', customer.id),
    supabase.from('customer_wishlist').select('product_id, created_at').eq('customer_id', customer.id),
    supabase.from('subscriptions').select('*').eq('customer_id', customer.id),
    supabase.from('push_subscriptions').select('endpoint, user_agent, created_at, last_seen_at').eq('customer_id', customer.id),
  ])

  const payload = {
    generated_at: new Date().toISOString(),
    profile,
    addresses: addresses || [],
    orders: orders || [],
    points_ledger: ledger || [],
    reviews: reviews || [],
    referrals_given: referralsGiven || [],
    referrals_received: referralsReceived || [],
    wishlist: wishlist || [],
    subscriptions: subscriptions || [],
    push_subscriptions: pushSubs || [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="tmfoodstuff-data-${customer.id}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
