'use client'
import { useState, useMemo } from 'react'
import { FileText, Search, X, ChevronDown, ChevronRight } from 'lucide-react'

interface AuditRow {
  id: number
  actor_email: string
  action: string
  entity: string | null
  before: unknown
  after: unknown
  metadata: unknown
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  'order.status_change': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'order.refund':        'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'order.update':        'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'product.create':      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'product.update':      'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'product.delete':      'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'settings.update':     'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'auth.login':          'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'auth.logout':         'bg-gray-500/15 text-gray-300 border-gray-500/30',
  'image.upload':        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'image.delete':        'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export default function AuditLogClient({ initialRows }: { initialRows: AuditRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [search, setSearch] = useState('')
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // The server page renders the newest 500; assume more exist until a fetch
  // for older rows comes back short.
  const [hasMore, setHasMore] = useState(initialRows.length >= 500)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)

  async function loadOlder() {
    if (loadingMore || rows.length === 0) return
    setLoadingMore(true)
    setLoadError(false)
    try {
      const oldestId = rows[rows.length - 1].id
      const res = await fetch(`/api/dashboard/audit-log?before_id=${oldestId}`)
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { rows: AuditRow[]; hasMore: boolean }
      setRows(prev => [...prev, ...data.rows])
      setHasMore(data.hasMore)
    } catch {
      setLoadError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const actors = useMemo(() => Array.from(new Set(rows.map(r => r.actor_email))).sort(), [rows])
  const actions = useMemo(() => Array.from(new Set(rows.map(r => r.action))).sort(), [rows])

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (actor && r.actor_email !== actor) return false
      if (action && r.action !== action) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(r.entity || '').toLowerCase().includes(q) &&
          !(r.actor_email || '').toLowerCase().includes(q) &&
          !(r.action || '').toLowerCase().includes(q) &&
          !JSON.stringify(r.metadata ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [rows, search, actor, action])

  function summarise(r: AuditRow): string {
    const meta = (r.metadata || {}) as Record<string, unknown>
    if (r.action === 'order.status_change') {
      const b = (r.before || {}) as { status?: string }
      const a = (r.after || {}) as { status?: string }
      return `${meta.order_number || r.entity}: ${b.status || '?'} → ${a.status || '?'}`
    }
    if (r.action === 'order.refund') {
      return `${meta.order_number || r.entity} refunded AED ${(meta as { amount_aed?: number }).amount_aed?.toFixed?.(2) ?? '—'}${meta.partial ? ' (partial)' : ''}`
    }
    return r.entity || ''
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white inline-flex items-center gap-2">
            <FileText size={20} className="text-gray-400" aria-hidden="true" />
            Audit Log
          </h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} of {rows.length} loaded events
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} aria-hidden="true" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entity, action, metadata…"
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select value={actor} onChange={e => setActor(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500">
          <option value="">All actors</option>
          {actors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={action} onChange={e => setAction(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500">
          <option value="">All actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {(search || actor || action) && (
          <button onClick={() => { setSearch(''); setActor(''); setAction('') }} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
            <X size={12} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-gray-600 text-sm">No audit events match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {filtered.map(r => {
              const expanded = expandedId === r.id
              return (
                <li key={r.id} className="px-4 sm:px-5 py-3">
                  <button
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                    className="w-full flex items-center gap-3 text-left"
                    aria-expanded={expanded}
                  >
                    {expanded ? <ChevronDown size={14} className="text-gray-500 shrink-0" aria-hidden="true" /> : <ChevronRight size={14} className="text-gray-500 shrink-0" aria-hidden="true" />}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${ACTION_COLORS[r.action] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {r.action.replace(/[._]/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-200 truncate flex-1">{summarise(r)}</span>
                    <span className="text-xs text-gray-500 shrink-0">{r.actor_email}</span>
                    <span className="text-xs text-gray-600 shrink-0 hidden sm:block">
                      {new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                  {expanded && (
                    <div className="mt-3 ml-7 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <pre className="bg-gray-950 border border-gray-800 rounded-lg p-2.5 overflow-x-auto text-gray-400">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Before</div>
                        {r.before ? JSON.stringify(r.before, null, 2) : '—'}
                      </pre>
                      <pre className="bg-gray-950 border border-gray-800 rounded-lg p-2.5 overflow-x-auto text-gray-400">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">After</div>
                        {r.after ? JSON.stringify(r.after, null, 2) : '—'}
                      </pre>
                      <pre className="bg-gray-950 border border-gray-800 rounded-lg p-2.5 overflow-x-auto text-gray-400">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Metadata</div>
                        {r.metadata ? JSON.stringify(r.metadata, null, 2) : '—'}
                      </pre>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Cursor pagination — the server page only renders the newest 500 */}
      {hasMore && (
        <div className="text-center">
          {loadError && (
            <p className="text-xs text-red-400 mb-2">Couldn’t load older events — try again.</p>
          )}
          <button
            onClick={loadOlder}
            disabled={loadingMore}
            className="text-sm font-bold text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load older events'}
          </button>
        </div>
      )}
    </div>
  )
}
