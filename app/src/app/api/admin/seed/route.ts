import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { products } from '@/data/products'
import { categories } from '@/data/categories'

const SEED_SECRET = process.env.SEED_SECRET || 'tmfood-seed-2024-secure'

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-seed-secret')
  if (authHeader !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const catMap: Record<string, string> = {}
    let catsCreated = 0, prodsCreated = 0, skipped = 0

    // Seed categories
    for (const cat of categories) {
      try {
        const existing = await payload.find({
          collection: 'categories',
          where: { slug: { equals: cat.slug } },
        })
        if (existing.docs.length > 0) {
          catMap[cat.slug] = existing.docs[0].id as string
          continue
        }
        const created = await payload.create({
          collection: 'categories',
          data: {
            name: cat.name,
            nameAr: cat.nameAr || cat.name,
            slug: cat.slug,
            emoji: cat.emoji || '',
            description: cat.description || '',
          },
        })
        catMap[cat.slug] = created.id as string
        catsCreated++
      } catch (e: any) {
        console.error(`Category error ${cat.name}:`, e.message)
      }
    }

    // Seed products
    for (const product of products) {
      try {
        const existing = await payload.find({
          collection: 'products',
          where: { slug: { equals: product.slug } },
        })
        if (existing.docs.length > 0) {
          skipped++
          continue
        }
        const categoryId = catMap[product.categorySlug]
        if (!categoryId) continue

        await payload.create({
          collection: 'products',
          data: {
            name: product.name,
            nameAr: product.nameAr || product.name,
            slug: product.slug,
            category: categoryId,
            description: product.description || '',
            priceAED: product.priceAED,
            unit: (product.unit as any) || 'kg',
            stock: product.stock || 100,
            isActive: product.isActive !== false,
            isFeatured: product.isFeatured || false,
            isOrganic: product.isOrganic || false,
            origin: product.origin || '',
            emoji: product.emoji || '',
          },
        })
        prodsCreated++
      } catch (e: any) {
        console.error(`Product error ${product.name}:`, e.message)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${catsCreated} categories, ${prodsCreated} products (${skipped} already existed)`,
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
