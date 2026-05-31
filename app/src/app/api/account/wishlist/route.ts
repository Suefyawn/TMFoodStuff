import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

// Returns the IDs (and lightweight product info) for the signed-in customer's
// wishlist. Used by both the wishlist page and the WishlistButton on product
// cards (via the zustand store, which only loads once per session).
export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ signedIn: false, items: [] })

  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('customer_wishlists')
    .select('product_id, created_at, products(id, slug, name, name_ar, price_aed, compare_at_price_aed, unit, stock, emoji, image_url, is_organic, is_active)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  type Row = {
    product_id: number
    created_at: string
    products: {
      id: number
      slug: string
      name: string
      name_ar: string | null
      price_aed: number
      compare_at_price_aed: number | null
      unit: string | null
      stock: number | null
      emoji: string | null
      image_url: string | null
      is_organic: boolean | null
      is_active: boolean | null
    } | null
  }
  const items = ((data || []) as unknown as Row[])
    .filter(r => r.products?.is_active !== false)
    .map(r => ({
      productId: r.product_id,
      addedAt: r.created_at,
      product: r.products,
    }))
  return NextResponse.json({ signedIn: true, items })
}

interface WishlistBody { product_id: number | string }

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as WishlistBody
  const productId = Number(body.product_id)
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  const supabase = getServiceRoleClient()
  const { error } = await supabase
    .from('customer_wishlists')
    .upsert(
      { customer_id: customer.id, product_id: productId },
      { onConflict: 'customer_id,product_id', ignoreDuplicates: true },
    )
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as WishlistBody
  const productId = Number(body.product_id)
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  const supabase = getServiceRoleClient()
  const { error } = await supabase
    .from('customer_wishlists')
    .delete()
    .eq('customer_id', customer.id)
    .eq('product_id', productId)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
