'use client'
import { useState, useMemo } from 'react'
import { Search, X, SlidersHorizontal, Apple, Leaf, Sprout, Sparkles, Droplets, Gift, Package } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { products } from '@/data/products'
import { categories } from '@/data/categories'
import type { ReactElement } from 'react'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'organic-first'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'organic-first', label: 'Organic First' },
]

const categoryIconMap: Record<string, ReactElement> = {
  fruits: <Apple size={14} />,
  vegetables: <Leaf size={14} />,
  organic: <Sprout size={14} />,
  exotic: <Sparkles size={14} />,
  juices: <Droplets size={14} />,
  gifts: <Gift size={14} />,
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const matchCategory =
        !activeCategory ||
        p.categorySlug === activeCategory ||
        (activeCategory === 'organic' && p.isOrganic)
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch && p.isActive !== false
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
  }, [activeCategory, search, sortBy])

  const activeCategoryObj = categories.find(c => c.slug === activeCategory)

  const clearFilters = () => {
    setActiveCategory('')
    setSearch('')
    setSortBy('featured')
  }

  const hasActiveFilters = activeCategory || search || sortBy !== 'featured'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-1">Shop Fresh</h1>
          <p className="text-gray-500">Farm fresh produce delivered to your door across UAE</p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search + Sort row */}
          <div className="flex gap-3 items-center py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-full py-2.5 px-4 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category filter pills — horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                !activeCategory
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600 bg-white'
              }`}
            >
              All ({products.filter(p => p.isActive !== false).length})
            </button>
            {categories.map(cat => {
              const count =
                cat.slug === 'organic'
                  ? products.filter(p => p.isOrganic && p.isActive !== false).length
                  : products.filter(p => p.categorySlug === cat.slug && p.isActive !== false).length
              const icon = categoryIconMap[cat.slug] ?? <Leaf size={14} />
              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                    activeCategory === cat.slug
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600 bg-white'
                  }`}
                >
                  {icon}
                  {cat.name} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Active filter pills + count */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
              <Package size={14} className="text-gray-400" />
              <span className="text-gray-900 font-black">{filtered.length}</span>{' '}
              product{filtered.length !== 1 ? 's' : ''} found
            </p>
            {/* Active filter chips */}
            {activeCategoryObj && (
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {categoryIconMap[activeCategoryObj.slug] ?? <Leaf size={12} />}
                {activeCategoryObj.name}
                <button onClick={() => setActiveCategory('')} className="hover:text-green-600 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <Search size={11} />
                &quot;{search}&quot;
                <button onClick={() => setSearch('')} className="hover:text-blue-600 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            {sortBy !== 'featured' && (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
                <SlidersHorizontal size={11} />
                {sortOptions.find(s => s.value === sortBy)?.label}
                <button onClick={() => setSortBy('featured')} className="hover:text-amber-600 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-all duration-300">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="font-black text-gray-700 text-xl mb-2">No products found</p>
            <p className="text-sm text-gray-400 mb-6">Try a different search or category</p>
            <button
              onClick={clearFilters}
              className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
