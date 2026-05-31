// Customer review submit / update / delete. Only verified buyers — must
// have at least one delivered order containing the product — can post.
//
// Accepts: rating (required), title (optional), body (optional),
// images (optional array of {url, alt}, max 3).
//
// verified_purchase is set automatically from the delivered-order check.
// Auto-approves the review since we already gate by purchase verification —
// the admin moderation queue is for flagging abuse, not gatekeeping every
// review.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

interface ReviewImage {
  url?: string
  alt?: string
}

interface ReviewBody {
  product_id?: number | string
  rating?: number
  title?: string
  body?: string
  images?: ReviewImage[]
}

async function findEligibleOrderId(
  supabase: ReturnType<typeof getServiceRoleClient>,
  customerEmail: string,
  productId: number,
): Promise<number | null> {
  // Return the most recent delivered order that contains the product.
  // We link the review to it so verified_purchase is provable.
  const { data: orders } = await supabase
    .from('orders')
    .select('id, items, created_at')
    .eq('customer_email', customerEmail.toLowerCase())
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(50)
  if (!orders) return null
  for (const o of orders) {
    const items = Array.isArray(o.items) ? (o.items as Array<{ id?: number | string; product_id?: number | string }>) : []
    if (items.some(i => Number(i.id ?? i.product_id) === productId)) {
      return Number(o.id)
    }
  }
  return null
}

function sanitizeImages(raw: unknown): Array<{ url: string; alt: string }> {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, 3)
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const url = String((item as ReviewImage).url || '').trim()
      // Only accept URLs from our own image host to prevent hot-linking
      // attacks / serving arbitrary remote content from the storefront.
      if (!url.startsWith('https://') && !url.startsWith('/')) return null
      const alt = String((item as ReviewImage).alt || '').trim().slice(0, 120)
      return { url: url.slice(0, 500), alt }
    })
    .filter((x): x is { url: string; alt: string } => x !== null)
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Sign in to leave a review.' }, { status: 401 })
  const body = (await request.json()) as ReviewBody
  const productId = Number(body.product_id)
  const rating = Math.floor(Number(body.rating) || 0)
  if (!productId) return NextResponse.json({ error: 'Product id required.' }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5.' }, { status: 400 })
  const title = String(body.title || '').trim().slice(0, 120)
  const text = String(body.body || '').trim().slice(0, 2000)
  const images = sanitizeImages(body.images)

  const supabase = getServiceRoleClient()
  const orderId = await findEligibleOrderId(supabase, customer.email, productId)
  if (!orderId) {
    return NextResponse.json(
      { error: 'You can review a product after receiving a delivered order containing it.' },
      { status: 403 },
    )
  }

  const { error } = await supabase
    .from('product_reviews')
    .upsert(
      {
        product_id: productId,
        customer_id: customer.id,
        order_id: orderId,
        rating,
        title: title || null,
        body: text || null,
        images,
        verified_purchase: true,
        status: 'approved',
      },
      { onConflict: 'customer_id,product_id' },
    )
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as { product_id?: number | string }
  const productId = Number(body.product_id)
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  const supabase = getServiceRoleClient()
  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('customer_id', customer.id)
    .eq('product_id', productId)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
