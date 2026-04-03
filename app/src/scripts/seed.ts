import { getPayload } from 'payload'
import config from '@payload-config'
import { products } from '../data/products'
import { categories } from '../data/categories'

async function seed() {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding categories...')
  const catMap: Record<string, string> = {}

  for (const cat of categories) {
    try {
      const existing = await payload.find({ collection: 'categories', where: { slug: { equals: cat.slug } } })
      if (existing.docs.length > 0) {
        catMap[cat.slug] = existing.docs[0].id as string
        console.log(`  ↩ Category exists: ${cat.name}`)
        continue
      }
      const created = await payload.create({
        collection: 'categories',
        data: {
          name: cat.name,
          nameAr: cat.nameAr,
          slug: cat.slug,
          emoji: cat.emoji || '',
        },
      })
      catMap[cat.slug] = created.id as string
      console.log(`  ✓ Created category: ${cat.name}`)
    } catch (e: any) {
      console.error(`  ✗ Category error ${cat.name}: ${e.message}`)
    }
  }

  console.log('\n🌱 Seeding products...')
  let created = 0, skipped = 0

  for (const product of products) {
    try {
      const existing = await payload.find({ collection: 'products', where: { slug: { equals: product.slug } } })
      if (existing.docs.length > 0) { skipped++; continue }

      const categoryId = catMap[product.categorySlug]
      if (!categoryId) {
        console.log(`  ⚠ No category for ${product.name} (${product.categorySlug})`)
        continue
      }

      await payload.create({
        collection: 'products',
        data: {
          name: product.name,
          nameAr: product.nameAr,
          slug: product.slug,
          category: categoryId,
          description: product.description || '',
          priceAED: product.priceAED,
          unit: product.unit as any,
          stock: product.stock || 0,
          isOrganic: product.isOrganic || false,
          isFeatured: product.isFeatured || false,
          origin: product.origin || '',
          emoji: product.emoji || '',
          isActive: product.isActive !== false,
        },
      })
      created++
      if (created % 10 === 0) console.log(`  ✓ ${created} products seeded...`)
    } catch (e: any) {
      console.error(`  ✗ Product error ${product.name}: ${e.message}`)
    }
  }

  console.log(`\n✅ Done! ${created} products created, ${skipped} skipped`)
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
