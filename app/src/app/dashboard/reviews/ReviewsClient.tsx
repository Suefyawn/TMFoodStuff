'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, CheckCircle2, XCircle, Trash2, MessageSquare, ShieldCheck, ThumbsUp, MessageCircle, Loader2 } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

interface Row {
  id: number
  rating: number
  title: string | null
  body: string | null
  images: Array<{ url: string; alt?: string }> | null
  verified_purchase: boolean
  helpful_count: number
  admin_reply: string | null
  admin_reply_at: string | null
  admin_reply_by: string | null
  status: string
  created_at: string
  moderated_at: string | null
  moderator_email: string | null
  products: { slug: string; name: string } | null
  customers: { email: string | null; full_name: string | null } | null
}

export default function ReviewsClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({})
  const [savingReply, setSavingReply] = useState<number | null>(null)

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

  async function saveReply(id: number) {
    const text = (replyDraft[id] || '').trim()
    setSavingReply(id)
    setError('')
    try {
      const res = await fetch('/api/dashboard/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_reply: text }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save reply')
        return
      }
      setRows(prev => prev.map(r => r.id === id ? {
        ...r,
        admin_reply: text || null,
        admin_reply_at: text ? new Date().toISOString() : null,
      } : r))
      setReplyDraft(prev => { const next = { ...prev }; delete next[id]; return next })
    } finally {
      setSavingReply(null)
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: 'Delete this review permanently?',
      message: 'This cannot be undone. Consider rejecting instead to keep an audit trail.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
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
    approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  }

  // Counts shown in the filter pill so admin sees the moderation queue at a glance.
  const counts = {
    all: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white inline-flex items-center gap-2">
            <MessageSquare size={20} className="text-gray-400" aria-hidden="true" /> Reviews
          </h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} of {rows.length}
            {counts.pending > 0 && <span className="text-amber-400 font-bold"> · {counts.pending} pending</span>}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { v: '', label: `All (${counts.all})` },
            { v: 'pending', label: `Pending (${counts.pending})` },
            { v: 'approved', label: `Approved (${counts.approved})` },
            { v: 'rejected', label: `Rejected (${counts.rejected})` },
          ].map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setFilterStatus(opt.v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                filterStatus === opt.v ? 'bg-emerald-900/40 border-emerald-600 text-emerald-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-gray-600 text-sm">No reviews match this filter.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {filtered.map(r => {
              const images = Array.isArray(r.images) ? r.images : []
              const draftValue = replyDraft[r.id] ?? r.admin_reply ?? ''
              const draftDirty = draftValue !== (r.admin_reply || '')
              return (
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
                        {r.verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/30 border border-emerald-700/50 rounded px-1.5 py-0.5">
                            <ShieldCheck size={9} aria-hidden="true" /> Verified buyer
                          </span>
                        )}
                        {r.helpful_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                            <ThumbsUp size={9} aria-hidden="true" /> {r.helpful_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        <Link href={`/product/${r.products?.slug || ''}`} className="hover:text-white font-bold">{r.products?.name || '—'}</Link>
                        {' · '}
                        {r.customers?.full_name || r.customers?.email || 'unknown'}
                      </p>
                      {r.title && <p className="text-sm font-bold text-white mb-1">{r.title}</p>}
                      {r.body && <p className="text-sm text-gray-300 whitespace-pre-line">{r.body}</p>}
                      {images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {images.map((img, i) => (
                            <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative w-16 h-16 rounded-lg overflow-hidden border border-gray-800">
                              <Image src={img.url} alt={img.alt || ''} fill className="object-cover" sizes="64px" />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {r.moderated_at && r.moderator_email && (
                          <> · moderated by {r.moderator_email}</>
                        )}
                      </p>

                      {/* Admin reply */}
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 inline-flex items-center gap-1">
                          <MessageCircle size={10} aria-hidden="true" /> Public reply from {r.admin_reply_by || 'admin'}
                        </p>
                        <textarea
                          value={draftValue}
                          onChange={e => setReplyDraft(prev => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Thank the customer or address their concern — visible on the product page."
                          rows={2}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                        />
                        {draftDirty && (
                          <div className="flex gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => saveReply(r.id)}
                              disabled={savingReply === r.id}
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                            >
                              {savingReply === r.id ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : null}
                              Save reply
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyDraft(prev => { const n = { ...prev }; delete n[r.id]; return n })}
                              className="text-xs text-gray-500 hover:text-gray-300 font-bold px-2 py-1.5"
                            >
                              Discard
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.status !== 'approved' && (
                        <button onClick={() => setStatus(r.id, 'approved')} disabled={busy === r.id} title="Approve" className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg disabled:opacity-40">
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
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
