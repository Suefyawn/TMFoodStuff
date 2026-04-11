'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, X, Check } from 'lucide-react'

interface Product {
  id: number
  name: string
  name_ar: string
  slug: string
  category_id: number
  description: string
  price_aed: number
  unit: string
  stock: number
  is_active: boolean
  is_featured: boolean
  is_organic: boolean
  origin: string
  emoji: string
  image_url: string | null
  categories?: { name: string; slug: string }
}

interface Category {
  id: number
  name: string
  slug: string
}

const emptyProduct = {
  name: '', name_ar: '', slug: '', category_id: 0, description: '',
  price_aed: 0, unit: 'kg', stock: 0, is_active: true, is_featured: false,
  is_organic: false, origin: '', emoji: '', image_url: '',
}

export default function ProductsManager({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newProduct, setNewProduct] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'category'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    const result = products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.name_ar || '').includes(search)) return false
      if (filterCat && p.categories?.slug !== filterCat) return false
      if (filterStatus === 'active' && !p.is_active) return false
      if (filterStatus === 'inactive' && p.is_active) return false
      return true
    })

    result.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'price') cmp = Number(a.price_aed) - Number(b.price_aed)
      else if (sortBy === 'stock') cmp = a.stock - b.stock
      else if (sortBy === 'category') cmp = (a.categories?.name || '').localeCompare(b.categories?.name || '')
      return sortDir === 'desc' ? -cmp : cmp
    })
    return result
  }, [products, search, filterCat, filterStatus, sortBy, sortDir])

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  async function saveEdit() {
    if (!editData || editing === null) return
    setSaving(true)
    await fetch('/api/dashboard/products', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing, ...editData }),
    })
    setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...editData } : p))
    setEditing(null)
    setEditData(null)
    setSaving(false)
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.slug) return
    setSaving(true)
    const res = await fetch('/api/dashboard/products', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    })
    const data = await res.json()
    if (data.ok) {
      setShowAdd(false)
      setNewProduct(emptyProduct)
      router.refresh()
    }
    setSaving(false)
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} product(s)?`)) return
    setSaving(true)
    await fetch('/api/dashboard/products', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    })
    setProducts(prev => prev.filter(p => !selected.has(p.id)))
    setSelected(new Set())
    setSaving(false)
  }

  async function toggleActive(id: number, current: boolean) {
    await fetch('/api/dashboard/products', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: String(id), is_active: !current }),
    })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  async function bulkAction(action: 'activate' | 'deactivate') {
    if (selected.size === 0) return
    setSaving(true)
    for (const id of Array.from(selected)) {
      await fetch('/api/dashboard/products', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id), is_active: action === 'activate' }),
      })
    }
    setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, is_active: action === 'activate' } : p))
    setSelected(new Set())
    setSaving(false)
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} total · {filtered.length} shown</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-400">{selected.size} selected</span>
            <button onClick={() => bulkAction('activate')} className="px-3 py-1.5 bg-green-600/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-600/30">Activate</button>
            <button onClick={() => bulkAction('deactivate')} className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 text-xs font-bold rounded-lg hover:bg-yellow-600/30">Deactivate</button>
            <button onClick={deleteSelected} className="px-3 py-1.5 bg-red-600/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-600/30 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Add New Product</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={newProduct.name} onChange={v => setNewProduct({...newProduct, name: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/,'')})} />
              <Input label="Arabic Name" value={newProduct.name_ar} onChange={v => setNewProduct({...newProduct, name_ar: v})} />
              <Input label="Slug" value={newProduct.slug} onChange={v => setNewProduct({...newProduct, slug: v})} />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  <option value={0}>Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Price (AED)" value={String(newProduct.price_aed)} onChange={v => setNewProduct({...newProduct, price_aed: Number(v)})} type="number" />
              <Input label="Unit" value={newProduct.unit} onChange={v => setNewProduct({...newProduct, unit: v})} />
              <Input label="Stock" value={String(newProduct.stock)} onChange={v => setNewProduct({...newProduct, stock: Number(v)})} type="number" />
              <Input label="Origin" value={newProduct.origin} onChange={v => setNewProduct({...newProduct, origin: v})} />
              <Input label="Emoji" value={newProduct.emoji} onChange={v => setNewProduct({...newProduct, emoji: v})} />
              <Input label="Image URL" value={newProduct.image_url} onChange={v => setNewProduct({...newProduct, image_url: v})} />
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 h-20 resize-none" />
              </div>
              <Toggle label="Organic" checked={newProduct.is_organic} onChange={v => setNewProduct({...newProduct, is_organic: v})} />
              <Toggle label="Featured" checked={newProduct.is_featured} onChange={v => setNewProduct({...newProduct, is_featured: v})} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-xl hover:bg-gray-700">Cancel</button>
              <button onClick={addProduct} disabled={saving || !newProduct.name} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editing !== null && editData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setEditing(null); setEditData(null) }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Edit Product</h2>
              <button onClick={() => { setEditing(null); setEditData(null) }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={editData.name || ''} onChange={v => setEditData({...editData, name: v})} />
              <Input label="Arabic Name" value={editData.name_ar || ''} onChange={v => setEditData({...editData, name_ar: v})} />
              <Input label="Slug" value={editData.slug || ''} onChange={v => setEditData({...editData, slug: v})} />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select value={editData.category_id || 0} onChange={e => setEditData({...editData, category_id: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Price (AED)" value={String(editData.price_aed || 0)} onChange={v => setEditData({...editData, price_aed: Number(v)})} type="number" />
              <Input label="Unit" value={editData.unit || ''} onChange={v => setEditData({...editData, unit: v})} />
              <Input label="Stock" value={String(editData.stock || 0)} onChange={v => setEditData({...editData, stock: Number(v)})} type="number" />
              <Input label="Origin" value={editData.origin || ''} onChange={v => setEditData({...editData, origin: v})} />
              <Input label="Emoji" value={editData.emoji || ''} onChange={v => setEditData({...editData, emoji: v})} />
              <Input label="Image URL" value={editData.image_url || ''} onChange={v => setEditData({...editData, image_url: v})} />
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 h-20 resize-none" />
              </div>
              <Toggle label="Organic" checked={editData.is_organic || false} onChange={v => setEditData({...editData, is_organic: v})} />
              <Toggle label="Featured" checked={editData.is_featured || false} onChange={v => setEditData({...editData, is_featured: v})} />
              <Toggle label="Active" checked={editData.is_active !== false} onChange={v => setEditData({...editData, is_active: v})} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setEditing(null); setEditData(null) }} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-xl hover:bg-gray-700">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-300" onClick={() => toggleSort('name')}>
                  Product {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-300" onClick={() => toggleSort('category')}>
                  Category {sortBy === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-300" onClick={() => toggleSort('price')}>
                  Price {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-300" onClick={() => toggleSort('stock')}>
                  Stock {sortBy === 'stock' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(product => (
                <tr key={product.id} className={`transition-colors hover:bg-gray-800/30 ${selected.has(product.id) ? 'bg-gray-800/20' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(product.id)} onChange={() => {
                      const s = new Set(selected)
                      if (s.has(product.id)) s.delete(product.id)
                      else s.add(product.id)
                      setSelected(s)
                    }} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.emoji && <span className="text-lg">{product.emoji}</span>}
                      <div>
                        <p className="text-white font-semibold text-sm">{product.name}</p>
                        <p className="text-gray-600 text-xs">{product.name_ar} · {product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{product.categories?.name || '—'}</td>
                  <td className="px-4 py-3 text-green-400 font-bold text-sm">AED {Number(product.price_aed).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${product.stock > 10 ? 'text-gray-300' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>{product.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(product.id, product.is_active)} className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${product.is_active ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400'}`}>
                      {product.is_active ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(product.id); setEditData({...product}) }} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} step={type === 'number' ? '0.01' : undefined} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(!checked)} className={`w-10 h-6 rounded-full transition-colors flex items-center ${checked ? 'bg-green-600 justify-end' : 'bg-gray-700 justify-start'}`}>
        <div className="w-4 h-4 bg-white rounded-full mx-1 shadow" />
      </button>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  )
}
