import { notFound } from 'next/navigation'
import Link from 'next/link'
import { products } from '@/data/products'
import { categories } from '@/data/categories'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import { formatAED, calculateVAT } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return products.map(p => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = products.find(p => p.slug === slug)
  if (!product) notFound()

  const category = categories.find(c => c.slug === product.categorySlug)
  const vatAmount = calculateVAT(product.priceAED)
  const totalWithVAT = product.priceAED + vatAmount

  // Related products: same category, exclude current
  const related = products
    .filter(p => p.categorySlug === product.categorySlug && p.slug !== product.slug)
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-green-600 transition-colors">Shop</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/shop/${category.slug}`} className="hover:text-green-600 transition-colors capitalize">{category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium">{product.name}</span>
      </nav>

      {/* Product main section */}
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Image */}
        <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[120px]">{product.emoji}</span>
          )}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isOrganic && (
              <span className="bg-green-500 text-white text-sm font-black px-3 py-1.5 rounded-full shadow">🌱 Organic</span>
            )}
            {product.isFeatured && (
              <span className="bg-yellow-400 text-yellow-900 text-sm font-black px-3 py-1.5 rounded-full shadow">⭐ Featured</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          {/* Category badge */}
          {category && (
            <Link href={`/shop/${category.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full mb-4 w-fit hover:bg-green-100 transition-colors">
              {category.emoji} {category.name}
            </Link>
          )}

          <h1 className="text-4xl font-black text-gray-900 mb-1">{product.name}</h1>
          {product.nameAr && (
            <p className="text-lg text-gray-500 mb-4 font-medium" dir="rtl">{product.nameAr}</p>
          )}

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Price */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-black text-green-700">{formatAED(product.priceAED)}</span>
              <span className="text-gray-500 text-sm">per {product.unit}</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Price excl. VAT</span>
                <span>{formatAED(product.priceAED)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (5%)</span>
                <span>{formatAED(vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-600 border-t pt-1 mt-1">
                <span>Total incl. VAT</span>
                <span>{formatAED(totalWithVAT)}</span>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {product.stock > 20 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          {/* Add to cart */}
          <AddToCartButton product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            priceAED: product.priceAED,
            unit: product.unit,
            imageUrl: product.imageUrl,
          }} />

          {/* Meta info */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
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

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-6">More {category?.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {related.map(p => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
