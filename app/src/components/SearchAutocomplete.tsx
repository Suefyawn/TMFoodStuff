'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, ArrowRight } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface Suggestion {
  products: Array<{
    type: 'product'
    slug: string
    name: string
    name_ar: string | null
    price_aed: number
    compare_at_price_aed: number | null
    emoji: string | null
    image_url: string | null
    stock: number
    unit: string | null
  }>
  categories: Array<{
    type: 'category'
    slug: string
    name: string
    name_ar: string | null
    emoji: string | null
  }>
}

interface Props {
  className?: string
  inputClassName?: string
  placeholder?: string
  onNavigate?: () => void
}

// Debounced typeahead. 200ms after the last keystroke we hit
// /api/search/suggest and render a dropdown of up to 6 products + 2
// categories. Keyboard arrow nav cycles the rows; Enter on a row navigates,
// Enter with no selection runs a full /shop?q= search.
export default function SearchAutocomplete({
  className = '',
  inputClassName = '',
  placeholder,
  onNavigate,
}: Props) {
  const router = useRouter()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const ph = placeholder ?? (isAr ? 'ابحث عن منتج…' : 'Search produce…')
  const [q, setQ] = useState('')
  const [data, setData] = useState<Suggestion>({ products: [], categories: [] })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqIdRef = useRef(0)

  // Click-outside to close.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Debounced fetch. reqIdRef guards against out-of-order responses.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setData({ products: [], categories: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const myId = ++reqIdRef.current
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`)
        const json = await res.json()
        if (myId === reqIdRef.current) {
          setData({ products: json.products || [], categories: json.categories || [] })
          setActive(-1)
        }
      } catch {
        // Network error — leave previous suggestions, no toast (background helper).
      } finally {
        if (myId === reqIdRef.current) setLoading(false)
      }
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  const flat = [
    ...data.products.map(p => ({ ...p, _href: `/product/${p.slug}` })),
    ...data.categories.map(c => ({ ...c, _href: `/shop?category=${c.slug}` })),
  ]

  const submitFullSearch = useCallback(() => {
    const trimmed = q.trim()
    if (!trimmed) return
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`)
    setQ('')
    setOpen(false)
    onNavigate?.()
  }, [q, router, onNavigate])

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (flat.length === 0) return
      setOpen(true)
      setActive(prev => (prev + 1) % flat.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (flat.length === 0) return
      setOpen(true)
      setActive(prev => (prev <= 0 ? flat.length - 1 : prev - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && flat[active]) {
        router.push(flat[active]._href)
        setQ('')
        setOpen(false)
        onNavigate?.()
      } else {
        submitFullSearch()
      }
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={ph}
          aria-label={isAr ? 'ابحث عن منتجات' : 'Search products'}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-suggestions"
          className={inputClassName || 'w-full pl-10 pr-9 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-green-400 transition-all'}
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(''); setData({ products: [], categories: [] }); inputRef.current?.focus() }}
            aria-label={isAr ? 'مسح البحث' : 'Clear search'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-full"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
        >
          {loading && flat.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">{isAr ? 'جاري البحث…' : 'Searching…'}</p>
          ) : flat.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">
              {isAr ? 'لا توجد نتائج. اضغط Enter للبحث على أي حال.' : 'No matches. Press Enter to search anyway.'}
            </p>
          ) : (
            <>
              {data.products.length > 0 && (
                <div className="p-2">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{isAr ? 'منتجات' : 'Products'}</p>
                  {data.products.map((p, i) => {
                    const idx = i
                    const isActive = active === idx
                    const label = lang === 'ar' && p.name_ar ? p.name_ar : p.name
                    const onSale = p.compare_at_price_aed != null && p.compare_at_price_aed > p.price_aed
                    return (
                      <Link
                        key={p.slug}
                        href={`/product/${p.slug}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => { setQ(''); setOpen(false); onNavigate?.() }}
                        onMouseEnter={() => setActive(idx)}
                        className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="relative w-10 h-10 bg-gray-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xl">
                          {p.image_url ? (
                            <Image src={p.image_url} alt="" fill sizes="40px" className="object-cover" />
                          ) : (
                            <span aria-hidden="true">{p.emoji || '🥦'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                          <p className="text-xs text-gray-500">
                            AED {p.price_aed.toFixed(2)}
                            {p.unit && <span> / {p.unit}</span>}
                            {p.stock === 0 && <span className="ml-2 text-red-500 font-semibold">{isAr ? 'نفد' : 'Sold out'}</span>}
                          </p>
                        </div>
                        {onSale && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">SALE</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
              {data.categories.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{isAr ? 'فئات' : 'Categories'}</p>
                  {data.categories.map((c, i) => {
                    const idx = data.products.length + i
                    const isActive = active === idx
                    const label = lang === 'ar' && c.name_ar ? c.name_ar : c.name
                    return (
                      <Link
                        key={c.slug}
                        href={`/shop?category=${c.slug}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => { setQ(''); setOpen(false); onNavigate?.() }}
                        onMouseEnter={() => setActive(idx)}
                        className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-xl" aria-hidden="true">{c.emoji || '🏷️'}</div>
                        <p className="text-sm font-semibold text-gray-900 truncate flex-1">{label}</p>
                        <ArrowRight size={14} className="text-gray-400" aria-hidden="true" />
                      </Link>
                    )
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={submitFullSearch}
                className="w-full px-4 py-2.5 text-xs font-bold text-forest-dark bg-green-50 hover:bg-green-100 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
              >
                {isAr ? `كل النتائج عن "${q.trim()}"` : `See all results for "${q.trim()}"`}
                <ArrowRight size={12} aria-hidden="true" className={isAr ? 'rotate-180' : ''} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
