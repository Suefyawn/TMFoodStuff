// Public reviews feed for a product. Used by the product detail page (no
// auth required to read approved reviews).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (!product) return NextResponse.json({ reviews: [], count: 0, average: 0 })

  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, rating, body, created_at, customers(full_name)')
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ reviews: [], count: 0, average: 0 })

  type Row = {
    id: number
    rating: number
    body: string | null
    created_at: string
    customers: { full_name: string | null } | null
  }
  const rows = ((data || []) as unknown as Row[])

  const count = rows.length
  const average = count === 0 ? 0 : rows.reduce((s, r) => s + r.rating, 0) / count

  return NextResponse.json({
    count,
    average: Math.round(average * 10) / 10,
    reviews: rows.map(r => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      created_at: r.created_at,
      // Show first name + last-initial only for privacy ("Ahmed M.")
      author: maskName(r.customers?.full_name || 'Customer'),
    })),
  })
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}
