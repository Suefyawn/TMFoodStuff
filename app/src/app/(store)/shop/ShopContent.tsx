'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, X, SlidersHorizontal, Apple, Leaf, Sprout, Sparkles, Droplets, Gift, Package } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product, Category } from '@/lib/products-api'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ReactElement } from 'react'
import { useLang } from '@/lib/use-lang'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'organic-first'

const categoryIconMap: Record<string, ReactElement> = {
  fruits: <Apple size={14} />,
  vegetables: <Leaf size={14} />,
  organic: <Sprout size={14} />,
  exotic: <Sparkles size={14} />,
  juices: <Droplets size={14} />,
  gifts: <Gift size={14} />,
}

interface ShopContentProps {
  defaultCategory?: string
  initialProducts: Product[]
  initialCategories: Category[]
}

export default function ShopContent({ defaultCategory, initialProducts, initialCategories }: ShopContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { lang, tr } = useLang()

  const products = initialProducts
  const categories = initialCategories

  const initialCategory = defaultCategory || searchParams.get('category') || ''
  const initialSearch = searchParams.get('q') || ''

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [search, setSearch] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  const sortOptions = [
    { value: 'featured' as SortOption, label: lang === 'ar' ? 'مميز' : 'Featured' },
    { value: 'price-asc' as SortOption, label: lang === 'ar' ? 'السعر: من الأقل' : 'Price: Low to High' },
    { value: 'price-desc' as SortOption, label: lang === 'ar' ? 'السعر: من الأعلى' : 'Price: High to Low' },
    { value: 'organic-first' as SortOption, label: lang === 'ar' ? 'العضوي أولاً' : 'Organic First' },
  ]

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('category') || defaultCategory || ''
    setSearch(q)
    setActiveCategory(cat)
  }, [searchParams, defaultCategory])

  function handleSearchChange(value: string) {
    setSearch(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('q', value)
    else params.delete('q')
    router.replace(`/shop?${params.toString()}`, { scroll: false })
  }

  function handleCategoryChange(slug: string) {
    setActiveCategory(slug)
    const params = new URLSearchParams()
    if (slug) params.set('category', slug)
    if (search) params.set('q', search)
    router.replace(`/shop${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const matchCategory =
        !activeCategory ||
        p.categorySlug === activeCategory ||
        (activeCategory === 'organic' && p.isOrganic)
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.nameAr && p.nameAr.includes(search))
      return matchCategory && matchSearch
    })

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.priceAED - b.priceAED)
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.priceAED - a.priceAED)
    } else if (sortBy === 'organic-first') {
      result = [...result].sort((a, b) => (b.isOrganic ? 1 : 0) - (a.isOrganic ? 1 : 0))
    } else {
      result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }

    return result
  }, [products, activeCategory, search, sortBy])

  const activeCategoryObj = categories.find(c => c.slug === activeCategory)

  const clearFilters = () => {
    setActiveCategory('')
    setSearch('')
    setSortBy('featured')
    router.replace('/shop', { scroll: false })
  }

  const hasActiveFilters = activeCategory || search || sortBy !== 'featured'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 py-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-1">{tr.shopTitle}</h1>
          <p className="text-gray-500">{tr.shopSubtitle}</p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-3 items-center py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={tr.search}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-full text-base md:text-sm focus:outline-none focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
              />
              {search && (
                <button onClick={() => handleSearchChange('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-full py-2.5 px-4 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('')}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 min-h-[44px] rounded-full border-2 text-sm font-semibold transition-all ${
                !activeCategory
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600 bg-white'
              }`}
            >
              {tr.allItems} ({products.length})
            </button>
            {categories.map(cat => {
              const count =
                cat.slug === 'organic'
                  ? products.filter(p => p.isOrganic).length
                  : products.filter(p => p.categorySlug === cat.slug).length
              const icon = categoryIconMap[cat.slug] ?? <Leaf size={14} />
              const catLabel = lang === 'ar' && cat.nameAr ? cat.nameAr : cat.name
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full border-2 text-sm font-semibold transition-all ${
                    activeCategory === cat.slug
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600 bg-white'
                  }`}
                >
                  {icon}
                  {catLabel} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
              <Package size={14} className="text-gray-400" />
              <span className="text-gray-900 font-black">{filtered.length}</span> {tr.productsFound}
            </p>
            {activeCategoryObj && (
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {categoryIconMap[activeCategoryObj.slug] ?? <Leaf size={12} />}
                {lang === 'ar' && activeCategoryObj.nameAr ? activeCategoryObj.nameAr : activeCategoryObj.name}
                <button onClick={() => handleCategoryChange('')} className="hover:text-green-600 ml-0.5"><X size={12} /></button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <Search size={11} /> &quot;{search}&quot;
                <button onClick={() => handleSearchChange('')} className="hover:text-blue-600 ml-0.5"><X size={12} /></button>
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
              <X size={12} /> {tr.clearAll}
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-all duration-300">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="font-black text-gray-700 text-xl mb-2">{lang === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}</p>
            <p className="text-sm text-gray-400 mb-6">{lang === 'ar' ? 'جرب بحثاً مختلفاً أو فئة أخرى' : 'Try a different search or category'}</p>
            <button onClick={clearFilters} className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors text-sm">
              {lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
