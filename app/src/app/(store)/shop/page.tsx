import { Suspense } from 'react'
import type { Metadata } from 'next'
import ShopContent from './ShopContent'
import ShopLoading from './loading'
import { getProducts, getCategories } from '@/lib/products-api'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Shop Fresh Produce',
  description:
    'Browse fresh fruits, vegetables, herbs, and organic produce delivered same-day across the UAE. Premium quality, transparent prices in AED, free delivery available.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop Fresh Produce | TMFoodStuff',
    description: 'Fresh fruits, vegetables, and organic produce delivered same-day across the UAE.',
    url: '/shop',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Fresh Produce | TMFoodStuff',
    description: 'Fresh fruits, vegetables, and organic produce delivered same-day across the UAE.',
  },
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
