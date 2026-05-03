import { createClient } from '@supabase/supabase-js'
import { products } from '../data/products'
import { categories } from '../data/categories'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('🌱 Seeding categories...')
  const catMap: Record<string, number> = {}

  for (const cat of categories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .maybeSingle()

    if (existing) {
      catMap[cat.slug] = existing.id
      console.log(`  ↩ Exists: ${cat.name}`)
      continue
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: cat.name, name_ar: cat.nameAr || '', slug: cat.slug, emoji: cat.emoji || '' })
      .select('id')
      .single()

    if (error) { console.error(`  ✗ ${cat.name}: ${error.message}`); continue }
    catMap[cat.slug] = data.id
    console.log(`  ✓ Created: ${cat.name}`)
  }

  console.log('\n🌱 Seeding products...')
  let created = 0
  let skipped = 0

  for (const product of products) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug)
      .maybeSingle()

    if (existing) { skipped++; continue }

    const categoryId = catMap[product.categorySlug]
    if (!categoryId) {
      console.log(`  ⚠ No category for ${product.name} (${product.categorySlug})`)
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
      stock: product.stock || 0,
      is_organic: product.isOrganic || false,
      is_featured: product.isFeatured || false,
      is_active: product.isActive !== false,
      origin: product.origin || '',
      emoji: product.emoji || '',
      image_url: (product as any).imageUrl || null,
    })

    if (error) { console.error(`  ✗ ${product.name}: ${error.message}`); continue }
    created++
    if (created % 20 === 0) console.log(`  ✓ ${created} products seeded...`)
  }

  console.log(`\n✅ Done! ${created} products created, ${skipped} skipped`)
}

seed().catch(e => { console.error(e); process.exit(1) })
