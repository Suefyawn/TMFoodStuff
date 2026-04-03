import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { categories } from '@/data/categories'
import { products } from '@/data/products'

const SEED_SECRET = process.env.SEED_SECRET || 'tmfood-seed-2024-secure'
const MONGODB_URI = process.env.MONGODB_URI!

export const maxDuration = 60

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-seed-secret')
  if (authHeader !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db()
    const catCol = db.collection('categories')
    const prodCol = db.collection('products')

    const catMap: Record<string, ObjectId> = {}
    let catsCreated = 0, prodsCreated = 0, skipped = 0

    // Seed categories
    for (const cat of categories) {
      const existing = await catCol.findOne({ slug: cat.slug })
      if (existing) {
        catMap[cat.slug] = existing._id
        continue
      }
      const now = new Date()
      const result = await catCol.insertOne({
        name: cat.name,
        nameAr: cat.nameAr || cat.name,
        slug: cat.slug,
        emoji: cat.emoji || '',
        description: cat.description || '',
        createdAt: now,
        updatedAt: now,
      })
      catMap[cat.slug] = result.insertedId
      catsCreated++
    }

    // Seed products in batch
    for (const product of products) {
      const existing = await prodCol.findOne({ slug: product.slug })
      if (existing) { skipped++; continue }

      const categoryId = catMap[product.categorySlug]
      if (!categoryId) continue

      const now = new Date()
      await prodCol.insertOne({
        name: product.name,
        nameAr: product.nameAr || product.name,
        slug: product.slug,
        category: categoryId,
        description: product.description || `Fresh ${product.name} delivered across UAE.`,
        priceAED: product.priceAED,
        unit: product.unit || 'kg',
        stock: product.stock || 100,
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        isOrganic: product.isOrganic || false,
        origin: product.origin || '',
        emoji: product.emoji || '',
        createdAt: now,
        updatedAt: now,
      })
      prodsCreated++
    }

    await client.close()

    return NextResponse.json({
      success: true,
      message: `✅ ${catsCreated} categories + ${prodsCreated} products seeded (${skipped} skipped)`,
    })
  } catch (error: any) {
    await client.close().catch(() => {})
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
