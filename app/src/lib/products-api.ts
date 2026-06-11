import { createClient } from '@supabase/supabase-js'

// Public storefront browsing uses the anon (publishable) key so the existing
// "public read active products" / "public read categories" RLS policies
// govern what's visible. Bypassing RLS with the service role here (the
// previous behaviour) would expose inactive products and any future
// row-level restrictions to anonymous visitors.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export interface Product {
  id: string
  name: string
  nameAr: string
  slug: string
  categorySlug: string
  description: string
  descriptionAr: string
  priceAED: number
  compareAtPrice?: number
  unit: string
  stock: number
  isOrganic: boolean
  isFeatured: boolean
  origin: string
  emoji: string
  imageUrl?: string
  imageUrls: string[]
  isActive: boolean
  // Bundle composition — null/empty means this is a regular product.
  // Each entry is denormalised so the storefront can render the contents
  // without joining against the component product rows.
  bundleItems?: Array<{ product_id: number; quantity: number; name: string; emoji?: string }>
}

export interface Category {
  id: number
  name: string
  nameAr: string
  slug: string
  emoji: string
  description: string
  parentId: number | null
  parentSlug: string | null
  displayOrder: number
}

// Transform Supabase snake_case row to camelCase Product
function mapProduct(row: any): Product {
  return {
    id: String(row.id),
    name: row.name,
    nameAr: row.name_ar || '',
    slug: row.slug,
    categorySlug: row.categories?.slug || row.category_slug || '',
    description: row.description || '',
    descriptionAr: row.description_ar || '',
    priceAED: Number(row.price_aed),
    compareAtPrice: row.compare_at_price_aed ? Number(row.compare_at_price_aed) : undefined,
    unit: row.unit || 'kg',
    stock: row.stock ?? 0,
    isOrganic: row.is_organic ?? false,
    isFeatured: row.is_featured ?? false,
    origin: row.origin || '',
    emoji: row.emoji || '',
    imageUrl: row.image_url || undefined,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls.filter(Boolean) : (row.image_url ? [row.image_url] : []),
    isActive: row.is_active ?? true,
    bundleItems: Array.isArray(row.bundle_items) && row.bundle_items.length > 0 ? row.bundle_items : undefined,
  }
}

// Normalises legacy static-data rows (data/products.ts) to the Product shape.
// The static fallback is missing `imageUrls`, so callers that read it (e.g.
// the product page JSON-LD) would crash without this.
function fromStaticData(p: any): Product {
  return {
    ...p,
    nameAr: p.nameAr || '',
    descriptionAr: p.descriptionAr || '',
    imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : p.imageUrl ? [p.imageUrl] : [],
    isActive: p.isActive ?? true,
  }
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar || '',
    slug: row.slug,
    emoji: row.emoji || '',
    description: row.description || '',
    parentId: row.parent_id ?? null,
    parentSlug: row.parent?.slug ?? null,
    displayOrder: row.display_order ?? 0,
  }
}

// Fetch all active products
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug)')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Failed to fetch products:', error.message)
    // Fallback to static data
    const { products } = await import('@/data/products')
    return products.filter(p => p.isActive !== false).map(fromStaticData)
  }

  return (data || []).map(mapProduct)
}

// Fetch featured products
export async function getFeaturedProducts(limit = 10): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('name')
    .limit(limit)

  if (error) {
    console.error('Failed to fetch featured products:', error.message)
    const { products } = await import('@/data/products')
    return products.filter(p => p.isFeatured).slice(0, limit).map(fromStaticData)
  }

  return (data || []).map(mapProduct)
}

// Fetch the in-season mango lineup for the home page "Mango Season" feature.
// `ilike 'mango %'` matches "Mango Tomy/Taimoor/Pakistani/Alphonso/Stick…" while
// cleanly excluding "Mangosteen" (no space) and "Raw Mango" (a cooking veg).
// Ordered cheapest-first so the showcase opens with an accessible price point.
export async function getMangoProducts(limit = 5): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug)')
    .eq('is_active', true)
    .ilike('name', 'mango %')
    .order('price_aed')
    .limit(limit)

  if (error) {
    console.error('Failed to fetch mango products:', error.message)
    const { products } = await import('@/data/products')
    return products
      .filter(p => /^mango\s/i.test(p.name) && p.isActive !== false)
      .sort((a, b) => a.priceAED - b.priceAED)
      .slice(0, limit)
      .map(fromStaticData)
  }

  return (data || []).map(mapProduct)
}

// Fetch single product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug)')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Failed to fetch product:', error?.message)
    // Fallback to static data
    const { products } = await import('@/data/products')
    const p = products.find(p => p.slug === slug)
    return p ? fromStaticData(p) : null
  }

  return mapProduct(data)
}

// Fetch products by category
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!cat) return []

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug)')
    .eq('category_id', cat.id)
    .eq('is_active', true)
    .order('name')

  if (error) return []
  return (data || []).map(mapProduct)
}

// Fetch all categories (including the parent slug so the shop UI can build a
// two-level nav without an extra round trip).
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*, parent:parent_id(slug)')
    .eq('is_active', true)
    .order('parent_id', { nullsFirst: true })
    .order('display_order')

  if (error) {
    console.error('Failed to fetch categories:', error.message)
    return []
  }

  return (data || []).map(mapCategory)
}

// Fetch all product slugs (for static generation)
export async function getAllProductSlugs(): Promise<string[]> {
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)

  if (!data) {
    const { products } = await import('@/data/products')
    return products.map(p => p.slug)
  }

  return data.map((r: any) => r.slug)
}
