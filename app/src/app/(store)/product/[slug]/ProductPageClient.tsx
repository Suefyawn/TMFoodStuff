'use client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Product, Category } from '@/lib/products-api'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import { ProductImage } from '@/components/ProductImage'
import { formatAED } from '@/lib/utils'
import StickyProductCTA from '@/components/StickyProductCTA'
import { ProductNameDisplay } from '@/components/ProductNameDisplay'
import { useLang } from '@/lib/use-lang'

interface Props {
  product: Product
  category: Category | undefined
  related: Product[]
}

export default function ProductPageClient({ product, category, related }: Props) {
  const { lang, tr } = useLang()

  const categoryLabel =
    category && lang === 'ar' && category.nameAr ? category.nameAr : category?.name

  const productForCart = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceAED: product.priceAED,
    unit: product.unit,
    imageUrl: product.imageUrl,
    emoji: product.emoji,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 scroll-mt-20">
      <Link
        href="/shop"
        className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors mb-4 md:mb-6 group min-h-[44px]"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform rtl-flip" />
        {tr.backToShop}
      </Link>

      <nav aria-label={tr.breadcrumb} className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="focus-ring hover:text-green-600 transition-colors rounded">
          {tr.breadcrumbHome}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="focus-ring hover:text-green-600 transition-colors rounded">
          {tr.breadcrumbShop}
        </Link>
        <span aria-hidden="true">/</span>
        {category && (
          <>
            <Link
              href={`/shop?category=${category.slug}`}
              className="focus-ring hover:text-green-600 transition-colors capitalize rounded"
            >
              {categoryLabel}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-gray-800 font-medium">{lang === 'ar' && product.nameAr ? product.nameAr : product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10 mb-12 md:mb-16">
        <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative w-full">
          {product.imageUrl ? (
            <ProductImage
              src={product.imageUrl}
              alt={lang === 'ar' && product.nameAr ? product.nameAr : product.name}
              className="w-full h-full object-cover"
              emoji={product.emoji}
            />
          ) : (
            <span className="text-[80px] md:text-[120px]" aria-hidden="true">
              {product.emoji}
            </span>
          )}
          <div className="absolute top-3 start-3 md:top-4 md:start-4 flex flex-col gap-2">
            {product.isOrganic && (
              <span className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow">
                {tr.organicBadge}
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1.5 rounded-full shadow">
                {tr.featuredBadge}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-start md:justify-center">
          {category && (
            <Link
              href={`/shop?category=${category.slug}`}
              className="focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full mb-3 md:mb-4 w-fit hover:bg-green-100 transition-colors"
            >
              <span aria-hidden="true">{category.emoji}</span> {categoryLabel}
            </Link>
          )}

          <ProductNameDisplay name={product.name} nameAr={product.nameAr} />

          <p className="text-gray-600 leading-relaxed mb-5 md:mb-6 text-sm md:text-base">{product.description}</p>

          <div className="bg-gray-50 rounded-2xl p-4 md:p-5 mb-5 md:mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl md:text-4xl font-black text-green-700">{formatAED(product.priceAED)}</span>
              <span className="text-gray-500 text-sm">
                {tr.perUnit} {product.unit}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{tr.priceIncludesVat}</p>
          </div>

          <div className="flex items-center gap-2 mb-5 md:mb-6">
            <div
              className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`}
              aria-hidden="true"
            />
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {product.stock > 20
                ? tr.inStock
                : product.stock > 0
                  ? tr.onlyLeft.replace('{n}', String(product.stock))
                  : tr.outOfStock}
            </span>
          </div>

          <div className="hidden md:block">
            <AddToCartButton product={productForCart} size="lg" />
          </div>

          <div className="mt-5 md:mt-6 grid grid-cols-2 gap-2 md:gap-3 text-sm">
            {product.origin && (
              <div className="flex items-center gap-2 text-gray-500">
                <span aria-hidden="true">🌍</span>
                <span>
                  {tr.originLabel}{' '}
                  <span className="font-semibold text-gray-700">{product.origin}</span>
                </span>
              </div>
            )}
            {product.isOrganic && (
              <div className="flex items-center gap-2 text-gray-500">
                <span aria-hidden="true">🌱</span>
                <span className="font-semibold text-green-700">{tr.certifiedOrganic}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <span aria-hidden="true">📦</span>
              <span>
                {tr.soldPer}{' '}
                <span className="font-semibold text-gray-700">{product.unit}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span aria-hidden="true">🚚</span>
              <span className="font-semibold text-green-700">{tr.deliveryWindowProduct}</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-5 md:mb-6">
            {tr.moreInCategory.replace('{category}', categoryLabel || tr.breadcrumbShop)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {related.map(p => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </div>
      )}

      <StickyProductCTA product={productForCart} inStock={product.stock > 0} />
    </div>
  )
}
