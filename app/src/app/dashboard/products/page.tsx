import { MongoClient } from 'mongodb'
import Link from 'next/link'
import ProductsManager from './ProductsManager'

async function getProducts() {
  const client = new MongoClient(process.env.MONGODB_URI!)
  try {
    await client.connect()
    const db = client.db()
    const products = await db.collection('products').find({}).sort({ name: 1 }).toArray()
    await client.close()
    return JSON.parse(JSON.stringify(products))
  } catch {
    await client.close().catch(() => {})
    return []
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-white font-black">Products</h1>
        </div>
        <span className="text-gray-500 text-sm">{products.length} products</span>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {products.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <p className="text-gray-500 text-lg mb-4">No products in database yet</p>
            <p className="text-gray-600 text-sm">Products from the storefront&apos;s hardcoded catalog are displayed on the site. Use the seed endpoint to import them here.</p>
          </div>
        ) : (
          <ProductsManager initialProducts={products} />
        )}
      </main>
    </div>
  )
}
