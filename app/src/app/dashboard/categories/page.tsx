'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2 } from 'lucide-react'

interface Category {
  id: number
  name: string
  name_ar: string
  slug: string
  emoji: string
  description: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [apiError, setApiError] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', name_ar: '', slug: '', emoji: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/categories')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); return }
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch(() => setFetchError('Failed to load categories'))
      .finally(() => setLoading(false))
  }, [])

  async function addCategory() {
    if (!newCat.name || !newCat.slug) return
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch('/api/dashboard/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setApiError(data.error || 'Failed to add category'); return }
      setCategories(prev => [...prev, data.category])
      setShowAdd(false)
      setNewCat({ name: '', name_ar: '', slug: '', emoji: '', description: '' })
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!editData || editing === null) return
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch('/api/dashboard/categories', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing, ...editData }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setApiError(data.error || 'Failed to save'); return }
      setCategories(prev => prev.map(c => c.id === editing ? { ...c, ...editData } : c))
      setEditing(null)
      setEditData(null)
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category? Products in it won\'t be deleted but will become uncategorized.')) return
    setApiError('')
    try {
      const res = await fetch('/api/dashboard/categories', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setApiError(data.error || 'Failed to delete'); return }
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch {
      setApiError('Network error — please try again')
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Loading categories...</div>
  if (fetchError) return <div className="p-6 text-red-400">Error: {fetchError}</div>

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <button onClick={() => { setShowAdd(true); setApiError('') }} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {apiError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {apiError}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Add Category</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <input placeholder="Arabic Name" value={newCat.name_ar} onChange={e => setNewCat({...newCat, name_ar: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <input placeholder="Slug" value={newCat.slug} onChange={e => setNewCat({...newCat, slug: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <input placeholder="Emoji" value={newCat.emoji} onChange={e => setNewCat({...newCat, emoji: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <textarea placeholder="Description" value={newCat.description} onChange={e => setNewCat({...newCat, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 h-20 resize-none" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-xl">Cancel</button>
              <button onClick={addCategory} disabled={saving || !newCat.name} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing !== null && editData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => {setEditing(null); setEditData(null)}}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-white mb-4">Edit Category</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <input placeholder="Arabic Name" value={editData.name_ar || ''} onChange={e => setEditData({...editData, name_ar: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <input placeholder="Emoji" value={editData.emoji || ''} onChange={e => setEditData({...editData, emoji: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              <textarea placeholder="Description" value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 h-20 resize-none" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => {setEditing(null); setEditData(null)}} className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-xl">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-gray-800">
          {categories.length === 0 ? (
            <p className="p-8 text-center text-gray-600">No categories yet</p>
          ) : categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{cat.emoji}</span>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{cat.name}</p>
                  <p className="text-gray-500 text-xs font-mono truncate">{cat.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setEditing(cat.id); setEditData({...cat}) }} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Edit</button>
                <button onClick={() => deleteCategory(cat.id)} className="text-xs px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.emoji}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{cat.name}</p>
                        <p className="text-gray-600 text-xs">{cat.name_ar}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-sm font-mono">{cat.slug}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px] truncate">{cat.description}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(cat.id); setEditData({...cat}) }} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Edit</button>
                      <button onClick={() => deleteCategory(cat.id)} className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={12} /></button>
                    </div>
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
