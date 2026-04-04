import { createClient } from '@supabase/supabase-js'
import ProductsManager from './ProductsManager'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, categories(name, slug)').order('name'),
    supabase.from('categories').select('*').order('id'),
  ])
  return { products: products || [], categories: categories || [] }
}

export default async function ProductsPage() {
  const { products, categories } = await getData()
  return <ProductsManager initialProducts={products} categories={categories} />
}
