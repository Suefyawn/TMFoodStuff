'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, CheckCircle2, XCircle, Trash2, MessageSquare } from 'lucide-react'

interface Row {
  id: number
  rating: number
  body: string | null
  status: string
  created_at: string
  moderated_at: string | null
  moderator_email: string | null
  products: { slug: string; name: string } | null
  customers: { email: string | null; full_name: string | null } | null
}

export default function ReviewsClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')

  const filtered = filterStatus ? rows.filter(r => r.status === filterStatus) : rows

  async function setStatus(id: number, status: 'approved' | 'rejected' | 'pending') {
    setBusy(id)
    setError('')
    try {
      const res = await fetch('/api/dashboard/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update review')
        return
      }
      setRows(prev => prev.map(r => r.id === id ? { ...r, status, moderated_at: new Date().toISOString() } : r))
    } finally {
      setBusy(null)
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this review permanently?')) return
    setBusy(id)
    setError('')
    try {
      const res = await fetch('/api/dashboard/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Delete failed')
        return
      }
      setRows(prev => prev.filter(r => r.id !== id))
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const STATUS_BADGE: Record<string, string> = {
    approved: 'bg-green-500/15 text-green-300 border-green-500/30',
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white inline-flex items-center gap-2">
            <MessageSquare size={20} className="text-gray-400" aria-hidden="true" /> Reviews
          </h1>
          <p className="text-gray-500 text-sm">{filtered.length} of {rows.length}</p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500"
        >
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-gray-600 text-sm">No reviews match this filter.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {filtered.map(r => (
              <li key={r.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={12} className={n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} aria-hidden="true" />
                        ))}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {r.products?.name || '—'} · {r.customers?.full_name || r.customers?.email || 'unknown'}
                      </span>
                    </div>
                    {r.body && <p className="text-sm text-gray-300 whitespace-pre-line">{r.body}</p>}
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {r.moderated_at && r.moderator_email && (
                        <> · moderated by {r.moderator_email}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status !== 'approved' && (
                      <button onClick={() => setStatus(r.id, 'approved')} disabled={busy === r.id} title="Approve" className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg disabled:opacity-40">
                        <CheckCircle2 size={16} aria-hidden="true" />
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => setStatus(r.id, 'rejected')} disabled={busy === r.id} title="Reject" className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg disabled:opacity-40">
                        <XCircle size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button onClick={() => remove(r.id)} disabled={busy === r.id} title="Delete" className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-40">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
