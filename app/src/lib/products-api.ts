import { supabase } from './supabase'

export interface Product {
  id: string
  name: string
  nameAr: string
  slug: string
  categorySlug: string
  description: string
  priceAED: number
  unit: string
  stock: number
  isOrganic: boolean
  isFeatured: boolean
  origin: string
  emoji: string
  imageUrl?: string
  isActive: boolean
}

export interface Category {
  id: number
  name: string
  nameAr: string
  slug: string
  emoji: string
  description: string
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
    priceAED: Number(row.price_aed),
    unit: row.unit || 'kg',
    stock: row.stock ?? 0,
    isOrganic: row.is_organic ?? false,
    isFeatured: row.is_featured ?? false,
    origin: row.origin || '',
    emoji: row.emoji || '',
    imageUrl: row.image_url || undefined,
    isActive: row.is_active ?? true,
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
    return products.filter(p => p.isActive !== false) as Product[]
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
    return products.filter(p => p.isFeatured).slice(0, limit) as Product[]
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
    return p ? (p as Product) : null
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

// Fetch all categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id')

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
