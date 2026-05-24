// GDPR "delete my account" — soft delete to preserve order/audit history.
//
// We CAN'T hard-delete because:
//   1. Orders need to stay for accounting / tax records (UAE requires
//      5 years of e-commerce records).
//   2. Audit log references break.
//   3. Orphan rows in loyalty ledger, reviews, referrals.
//
// Instead we anonymise PII on the customer row, sever the Supabase Auth
// link, and stamp deleted_at so the row disappears from admin lists.
// Orders keep their captured customer_name/email at the time of placement
// (those are independent text columns, not joins).
//
// Hard-deletion can be done by an admin via a separate SQL path if a
// regulator insists.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceRoleClient()
  const anonEmail = `deleted-${customer.id}@removed.tmfoodstuff.ae`
  const nowIso = new Date().toISOString()

  // 1. Anonymise the customer row.
  await supabase
    .from('customers')
    .update({
      email: anonEmail,
      full_name: 'Deleted user',
      phone: null,
      auth_user_id: null,
      is_active: false,
      deleted_at: nowIso,
      marketing_email: false,
      marketing_sms: false,
      marketing_push: false,
      admin_notes: customer.email ? `Deleted by self-service on ${nowIso}. Was ${customer.email}.` : `Deleted by self-service on ${nowIso}.`,
    })
    .eq('id', customer.id)

  // 2. Drop all push subscriptions, wishlist, addresses — none of these
  //    are needed for accounting and they contain only personal data.
  await Promise.all([
    supabase.from('push_subscriptions').delete().eq('customer_id', customer.id),
    supabase.from('customer_wishlists').delete().eq('customer_id', customer.id),
    supabase.from('customer_addresses').delete().eq('customer_id', customer.id),
    supabase.from('customer_carts').delete().eq('customer_id', customer.id),
    // Cancel any active subscriptions so the dispatcher doesn't try to
    // place new orders against the dead account.
    supabase.from('subscriptions').update({ status: 'cancelled', cancelled_at: nowIso }).eq('customer_id', customer.id),
  ])

  // 3. Burn the auth session by clearing Supabase cookies. The next
  //    page load redirects to login.
  const jar = await cookies()
  for (const c of jar.getAll()) {
    if (c.name.startsWith('sb-') || c.name.startsWith('supabase')) {
      jar.delete(c.name)
    }
  }

  return NextResponse.json({ ok: true })
}
