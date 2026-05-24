// Marketing preferences (email / SMS / push opt-in flags) for the
// signed-in customer. Read via GET, update via PATCH.
//
// The broadcaster respects these — a customer who turned off marketing
// email won't receive future campaigns even if their address is in the
// audience. Transactional sends (order confirmation, receipts, etc.)
// are NOT gated by these toggles.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('customers')
    .select('marketing_email, marketing_sms, marketing_push')
    .eq('id', customer.id)
    .maybeSingle()
  return NextResponse.json({
    email: data?.marketing_email ?? true,
    sms: data?.marketing_sms ?? true,
    push: data?.marketing_push ?? true,
  })
}

interface PatchBody { email?: boolean; sms?: boolean; push?: boolean }

export async function PATCH(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as PatchBody
  const updates: Record<string, boolean> = {}
  if (body.email !== undefined) updates.marketing_email = !!body.email
  if (body.sms !== undefined) updates.marketing_sms = !!body.sms
  if (body.push !== undefined) updates.marketing_push = !!body.push
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })
  const supabase = getServiceRoleClient()
  const { error } = await supabase.from('customers').update(updates).eq('id', customer.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
