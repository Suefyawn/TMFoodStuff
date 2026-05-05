import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getProductBySlug, getProducts, getCategories, getAllProductSlugs } from '@/lib/products-api'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import { formatAED, calculateVAT } from '@/lib/utils'
import StickyProductCTA from '@/components/StickyProductCTA'
import { ProductNameDisplay } from '@/components/ProductNameDisplay'
import ProductImageGallery from '@/components/ProductImageGallery'
import StockNotifyForm from '@/components/StockNotifyForm'

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
  const vatAmount = calculateVAT(product.priceAED)
  const totalWithVAT = product.priceAED + vatAmount

  // Related products: same category, exclude current
  const allProducts = await getProducts()
  const related = allProducts
    .filter(p => p.categorySlug === product.categorySlug && p.slug !== product.slug)
    .slice(0, 5)

  const productForCart = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceAED: product.priceAED,
    unit: product.unit,
    imageUrl: product.imageUrl,
    emoji: product.emoji,
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrls[0] || undefined,
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'TM FoodStuff' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AED',
      price: product.priceAED.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://tmfoodstuff.ae/product/${product.slug}`,
      ...(product.compareAtPrice && product.compareAtPrice > product.priceAED ? {
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      } : {}),
    },
  }

  const discountPct = product.compareAtPrice && product.compareAtPrice > product.priceAED
    ? Math.round((1 - product.priceAED / product.compareAtPrice) * 100)
    : 0

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 scroll-mt-20">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors mb-4 md:mb-6 group min-h-[44px]"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform rtl-flip" />
        Back to Shop
      </Link>

      <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-green-600 transition-colors">Shop</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/shop?category=${category.slug}`} className="hover:text-green-600 transition-colors capitalize">{category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10 mb-12 md:mb-16">
        <div>
          <ProductImageGallery
            images={product.imageUrls}
            emoji={product.emoji}
            name={product.name}
            isOrganic={product.isOrganic}
            isFeatured={product.isFeatured}
          />
        </div>

        <div className="flex flex-col justify-start md:justify-center">
          {category && (
            <Link href={`/shop?category=${category.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full mb-3 md:mb-4 w-fit hover:bg-green-100 transition-colors">
              {category.emoji} {category.name}
            </Link>
          )}

          <ProductNameDisplay name={product.name} nameAr={product.nameAr} />

          <p className="text-gray-600 leading-relaxed mb-5 md:mb-6 text-sm md:text-base">{product.description}</p>

          <div className="bg-gray-50 rounded-2xl p-4 md:p-5 mb-5 md:mb-6">
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <span className="text-3xl md:text-4xl font-black text-green-700">{formatAED(product.priceAED)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.priceAED && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatAED(product.compareAtPrice)}</span>
                  <span className="bg-red-500 text-white text-sm font-black px-2.5 py-0.5 rounded-full">-{discountPct}%</span>
                </>
              )}
              <span className="text-gray-500 text-sm">per {product.unit}</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex justify-between"><span>Price excl. VAT</span><span>{formatAED(product.priceAED)}</span></div>
              <div className="flex justify-between"><span>VAT (5%)</span><span>{formatAED(vatAmount)}</span></div>
              <div className="flex justify-between font-bold text-gray-600 border-t pt-1 mt-1"><span>Total incl. VAT</span><span>{formatAED(totalWithVAT)}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5 md:mb-6">
            <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {product.stock > 20 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          <div className="hidden md:block">
            {product.stock > 0 ? (
              <AddToCartButton product={productForCart} size="lg" />
            ) : (
              <StockNotifyForm productId={product.id} productName={product.name} />
            )}
          </div>

          <div className="mt-5 md:mt-6 grid grid-cols-2 gap-2 md:gap-3 text-sm">
            {product.origin && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>🌍</span>
                <span>Origin: <span className="font-semibold text-gray-700">{product.origin}</span></span>
              </div>
            )}
            {product.isOrganic && (
              <div className="flex items-center gap-2 text-gray-500">
                <span>🌱</span>
                <span className="font-semibold text-green-700">Certified Organic</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <span>📦</span>
              <span>Sold per <span className="font-semibold text-gray-700">{product.unit}</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span>🚚</span>
              <span className="font-semibold text-green-700">Same day delivery</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-5 md:mb-6">More {category?.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <StickyProductCTA product={productForCart} inStock={product.stock > 0} />
    </div>
    </>
  )
}
