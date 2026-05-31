// Cart sync + recovery endpoints.
//
// POST /api/cart/sync — auth-required. Storefront pushes the current cart
//   snapshot on every change (debounced client-side). Upserts a single row
//   per customer. Clears recovered_at so a customer who came back, kept
//   shopping, and walked away again is eligible for another email.
//
// GET /api/cart/recover?t=TOKEN — public. Reads the cart snapshot by token
//   so the recovery email link works even when the customer is signed out.
//   Returns the items the storefront should restore into local cart state.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { readJsonBody } from '@/lib/http'
import type { CartItemSnapshot } from '@/lib/cart-recovery'

export const dynamic = 'force-dynamic'

interface SyncBody {
  items: CartItemSnapshot[]
  subtotal: number
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ ok: true, skipped: 'not_signed_in' })

  const body = await readJsonBody<SyncBody>(request)
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const supabase = getServiceRoleClient()
  const itemCount = body.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
  const subtotal = Number(body.subtotal) || 0

  // Upsert by customer_id. Clear recovered_at on every sync so a returning
  // shopper becomes eligible for a fresh nudge if they abandon again.
  const { error } = await supabase
    .from('customer_carts')
    .upsert({
      customer_id: customer.id,
      items: body.items,
      subtotal_aed: subtotal,
      item_count: itemCount,
      updated_at: new Date().toISOString(),
      recovered_at: itemCount === 0 ? new Date().toISOString() : null,
    }, { onConflict: 'customer_id' })

  if (error) {
    console.error('[cart/sync] upsert failed:', error)
    return NextResponse.json({ error: 'Could not save cart.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('t')
  if (!token || !/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('customer_carts')
    .select('items, item_count, subtotal_aed, recovered_at')
    .eq('token', token)
    .maybeSingle()
  if (!data || data.item_count === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  // Mark recovered so we don't double-credit the same recovery.
  await supabase
    .from('customer_carts')
    .update({ recovered_at: new Date().toISOString() })
    .eq('token', token)
    .is('recovered_at', null)
  return NextResponse.json({
    items: data.items,
    subtotal: Number(data.subtotal_aed),
  })
}
