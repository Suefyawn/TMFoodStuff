import HomeContent from './HomeContent'
import { getFeaturedProducts } from '@/lib/products-api'

export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  const featured = await getFeaturedProducts(10)
  return <HomeContent featuredProducts={featured} />
}
