import { createClient } from '@supabase/supabase-js'
import SubNav, { CATALOG_SUBNAV } from '@/components/dashboard/SubNav'
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
  // SubNav sits inside the catalog hub above ProductsManager. The manager
  // owns its own padding/spacing so we wrap the whole thing in a single
  // padding shell that the sub-nav can negative-margin out of.
  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6">
      <SubNav items={CATALOG_SUBNAV} />
      <div className="-mx-4 sm:-mx-6 -mt-5">
        <ProductsManager initialProducts={products} categories={categories} />
      </div>
    </div>
  )
}
