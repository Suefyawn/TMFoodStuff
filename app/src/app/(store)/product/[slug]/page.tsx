import { notFound } from 'next/navigation'
import { getProductBySlug, getProducts, getCategories, getAllProductSlugs } from '@/lib/products-api'
import ProductPageClient from './ProductPageClient'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map(slug => ({ slug }))
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const categories = await getCategories()
  const category = categories.find(c => c.slug === product.categorySlug)

  const allProducts = await getProducts()
  const related = allProducts
    .filter(p => p.categorySlug === product.categorySlug && p.slug !== product.slug)
    .slice(0, 5)

  return <ProductPageClient product={product} category={category} related={related} />
}
