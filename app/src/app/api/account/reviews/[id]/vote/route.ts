// Toggle a "helpful" vote on a review. Customer-only. The trigger on
// product_review_votes keeps product_reviews.helpful_count in sync.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Sign in to vote.' }, { status: 401 })
  const { id: idParam } = await params
  const reviewId = Number(idParam)
  if (!Number.isFinite(reviewId)) return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })

  const supabase = getServiceRoleClient()
  // Try to insert; if it already exists, delete instead (toggle).
  const { data: existing } = await supabase
    .from('product_review_votes')
    .select('review_id')
    .eq('review_id', reviewId)
    .eq('customer_id', customer.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('product_review_votes')
      .delete()
      .eq('review_id', reviewId)
      .eq('customer_id', customer.id)
    return NextResponse.json({ voted: false })
  }
  const { error } = await supabase
    .from('product_review_votes')
    .insert({ review_id: reviewId, customer_id: customer.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ voted: true })
}
