'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, X, SlidersHorizontal, Apple, Leaf, Package, Sprout, PackageCheck } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product, Category } from '@/lib/products-api'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ReactElement } from 'react'
import { useLang } from '@/lib/use-lang'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name'

// Top-level category icons. Sub-categories fall back to the category's own
// emoji which is set on the row in the DB.
const topLevelIcon: Record<string, ReactElement> = {
  fruits: <Apple size={14} aria-hidden="true" />,
  vegetables: <Leaf size={14} aria-hidden="true" />,
  gifts: <Package size={14} aria-hidden="true" />,
}

interface ShopContentProps {
  defaultCategory?: string
  initialProducts: Product[]
  initialCategories: Category[]
}

// Backwards-compat: customers with bookmarks for the old /shop?category=organic
// or /shop?category=exotic URLs land somewhere sensible.
const LEGACY_CATEGORY_REDIRECTS: Record<string, { type: 'flag' | 'sub'; value: string }> = {
  organic: { type: 'flag', value: 'organic' },
  exotic: { type: 'sub', value: 'fruits-tropical' },
  juices: { type: 'sub', value: 'gifts' },
}

export default function ShopContent({ defaultCategory, initialProducts, initialCategories }: ShopContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { lang, tr } = useLang()
  const isAr = lang === 'ar'

  const products = initialProducts
  const categories = initialCategories

  // Resolve incoming ?category. Legacy slugs ('organic', 'exotic', 'juices')
  // map to either a filter flag or a real sub-category.
  const rawCategory = defaultCategory || searchParams.get('category') || ''
  const legacy = LEGACY_CATEGORY_REDIRECTS[rawCategory]
  const initialOrganicFlag = legacy?.type === 'flag' && legacy.value === 'organic'
  const initialCategory = legacy?.type === 'sub' ? legacy.value : (legacy ? '' : rawCategory)

  const initialSearch = searchParams.get('q') || ''

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [search, setSearch] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [organicOnly, setOrganicOnly] = useState(initialOrganicFlag)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState<number>(0) // 0 = no cap

  const sortOptions = [
    { value: 'featured' as SortOption, label: isAr ? 'مميز' : 'Featured' },
    { value: 'price-asc' as SortOption, label: isAr ? 'السعر: من الأقل' : 'Price: Low to High' },
    { value: 'price-desc' as SortOption, label: isAr ? 'السعر: من الأعلى' : 'Price: High to Low' },
    { value: 'name' as SortOption, label: isAr ? 'الاسم' : 'Name (A-Z)' },
  ]

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('category') || defaultCategory || ''
    setSearch(q)
    const lg = LEGACY_CATEGORY_REDIRECTS[cat]
    if (lg?.type === 'flag') {
      setOrganicOnly(true)
      setActiveCategory('')
    } else if (lg?.type === 'sub') {
      setActiveCategory(lg.value)
    } else {
      setActiveCategory(cat)
    }
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

  // Build category lookup maps.
  const topLevels = useMemo(
    () => categories.filter(c => c.parentId === null).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories],
  )
  const subsByParentSlug = useMemo(() => {
    const map = new Map<string, Category[]>()
    for (const c of categories) {
      if (!c.parentSlug) continue
      const arr = map.get(c.parentSlug) ?? []
      arr.push(c)
      map.set(c.parentSlug, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.displayOrder - b.displayOrder)
    return map
  }, [categories])
  // For each category slug, what's its top-level slug? (Used so selecting a
  // top-level pill highlights all its sub-cat children for matching.)
  const parentOfSlug = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) {
      if (c.parentSlug) map.set(c.slug, c.parentSlug)
      else map.set(c.slug, c.slug)
    }
    return map
  }, [categories])

  // Active top-level — either the active category itself (if it's top-level)
  // or its parent (if it's a sub-cat). Drives which sub-pill row appears.
  const activeTopLevel = activeCategory ? parentOfSlug.get(activeCategory) ?? activeCategory : ''
  const activeSubs = activeTopLevel ? subsByParentSlug.get(activeTopLevel) ?? [] : []

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      // Category match — top-level pill matches any of its sub-cats; sub-cat
      // pill matches its exact slug only.
      const matchCategory =
        !activeCategory ||
        p.categorySlug === activeCategory ||
        parentOfSlug.get(p.categorySlug) === activeCategory
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.nameAr && p.nameAr.includes(search))
      const matchOrganic = !organicOnly || p.isOrganic
      const matchStock = !inStockOnly || p.stock > 0
      const matchPrice = !maxPrice || p.priceAED <= maxPrice
      return matchCategory && matchSearch && matchOrganic && matchStock && matchPrice
    })

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.priceAED - b.priceAED)
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.priceAED - a.priceAED)
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else {
      result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }

    return result
  }, [products, activeCategory, parentOfSlug, search, sortBy, organicOnly, inStockOnly, maxPrice])

  const activeCategoryObj = categories.find(c => c.slug === activeCategory)

  const clearFilters = () => {
    setActiveCategory('')
    setSearch('')
    setSortBy('featured')
    setOrganicOnly(false)
    setInStockOnly(false)
    setMaxPrice(0)
    router.replace('/shop', { scroll: false })
  }

  const hasActiveFilters =
    activeCategory || search || sortBy !== 'featured' || organicOnly || inStockOnly || maxPrice

  // Pre-compute counts so the chip labels reflect the *other* filters too.
  function countForCategory(slug: string): number {
    return products.filter(p => {
      const inCat = slug ? (p.categorySlug === slug || parentOfSlug.get(p.categorySlug) === slug) : true
      const inStock = !inStockOnly || p.stock > 0
      const isOrg = !organicOnly || p.isOrganic
      const inPrice = !maxPrice || p.priceAED <= maxPrice
      return inCat && inStock && isOrg && inPrice
    }).length
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
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
          {/* Search + sort row */}
          <div className="flex gap-3 items-center py-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-gray-400`} size={16} aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={tr.search}
                aria-label={tr.search}
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border-2 border-gray-200 rounded-full text-base md:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white`}
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                  className={`absolute ${isAr ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <button
              onClick={() => setOrganicOnly(v => !v)}
              aria-pressed={organicOnly}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border-2 transition-colors min-h-[40px] ${
                organicOnly ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              <Sprout size={14} aria-hidden="true" />
              {isAr ? 'عضوي فقط' : 'Organic'}
            </button>
            <button
              onClick={() => setInStockOnly(v => !v)}
              aria-pressed={inStockOnly}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border-2 transition-colors min-h-[40px] ${
                inStockOnly ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              <PackageCheck size={14} aria-hidden="true" />
              {isAr ? 'متوفر فقط' : 'In stock'}
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-gray-200 text-sm min-h-[40px]">
              <span className="text-xs text-gray-500 font-semibold">{isAr ? 'حتى' : 'Max'}</span>
              <input
                type="number"
                inputMode="numeric"
                value={maxPrice || ''}
                onChange={e => setMaxPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="—"
                aria-label={isAr ? 'الحد الأقصى للسعر' : 'Max price'}
                className="w-14 bg-transparent text-sm font-bold text-gray-800 focus:outline-none text-center"
                min={0}
              />
              <span className="text-xs text-gray-500 font-semibold">AED</span>
              {!!maxPrice && (
                <button
                  onClick={() => setMaxPrice(0)}
                  aria-label={isAr ? 'مسح' : 'Clear'}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <SlidersHorizontal size={16} className="text-gray-400 hidden sm:block" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label={isAr ? 'ترتيب حسب' : 'Sort by'}
                className="text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-full py-2 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-colors cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Top-level category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('')}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 min-h-[40px] rounded-full border-2 text-sm font-semibold transition-all ${
                !activeCategory
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600 bg-white'
              }`}
            >
              {tr.allItems} ({countForCategory('')})
            </button>
            {topLevels.map(cat => {
              const icon = topLevelIcon[cat.slug] ?? <Leaf size={14} aria-hidden="true" />
              const catLabel = isAr && cat.nameAr ? cat.nameAr : cat.name
              const isActive = activeTopLevel === cat.slug
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] rounded-full border-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600 bg-white'
                  }`}
                >
                  {icon}
                  {catLabel} ({countForCategory(cat.slug)})
                </button>
              )
            })}
          </div>

          {/* Sub-category pills (only visible when a top-level is active) */}
          {activeSubs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
              {activeSubs.map(sub => {
                const subLabel = isAr && sub.nameAr ? sub.nameAr : sub.name
                const isActive = activeCategory === sub.slug
                return (
                  <button
                    key={sub.slug}
                    onClick={() => handleCategoryChange(sub.slug)}
                    className={`flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <span aria-hidden="true">{sub.emoji}</span>
                    {subLabel} ({countForCategory(sub.slug)})
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
              <Package size={14} className="text-gray-400" aria-hidden="true" />
              <span className="text-gray-900 font-black">{filtered.length}</span> {tr.productsFound}
            </p>
            {activeCategoryObj && (
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <span aria-hidden="true">{activeCategoryObj.emoji}</span>
                {isAr && activeCategoryObj.nameAr ? activeCategoryObj.nameAr : activeCategoryObj.name}
                <button onClick={() => handleCategoryChange('')} aria-label={isAr ? 'إزالة' : 'Remove'} className="hover:text-green-600 ml-0.5">
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            )}
            {organicOnly && (
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <Sprout size={11} aria-hidden="true" /> {isAr ? 'عضوي' : 'Organic'}
                <button onClick={() => setOrganicOnly(false)} aria-label={isAr ? 'إزالة' : 'Remove'} className="hover:text-green-600 ml-0.5">
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <PackageCheck size={11} aria-hidden="true" /> {isAr ? 'متوفر' : 'In stock'}
                <button onClick={() => setInStockOnly(false)} aria-label={isAr ? 'إزالة' : 'Remove'} className="hover:text-green-600 ml-0.5">
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <Search size={11} aria-hidden="true" /> &quot;{search}&quot;
                <button onClick={() => handleSearchChange('')} aria-label={isAr ? 'إزالة' : 'Remove'} className="hover:text-blue-600 ml-0.5">
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
              <X size={12} aria-hidden="true" /> {tr.clearAll}
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
              <Search size={32} className="text-gray-300" aria-hidden="true" />
            </div>
            <p className="font-black text-gray-700 text-xl mb-2">{isAr ? 'لم يتم العثور على منتجات' : 'No products found'}</p>
            <p className="text-sm text-gray-400 mb-6">{isAr ? 'جرب بحثاً مختلفاً أو فئة أخرى' : 'Try a different search or category'}</p>
            <button onClick={clearFilters} className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors text-sm">
              {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
