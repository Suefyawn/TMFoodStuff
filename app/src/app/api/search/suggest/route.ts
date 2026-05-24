// Lightweight typeahead for the navbar search.
//
// Returns up to 6 active products matching the query in name (EN or AR) or
// description, plus up to 2 category hits. Uses the publishable key so RLS
// (public-read-active) governs visibility. Cached at the edge for 30s
// because the catalogue changes infrequently relative to keystrokes.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface ProductHit {
  type: 'product'
  slug: string
  name: string
  name_ar: string | null
  price_aed: number
  compare_at_price_aed: number | null
  emoji: string | null
  image_url: string | null
  stock: number
  unit: string | null
}

interface CategoryHit {
  type: 'category'
  slug: string
  name: string
  name_ar: string | null
  emoji: string | null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const raw = (url.searchParams.get('q') || '').trim()
  if (raw.length < 2) {
    return NextResponse.json({ products: [], categories: [] })
  }
  // Escape PostgREST `or` operators that would otherwise break the filter.
  const safe = raw.replace(/[%(),]/g, ' ').slice(0, 60)
  const like = `%${safe}%`

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('slug, name, name_ar, price_aed, compare_at_price_aed, emoji, image_url, stock, unit')
      .eq('is_active', true)
      .or(`name.ilike.${like},name_ar.ilike.${like},description.ilike.${like}`)
      .order('is_featured', { ascending: false })
      .order('stock', { ascending: false })
      .limit(6),
    supabase
      .from('categories')
      .select('slug, name, name_ar, emoji')
      .eq('is_active', true)
      .or(`name.ilike.${like},name_ar.ilike.${like}`)
      .limit(2),
  ])

  const products: ProductHit[] = (productsRes.data || []).map((p: any) => ({
    type: 'product',
    slug: p.slug,
    name: p.name,
    name_ar: p.name_ar,
    price_aed: Number(p.price_aed),
    compare_at_price_aed: p.compare_at_price_aed ? Number(p.compare_at_price_aed) : null,
    emoji: p.emoji,
    image_url: p.image_url,
    stock: p.stock ?? 0,
    unit: p.unit,
  }))
  const categories: CategoryHit[] = (categoriesRes.data || []).map((c: any) => ({
    type: 'category',
    slug: c.slug,
    name: c.name,
    name_ar: c.name_ar,
    emoji: c.emoji,
  }))

  // Fire-and-forget log so /dashboard/search-analytics can surface the
  // top no-results queries — a signal for which products to source next.
  // We only log when the query is ≥3 chars to avoid logging every key-by-
  // key typeahead step (the first 1-2 chars on the way to a real query).
  if (safe.length >= 3) {
    const logger = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    void logger
      .from('search_logs')
      .insert({
        query: safe.toLowerCase(),
        query_length: safe.length,
        product_hits: products.length,
        category_hits: categories.length,
      })
      .then(() => undefined, err => console.error('[search] log insert failed:', err))
  }

  return NextResponse.json(
    { products, categories },
    { headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=30' } },
  )
}
