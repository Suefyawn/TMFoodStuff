import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { getCustomerBalance } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

// One-shot summary for the storefront: who am I + my saved addresses + my
// loyalty balance. Used by the checkout page to prefill the delivery form
// for signed-in users and to show the points-redemption widget.
export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ signedIn: false })
  const supabase = getServiceRoleClient()
  const [{ data: profile }, { data: addresses }, pointsBalance, { count: referralCount }] = await Promise.all([
    supabase
      .from('customers')
      .select('full_name, phone, email, referral_code')
      .eq('id', customer.id)
      .maybeSingle(),
    supabase
      .from('customer_addresses')
      .select('id, label, building, street, area, emirate, makani, is_default')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    getCustomerBalance(supabase, customer.id),
    supabase
      .from('customer_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', customer.id)
      .eq('status', 'rewarded'),
  ])
  return NextResponse.json({
    signedIn: true,
    email: customer.email,
    fullName: profile?.full_name || customer.fullName || '',
    phone: profile?.phone || '',
    addresses: addresses || [],
    pointsBalance,
    referralCode: profile?.referral_code || null,
    referralCount: referralCount || 0,
  })
}

interface ProfilePatchBody { fullName?: string; phone?: string }

// PATCH lets the customer update name + phone (used post-checkout when we
// capture their phone for the first time).
export async function PATCH(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as ProfilePatchBody
  const updates: Record<string, string> = {}
  if (typeof body.fullName === 'string') updates.full_name = body.fullName.trim().slice(0, 120)
  if (typeof body.phone === 'string') updates.phone = body.phone.trim().slice(0, 40)
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })
  const supabase = getServiceRoleClient()
  const { error } = await supabase.from('customers').update(updates).eq('id', customer.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
