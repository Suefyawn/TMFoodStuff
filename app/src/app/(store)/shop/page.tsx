'use client'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { products } from '@/data/products'
import { categories } from '@/data/categories'

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCategory =
        !activeCategory ||
        p.categorySlug === activeCategory ||
        (activeCategory === 'organic' && p.isOrganic)
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch && p.isActive !== false
    })
  }, [activeCategory, search])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Shop Fresh</h1>
        <p className="text-gray-500">Farm fresh produce delivered to your door across UAE</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 transition-colors"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
            !activeCategory
              ? 'bg-green-600 text-white border-green-600'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          All ({products.length})
        </button>
        {categories.map(cat => {
          const count =
            cat.slug === 'organic'
              ? products.filter(p => p.isOrganic).length
              : products.filter(p => p.categorySlug === cat.slug).length
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                activeCategory === cat.slug
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {cat.emoji} {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-5 font-medium">
        {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-semibold text-gray-600">No products found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  )
}
