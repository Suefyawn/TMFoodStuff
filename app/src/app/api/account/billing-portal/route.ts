// Opens a Stripe Customer Portal session for the signed-in customer.
//
// The portal is where customers manage saved payment methods, view past
// invoices/charges, and update billing details — without us handling any
// card data ourselves.
//
// First call for a customer creates the Stripe Customer record and links
// it to their row; subsequent calls reuse it. The endpoint returns a
// short-lived URL the client redirects to.
//
// Prerequisite (one-time, operator side): enable the Customer Portal in
// the Stripe Dashboard at Settings → Billing → Customer portal, set the
// branding + return URL, save. Without that config the API throws a
// "No configuration provided" error which we surface verbatim.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { getStripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function POST() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Card payments are not configured on this site.' }, { status: 503 })
  }

  const supabase = getServiceRoleClient()
  const { data: profile } = await supabase
    .from('customers')
    .select('stripe_customer_id, email, full_name, phone')
    .eq('id', customer.id)
    .maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  let stripeCustomerId = profile.stripe_customer_id

  // Lazy-create the Stripe Customer the first time we need a portal.
  if (!stripeCustomerId) {
    try {
      const created = await stripe.customers.create({
        email: profile.email || customer.email,
        name: profile.full_name || undefined,
        phone: profile.phone || undefined,
        metadata: { customer_id: String(customer.id) },
      })
      stripeCustomerId = created.id
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customer.id)
    } catch (err) {
      console.error('[billing-portal] failed to create stripe customer:', err)
      return NextResponse.json({ error: 'Could not initialise billing.' }, { status: 500 })
    }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${SITE_URL}/account`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    // Most common failure here is "No configuration provided" — the
    // operator hasn't enabled the portal in the Stripe Dashboard yet.
    // Surface the message verbatim so they know what to do.
    const msg = err instanceof Error ? err.message : 'Could not open billing portal.'
    console.error('[billing-portal] session create failed:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
