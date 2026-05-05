'use client'
import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, X, Download, Upload } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'

interface Product {
  id: number
  name: string
  name_ar: string
  slug: string
  category_id: number
  description: string
  price_aed: number
  compare_at_price_aed: number | null
  unit: string
  stock: number
  is_active: boolean
  is_featured: boolean
  is_organic: boolean
  origin: string
  emoji: string
  image_url: string | null
  image_urls: string[]
  categories?: { name: string; slug: string }
}

interface Category {
  id: number
  name: string
  slug: string
}

const emptyProduct = {
  name: '', name_ar: '', slug: '', category_id: 0, description: '',
  price_aed: 0, compare_at_price_aed: '' as string | number, unit: 'kg', stock: 0, is_active: true, is_featured: false,
  is_organic: false, origin: '', emoji: '', image_urls: [] as string[],
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
  const [apiError, setApiError] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'category'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [importRows, setImportRows] = useState<any[] | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    let result = products.filter(p => {
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
    setApiError('')
    try {
      const res = await fetch('/api/dashboard/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing, ...editData }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.error || 'Save failed'); return }
      setProducts(prev => prev.map(p => p.id === editing ? {
        ...p,
        ...editData,
        image_url: editData.image_urls?.[0] ?? editData.image_url ?? p.image_url,
      } : p))
      setEditing(null)
      setEditData(null)
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.slug) return
    if (newProduct.price_aed < 0) { setApiError('Price cannot be negative'); return }
    if (newProduct.stock < 0) { setApiError('Stock cannot be negative'); return }
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch('/api/dashboard/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setApiError(data.error || 'Failed to add product'); return }
      setShowAdd(false)
      setNewProduct(emptyProduct)
      router.refresh()
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch('/api/dashboard/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (!res.ok) { const d = await res.json(); setApiError(d.error || 'Delete failed'); return }
      setProducts(prev => prev.filter(p => !selected.has(p.id)))
      setSelected(new Set())
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: number, current: boolean) {
    try {
      const res = await fetch('/api/dashboard/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id), is_active: !current }),
      })
      if (!res.ok) return
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    } catch { /* silent — user can retry */ }
  }

  async function bulkAction(action: 'activate' | 'deactivate') {
    if (selected.size === 0) return
    setSaving(true)
    setApiError('')
    try {
      await Promise.all(Array.from(selected).map(id =>
        fetch('/api/dashboard/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: String(id), is_active: action === 'activate' }),
        })
      ))
      setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, is_active: action === 'activate' } : p))
      setSelected(new Set())
    } catch {
      setApiError('Network error — some items may not have updated')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  function exportCSV() {
    const headers = ['name', 'name_ar', 'slug', 'category_slug', 'description', 'price_aed', 'unit', 'stock', 'is_active', 'is_featured', 'is_organic', 'origin', 'emoji']
    const escape = (v: any) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = products.map(p => [
      p.name, p.name_ar, p.slug, p.categories?.slug ?? '',
      p.description, p.price_aed, p.unit, p.stock,
      p.is_active, p.is_featured, p.is_organic, p.origin, p.emoji,
    ].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `tmfoodstuff-products-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  function downloadTemplate() {
    const headers = 'name,name_ar,slug,category_slug,description,price_aed,unit,stock,is_active,is_featured,is_organic,origin,emoji'
    const example = 'Apple,تفاح,apple,fruits,Fresh red apples,8.50,kg,100,true,false,false,UAE,🍎'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([headers + '\n' + example], { type: 'text/csv' }))
    a.download = 'tmfoodstuff-products-template.csv'
    a.click()
  }

  function parseCSV(text: string): any[] {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const vals: string[] = []
      let cur = '', inQuote = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQuote = !inQuote }
        else if (ch === ',' && !inQuote) { vals.push(cur); cur = '' }
        else { cur += ch }
      }
      vals.push(cur)
      const obj: any = {}
      headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').replace(/^"|"$/g, '').trim() })
      return obj
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string)
      setImportRows(rows)
      setImportResult(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function runImport() {
    if (!importRows) return
    setImporting(true)
    try {
      const res = await fetch('/api/dashboard/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.error || 'Import failed'); setImportRows(null); return }
      setImportResult(data)
      setImportRows(null)
      router.refresh()
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setImporting(false)
    }
  }

  // Normalise product images to a string[]
  function getProductImages(p: Product): string[] {
    if (Array.isArray(p.image_urls) && p.image_urls.length > 0) return p.image_urls
    if (p.image_url) return [p.image_url]
    return []
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError('')} className="text-red-400 hover:text-red-300 ml-4 font-bold">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition-colors" title="Download CSV template">
            <Download size={14} /> Template
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition-colors">
            <Upload size={14} /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors">
            <Plus size={16} /> Add Product
          </button>
        </div>
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

      {/* Import preview modal */}
      {importRows && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-black text-white mb-2">Import Products</h2>
            <p className="text-gray-400 text-sm mb-4">
              Found <span className="text-white font-bold">{importRows.length}</span> row{importRows.length !== 1 ? 's' : ''}.
              Existing slugs will be updated; new slugs will be created.
            </p>
            <div className="bg-gray-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-700 mb-5">
              {importRows.slice(0, 20).map((r, i) => (
                <div key={i} className="px-4 py-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-white truncate">{r.emoji} {r.name || <span className="text-red-400 italic">missing name</span>}</span>
                  <span className="text-xs text-gray-500 shrink-0">AED {r.price_aed} · {r.unit}</span>
                </div>
              ))}
              {importRows.length > 20 && (
                <div className="px-4 py-2 text-xs text-gray-500">+ {importRows.length - 20} more rows</div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setImportRows(null)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-xl hover:bg-gray-700">Cancel</button>
              <button onClick={runImport} disabled={importing} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 disabled:opacity-50 flex items-center gap-2">
                <Upload size={14} /> {importing ? 'Importing...' : `Import ${importRows.length} rows`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import result modal */}
      {importResult && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-black text-white mb-4">Import Complete</h2>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created</span>
                <span className="text-green-400 font-bold">{importResult.imported} product{importResult.imported !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Updated</span>
                <span className="text-blue-400 font-bold">{importResult.updated} product{importResult.updated !== 1 ? 's' : ''}</span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-red-400 font-semibold mb-2">{importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}:</p>
                  <div className="bg-gray-800 rounded-xl max-h-32 overflow-y-auto divide-y divide-gray-700">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="px-3 py-1.5 text-xs text-red-400">{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="w-full px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500">Done</button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-white">Add New Product</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Name *" value={newProduct.name} onChange={v => setNewProduct({...newProduct, name: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/,'')})} />
              <Input label="Arabic Name" value={newProduct.name_ar} onChange={v => setNewProduct({...newProduct, name_ar: v})} />
              <Input label="Slug *" value={newProduct.slug} onChange={v => setNewProduct({...newProduct, slug: v})} />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  <option value={0}>Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Price (AED) *" value={String(newProduct.price_aed)} onChange={v => setNewProduct({...newProduct, price_aed: Number(v)})} type="number" />
              <Input label="Compare-at Price (AED)" value={String(newProduct.compare_at_price_aed ?? '')} onChange={v => setNewProduct({...newProduct, compare_at_price_aed: v === '' ? '' : Number(v)})} type="number" />
              <Input label="Unit" value={newProduct.unit} onChange={v => setNewProduct({...newProduct, unit: v})} />
              <Input label="Stock" value={String(newProduct.stock)} onChange={v => setNewProduct({...newProduct, stock: Number(v)})} type="number" />
              <Input label="Origin" value={newProduct.origin} onChange={v => setNewProduct({...newProduct, origin: v})} />
              <Input label="Emoji" value={newProduct.emoji} onChange={v => setNewProduct({...newProduct, emoji: v})} />
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 h-20 resize-none" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs text-gray-500 mb-2 block">Product Images</label>
                <ImageUploader
                  images={newProduct.image_urls}
                  onChange={urls => setNewProduct({...newProduct, image_urls: urls})}
                />
              </div>
              <Toggle label="Organic" checked={newProduct.is_organic} onChange={v => setNewProduct({...newProduct, is_organic: v})} />
              <Toggle label="Featured" checked={newProduct.is_featured} onChange={v => setNewProduct({...newProduct, is_featured: v})} />
            </div>
            <div className="flex justify-end gap-3 mt-5">
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setEditing(null); setEditData(null) }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-white">Edit Product</h2>
              <button onClick={() => { setEditing(null); setEditData(null) }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Input label="Compare-at Price (AED)" value={String(editData.compare_at_price_aed ?? '')} onChange={v => setEditData({...editData, compare_at_price_aed: v === '' ? null : Number(v)})} type="number" />
              <Input label="Unit" value={editData.unit || ''} onChange={v => setEditData({...editData, unit: v})} />
              <Input label="Stock" value={String(editData.stock || 0)} onChange={v => setEditData({...editData, stock: Number(v)})} type="number" />
              <Input label="Origin" value={editData.origin || ''} onChange={v => setEditData({...editData, origin: v})} />
              <Input label="Emoji" value={editData.emoji || ''} onChange={v => setEditData({...editData, emoji: v})} />
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 h-20 resize-none" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs text-gray-500 mb-2 block">Product Images</label>
                <ImageUploader
                  images={editData.image_urls || []}
                  onChange={urls => setEditData({...editData, image_urls: urls})}
                />
              </div>
              <Toggle label="Organic" checked={editData.is_organic || false} onChange={v => setEditData({...editData, is_organic: v})} />
              <Toggle label="Featured" checked={editData.is_featured || false} onChange={v => setEditData({...editData, is_featured: v})} />
              <Toggle label="Active" checked={editData.is_active !== false} onChange={v => setEditData({...editData, is_active: v})} />
            </div>
            <div className="flex justify-end gap-3 mt-5">
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

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-gray-800">
          {filtered.length === 0 ? (
            <p className="p-12 text-center text-gray-600">No products found</p>
          ) : filtered.map(product => (
            <div key={product.id} className={`p-4 space-y-2 transition-colors ${selected.has(product.id) ? 'bg-gray-800/30' : ''}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selected.has(product.id)} onChange={() => {
                  const s = new Set(selected); s.has(product.id) ? s.delete(product.id) : s.add(product.id); setSelected(s)
                }} className="rounded shrink-0" />
                {product.emoji && <span className="text-2xl shrink-0">{product.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-gray-500 text-xs">{product.categories?.name || '—'} · {product.unit}</p>
                </div>
                <span className="text-green-400 font-bold text-sm shrink-0">AED {Number(product.price_aed).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pl-10">
                <span className={`text-xs font-semibold ${product.stock > 10 ? 'text-gray-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {product.stock} in stock
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(product.id, product.is_active)} className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${product.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {product.is_active ? '● Active' : '○ Inactive'}
                  </button>
                  <button onClick={() => { setEditing(product.id); setEditData({...product}) }} className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
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
              {filtered.map(product => {
                const imgs = getProductImages(product)
                return (
                  <tr key={product.id} className={`transition-colors hover:bg-gray-800/30 ${selected.has(product.id) ? 'bg-gray-800/20' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(product.id)} onChange={() => {
                        const s = new Set(selected)
                        s.has(product.id) ? s.delete(product.id) : s.add(product.id)
                        setSelected(s)
                      }} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {/* Thumbnail */}
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
                          {imgs[0] ? (
                            <img src={imgs[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : product.emoji ? (
                            <span className="text-lg">{product.emoji}</span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{product.name}</p>
                          <p className="text-gray-600 text-xs">
                            {product.name_ar && <span>{product.name_ar} · </span>}
                            {product.unit}
                            {imgs.length > 1 && <span className="ml-1 text-gray-500">· {imgs.length} imgs</span>}
                          </p>
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
                      <button
                        onClick={() => {
                          setEditing(product.id)
                          setEditData({
                            ...product,
                            image_urls: getProductImages(product),
                          })
                        }}
                        className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
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
