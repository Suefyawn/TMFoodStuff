'use client'
import { useState, useMemo } from 'react'
import { Search, Plus, Minus, X, Package } from 'lucide-react'

export interface BundleItem {
  product_id: number
  quantity: number
  name: string
  emoji?: string
}

interface ProductOption {
  id: number
  name: string
  emoji: string | null
  price_aed: number | null
  unit: string | null
  is_active: boolean
}

// Sub-form rendered inside the product create/edit drawer for products
// flagged "Is bundle". Lets admin pick component products + per-component
// quantities, with a running components-at-retail total so they can sanity-
// check the bundle's discount before saving.
export default function BundleEditor({
  value,
  onChange,
  bundlePriceAed,
  catalog,
}: {
  value: BundleItem[] | null
  onChange: (next: BundleItem[]) => void
  bundlePriceAed: number
  catalog: ProductOption[]
}) {
  const [search, setSearch] = useState('')

  const items = value || []
  const componentsTotal = useMemo(() => {
    return items.reduce((s, it) => {
      const cat = catalog.find(c => c.id === it.product_id)
      if (!cat) return s
      return s + Number(cat.price_aed ?? 0) * it.quantity
    }, 0)
  }, [items, catalog])

  const savings = componentsTotal - bundlePriceAed
  const savingsPct = componentsTotal > 0 ? (savings / componentsTotal) * 100 : 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return catalog
      .filter(c => c.is_active && !items.some(i => i.product_id === c.id))
      .filter(c => !q || c.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [catalog, search, items])

  function addProduct(p: ProductOption) {
    onChange([...items, { product_id: p.id, quantity: 1, name: p.name, emoji: p.emoji || undefined }])
    setSearch('')
  }
  function bump(idx: number, delta: number) {
    const next = items.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, Math.min(20, it.quantity + delta)) } : it)
    onChange(next)
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-3 sm:p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Package size={14} className="text-amber-400" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Bundle composition</p>
      </div>

      {/* Components */}
      {items.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No components yet. Search and add at least one product.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => {
            const cat = catalog.find(c => c.id === it.product_id)
            return (
              <li key={it.product_id} className="flex items-center justify-between gap-2 bg-gray-900 rounded-lg px-2.5 py-1.5 text-sm">
                <span className="text-gray-200 truncate flex-1">
                  {it.emoji && <span className="mr-1">{it.emoji}</span>}
                  <span className="font-bold">{it.name}</span>
                  {cat?.unit && <span className="text-gray-500 text-xs ml-1">/{cat.unit}</span>}
                </span>
                <span className="inline-flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => bump(i, -1)} className="w-6 h-6 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700"><Minus size={10} className="mx-auto" aria-hidden="true" /></button>
                  <span className="w-7 text-center text-xs font-mono tabular-nums">{it.quantity}</span>
                  <button type="button" onClick={() => bump(i, 1)} className="w-6 h-6 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700"><Plus size={10} className="mx-auto" aria-hidden="true" /></button>
                </span>
                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 shrink-0" aria-label="Remove">
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Pricing math — surfaces the discount so admins don't accidentally
          price a bundle higher than the sum of its parts. */}
      {items.length > 0 && (
        <div className="text-[11px] text-gray-400 flex justify-between gap-2 pt-2 border-t border-gray-700">
          <span>Sum of parts: <span className="text-gray-200 font-mono">AED {componentsTotal.toFixed(2)}</span></span>
          {savings > 0
            ? <span className="text-green-400">Saves <span className="font-bold">AED {savings.toFixed(2)} ({savingsPct.toFixed(0)}%)</span></span>
            : savings < 0
              ? <span className="text-red-400">Costs <span className="font-bold">AED {(-savings).toFixed(2)}</span> more than parts</span>
              : <span className="text-gray-500">Equals parts</span>}
        </div>
      )}

      {/* Add product picker */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search a product to add…"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
        />
        {search && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-44 overflow-y-auto">
            {filtered.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-800 flex items-center justify-between gap-2"
                >
                  <span className="text-gray-200 truncate">
                    {p.emoji && <span className="mr-1">{p.emoji}</span>}
                    {p.name}
                  </span>
                  <span className="text-gray-500 shrink-0">AED {Number(p.price_aed ?? 0).toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
