import { Suspense } from 'react'
import ShopContent from './ShopContent'
import ShopLoading from './loading'
import { getProducts, getCategories } from '@/lib/products-api'

export const revalidate = 60

export const metadata = {
  title: 'Shop Fresh Produce',
}

export default async function ShopPage() {
  const [allProducts, allCategories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopContent initialProducts={allProducts} initialCategories={allCategories} />
    </Suspense>
  )
}
