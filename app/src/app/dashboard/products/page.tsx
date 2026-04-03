import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import ProductsManager from './ProductsManager'

export const dynamic = 'force-dynamic'

async function getProducts() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('products').select('*, categories(name, slug)').order('name')
  return data || []
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
        <ProductsManager initialProducts={products} />
      </main>
    </div>
  )
}
