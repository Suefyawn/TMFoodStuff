import ProductsManager from './ProductsManager'
import { getDashboardSupabase } from '@/lib/dashboard-server-supabase'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = await getDashboardSupabase()
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
