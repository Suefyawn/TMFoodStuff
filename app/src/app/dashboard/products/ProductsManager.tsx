'use client'
import { useState } from 'react'

export default function ProductsManager({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  async function saveProduct(id: number, updates: any) {
    setSaving(id)
    await fetch('/api/dashboard/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: String(id), ...updates }),
    })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    setEditing(null)
    setSaving(null)
  }

  async function toggleActive(id: number, current: boolean) {
    setSaving(id)
    await fetch('/api/dashboard/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: String(id), is_active: !current }),
    })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    setSaving(null)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (AED)</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products.map(product => {
              const id = product.id
              const isEditing = editing === id
              return (
                <tr key={id} className={`transition-colors ${isEditing ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {product.emoji && <span className="text-lg">{product.emoji}</span>}
                      <div>
                        <p className="text-white font-semibold text-sm">{product.name}</p>
                        <p className="text-gray-600 text-xs">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-400 text-xs">{product.categories?.name || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <input type="number" defaultValue={product.price_aed} step="0.5" id={`price-${id}`}
                        className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-green-500" />
                    ) : (
                      <span className="text-green-400 font-bold text-sm">AED {Number(product.price_aed).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <input type="number" defaultValue={product.stock} id={`stock-${id}`}
                        className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-green-500" />
                    ) : (
                      <span className={`text-sm font-semibold ${product.stock > 10 ? 'text-gray-300' : 'text-red-400'}`}>{product.stock}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(id, product.is_active)} disabled={saving === id}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                        product.is_active ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400'
                      } disabled:opacity-50`}>
                      {product.is_active ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const price = parseFloat((document.getElementById(`price-${id}`) as HTMLInputElement).value)
                            const stock = parseInt((document.getElementById(`stock-${id}`) as HTMLInputElement).value)
                            saveProduct(id, { price_aed: price, stock })
                          }}
                          disabled={saving === id}
                          className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
                          {saving === id ? '...' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)} className="text-xs px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditing(id)} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Edit</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
