import type { SupabaseClient } from '@supabase/supabase-js'
import { categories } from '@/data/categories'
import { products } from '@/data/products'

export type SeedCatalogResult = {
  categoriesCreated: number
  categoriesSkipped: number
  productsCreated: number
  productsSkipped: number
}

/**
 * Upsert static categories/products into Supabase (idempotent by slug).
 */
export async function seedCatalogToSupabase(supabase: SupabaseClient): Promise<SeedCatalogResult> {
  let categoriesCreated = 0
  let categoriesSkipped = 0
  const slugToCategoryId = new Map<string, number>()

  for (const cat of categories) {
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', cat.slug).maybeSingle()
    if (existing?.id != null) {
      slugToCategoryId.set(cat.slug, Number(existing.id))
      categoriesSkipped++
      continue
    }
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: cat.name,
        name_ar: cat.nameAr || cat.name,
        slug: cat.slug,
        emoji: cat.emoji || '',
        description: cat.description || '',
      })
      .select('id')
      .single()

    if (error) throw new Error(`Category ${cat.slug}: ${error.message}`)
    slugToCategoryId.set(cat.slug, Number(data.id))
    categoriesCreated++
  }

  let productsCreated = 0
  let productsSkipped = 0

  for (const product of products) {
    const { data: existing } = await supabase.from('products').select('id').eq('slug', product.slug).maybeSingle()
    if (existing?.id != null) {
      productsSkipped++
      continue
    }

    const categoryId = slugToCategoryId.get(product.categorySlug)
    if (!categoryId) {
      productsSkipped++
      continue
    }

    const { error } = await supabase.from('products').insert({
      name: product.name,
      name_ar: product.nameAr || '',
      slug: product.slug,
      category_id: categoryId,
      description: product.description || '',
      price_aed: product.priceAED,
      unit: product.unit || 'kg',
      stock: product.stock ?? 100,
      is_active: product.isActive !== false,
      is_featured: product.isFeatured || false,
      is_organic: product.isOrganic || false,
      origin: product.origin || '',
      emoji: product.emoji || '',
    })

    if (error) throw new Error(`Product ${product.slug}: ${error.message}`)
    productsCreated++
  }

  return { categoriesCreated, categoriesSkipped, productsCreated, productsSkipped }
}
