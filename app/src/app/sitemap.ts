import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://tmfoodstuff.ae'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('categories').select('slug'),
    ])

    const productPages: MetadataRoute.Sitemap = (products || []).map(p => ({
      url: `${BASE}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const categoryPages: MetadataRoute.Sitemap = (categories || []).map(c => ({
      url: `${BASE}/shop?category=${c.slug}`,
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    return [
      { url: BASE, changeFrequency: 'daily', priority: 1.0 },
      { url: `${BASE}/shop`, changeFrequency: 'daily', priority: 0.9 },
      { url: `${BASE}/track`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.5 },
      ...categoryPages,
      ...productPages,
    ]
  } catch {
    return [
      { url: BASE, changeFrequency: 'daily', priority: 1.0 },
      { url: `${BASE}/shop`, changeFrequency: 'daily', priority: 0.9 },
    ]
  }
}
