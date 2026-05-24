// Customer review submit / update / delete. Only verified buyers — must
// have at least one delivered order containing the product — can post.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

interface ReviewBody {
  product_id?: number | string
  rating?: number
  body?: string
}

async function customerCanReviewProduct(
  supabase: ReturnType<typeof getServiceRoleClient>,
  customerEmail: string,
  productId: number,
): Promise<boolean> {
  // Look for any delivered order from this customer whose items array
  // contains the product id. Cheap because we cap to a handful of rows.
  const { data: orders } = await supabase
    .from('orders')
    .select('items')
    .eq('customer_email', customerEmail.toLowerCase())
    .eq('status', 'delivered')
    .limit(50)
  if (!orders) return false
  return orders.some(o => {
    const items = Array.isArray(o.items) ? (o.items as Array<{ id?: number | string }>) : []
    return items.some(i => Number(i.id) === productId)
  })
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Sign in to leave a review.' }, { status: 401 })
  const body = (await request.json()) as ReviewBody
  const productId = Number(body.product_id)
  const rating = Math.floor(Number(body.rating) || 0)
  if (!productId) return NextResponse.json({ error: 'Product id required.' }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5.' }, { status: 400 })
  const text = String(body.body || '').trim().slice(0, 1000)

  const supabase = getServiceRoleClient()
  const eligible = await customerCanReviewProduct(supabase, customer.email, productId)
  if (!eligible) {
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
        rating,
        body: text || null,
        status: 'approved',
      },
      { onConflict: 'customer_id,product_id' },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
