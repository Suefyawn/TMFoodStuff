// Public reviews feed for a product. Used by the product detail page (no
// auth required to read approved reviews).
//
// Returns:
//   - reviews: list with title, body, images, verified flag, helpful count,
//             admin reply, masked author name
//   - count + average for the headline
//   - breakdown: { 5: n, 4: n, 3: n, 2: n, 1: n } for the rating histogram
//   - has_photos / verified_count for the filter chip counts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') // 'verified' | 'photos' | null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (!product) {
    return NextResponse.json({ reviews: [], count: 0, average: 0, breakdown: zeroBreakdown(), has_photos: 0, verified_count: 0 })
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, rating, title, body, images, verified_purchase, helpful_count, admin_reply, admin_reply_at, admin_reply_by, created_at, customers(full_name)')
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ reviews: [], count: 0, average: 0, breakdown: zeroBreakdown(), has_photos: 0, verified_count: 0 })

  type Row = {
    id: number
    rating: number
    title: string | null
    body: string | null
    images: Array<{ url: string; alt?: string }> | null
    verified_purchase: boolean
    helpful_count: number
    admin_reply: string | null
    admin_reply_at: string | null
    admin_reply_by: string | null
    created_at: string
    customers: { full_name: string | null } | Array<{ full_name: string | null }> | null
  }
  const rows = ((data || []) as unknown as Row[])

  // Headline stats are computed across ALL approved reviews — the filter
  // only affects the returned list, not the aggregate.
  const count = rows.length
  const average = count === 0 ? 0 : rows.reduce((s, r) => s + r.rating, 0) / count
  const breakdown = zeroBreakdown()
  for (const r of rows) {
    const k = String(Math.min(5, Math.max(1, r.rating))) as keyof typeof breakdown
    breakdown[k]++
  }
  const verified_count = rows.filter(r => r.verified_purchase).length
  const has_photos = rows.filter(r => Array.isArray(r.images) && r.images.length > 0).length

  let filtered = rows
  if (filter === 'verified') filtered = rows.filter(r => r.verified_purchase)
  else if (filter === 'photos') filtered = rows.filter(r => Array.isArray(r.images) && r.images.length > 0)

  return NextResponse.json({
    count,
    average: Math.round(average * 10) / 10,
    breakdown,
    verified_count,
    has_photos,
    reviews: filtered.slice(0, 50).map(r => {
      const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers
      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        images: Array.isArray(r.images) ? r.images : [],
        verified_purchase: r.verified_purchase,
        helpful_count: r.helpful_count,
        admin_reply: r.admin_reply,
        admin_reply_at: r.admin_reply_at,
        admin_reply_by: r.admin_reply_by,
        created_at: r.created_at,
        author: maskName(cust?.full_name || 'Customer'),
      }
    }),
  })
}

function zeroBreakdown() {
  return { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}
