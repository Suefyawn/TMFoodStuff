'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Send, CheckCircle2, AlertCircle, ExternalLink, RefreshCcw, User } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

interface Thread {
  id: number
  customer_id: number | null
  customer_email: string
  customer_name: string | null
  subject: string | null
  status: 'open' | 'pending_customer' | 'resolved' | 'spam'
  assigned_to: string | null
  last_message_at: string
  last_message_direction: 'in' | 'out'
  message_count: number
  created_at: string
}

interface Message {
  id: number
  direction: 'in' | 'out'
  from_email: string | null
  from_name: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  sent_by: string | null
  created_at: string
}

const STATUS_LABEL: Record<Thread['status'], { label: string; bg: string }> = {
  open:              { label: 'Open',              bg: 'bg-amber-900/40 text-amber-200 border-amber-700' },
  pending_customer:  { label: 'Awaiting customer', bg: 'bg-blue-900/40 text-blue-200 border-blue-700' },
  resolved:          { label: 'Resolved',          bg: 'bg-emerald-900/40 text-emerald-200 border-emerald-700' },
  spam:              { label: 'Spam',              bg: 'bg-gray-800 text-gray-400 border-gray-700' },
}

export default function InboxClient({ initialThreads, currentUserEmail }: { initialThreads: Thread[]; currentUserEmail: string }) {
  const confirm = useConfirm()
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [statusFilter, setStatusFilter] = useState<'' | Thread['status']>('')
  const [activeId, setActiveId] = useState<number | null>(initialThreads[0]?.id || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [resolvedToggle, setResolvedToggle] = useState(false)

  const active = threads.find(t => t.id === activeId) || null
  const filtered = statusFilter ? threads.filter(t => t.status === statusFilter) : threads

  // Pull the active thread's messages whenever the selection changes.
  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    setLoadingMessages(true)
    fetch(`/api/dashboard/inbox/${activeId}`)
      .then(r => r.json())
      .then((data: { messages?: Message[] }) => setMessages(data.messages || []))
      .finally(() => setLoadingMessages(false))
  }, [activeId])

  async function refresh() {
    const res = await fetch('/api/dashboard/inbox')
    const data = await res.json() as { threads?: Thread[] }
    if (data.threads) setThreads(data.threads)
  }

  async function patchStatus(id: number, status: Thread['status']) {
    if (status === 'spam') {
      const ok = await confirm({
        title: 'Mark as spam?',
        message: 'The customer will no longer see your replies (we still keep the record). You can flip this back if it was wrong.',
        confirmLabel: 'Mark spam',
        destructive: true,
      })
      if (!ok) return
    }
    const previous = threads
    setThreads(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    try {
      const res = await fetch(`/api/dashboard/inbox/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        setError('Could not update status')
        setThreads(previous)
      }
    } catch {
      setThreads(previous)
    }
  }

  async function assignToMe(id: number) {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, assigned_to: currentUserEmail } : t))
    await fetch(`/api/dashboard/inbox/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: currentUserEmail }),
    })
  }

  async function send() {
    if (!active || !reply.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/dashboard/inbox/${active.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply, markResolved: resolvedToggle }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Send failed')
        return
      }
      setReply('')
      setResolvedToggle(false)
      // Re-fetch the thread + refresh sidebar status.
      const detail = await fetch(`/api/dashboard/inbox/${active.id}`).then(r => r.json()) as { messages?: Message[] }
      setMessages(detail.messages || [])
      await refresh()
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
      {/* Sidebar */}
      <aside className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-gray-800 flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
          >
            <option value="">All ({threads.length})</option>
            <option value="open">Open ({threads.filter(t => t.status === 'open').length})</option>
            <option value="pending_customer">Awaiting customer</option>
            <option value="resolved">Resolved</option>
            <option value="spam">Spam</option>
          </select>
          <button type="button" onClick={refresh} aria-label="Refresh" className="p-1.5 text-gray-400 hover:text-white">
            <RefreshCcw size={14} aria-hidden="true" />
          </button>
        </div>
        <ul className="overflow-y-auto flex-1 divide-y divide-gray-800">
          {filtered.length === 0 ? (
            <li className="p-8 text-center text-xs text-gray-500">
              {threads.length === 0
                ? 'No threads yet. Configure Resend inbound to route support@ here.'
                : 'No threads in this status.'}
            </li>
          ) : filtered.map(t => {
            const isActive = activeId === t.id
            const badge = STATUS_LABEL[t.status]
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors ${isActive ? 'bg-emerald-900/30' : 'hover:bg-gray-800/40'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">
                      {t.customer_name || t.customer_email}
                    </p>
                    <span className="text-[9px] text-gray-500 shrink-0">{relativeTime(t.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{t.subject || '(no subject)'}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 border ${badge.bg}`}>{badge.label}</span>
                    {t.last_message_direction === 'in' && t.status !== 'resolved' && (
                      <span className="text-[9px] font-bold text-amber-300">• new</span>
                    )}
                    {t.assigned_to && (
                      <span className="text-[9px] text-gray-500 truncate">→ {t.assigned_to.split('@')[0]}</span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Detail pane */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-12 text-center">
            {threads.length === 0
              ? 'No conversations yet. Set up Resend inbound and point support@ at /api/inbound/email.'
              : 'Pick a thread on the left to see the conversation.'}
          </div>
        ) : (
          <>
            <header className="p-4 border-b border-gray-800 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-white truncate">{active.subject || '(no subject)'}</h2>
                <p className="text-xs text-gray-400 truncate">
                  {active.customer_name ? <><span className="font-bold">{active.customer_name}</span> · </> : null}
                  {active.customer_email}
                  {active.customer_id && (
                    <Link href={`/dashboard/customers/${active.customer_id}`} className="ml-2 text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                      profile <ExternalLink size={9} aria-hidden="true" />
                    </Link>
                  )}
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                <select
                  value={active.status}
                  onChange={e => patchStatus(active.id, e.target.value as Thread['status'])}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="open">Open</option>
                  <option value="pending_customer">Awaiting customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="spam">Spam</option>
                </select>
                {active.assigned_to !== currentUserEmail && (
                  <button
                    type="button"
                    onClick={() => assignToMe(active.id)}
                    className="text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2.5 py-1.5"
                  >
                    <User size={11} className="inline mr-1" aria-hidden="true" />
                    {active.assigned_to ? 'Reassign to me' : 'Assign to me'}
                  </button>
                )}
                {active.assigned_to === currentUserEmail && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/30 border border-emerald-700 rounded px-2 py-1">Assigned to you</span>
                )}
              </div>
            </header>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-gray-500">No messages yet.</p>
              ) : (
                messages.map(m => (
                  <article key={m.id} className={`max-w-2xl ${m.direction === 'in' ? 'mr-auto' : 'ml-auto'}`}>
                    <div className={`rounded-xl px-4 py-3 ${m.direction === 'in' ? 'bg-gray-800 text-gray-200' : 'bg-emerald-900/30 border border-emerald-700/40 text-emerald-50'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                        {m.direction === 'in'
                          ? (m.from_name || m.from_email || 'Customer')
                          : (m.sent_by || 'You')}
                        {' · '}
                        {new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm whitespace-pre-line">{m.body_text || stripHtml(m.body_html || '')}</p>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-800 p-4 bg-gray-950/30">
              {error && (
                <p role="alert" className="text-sm text-red-400 mb-2 inline-flex items-center gap-1.5"><AlertCircle size={13} aria-hidden="true" />{error}</p>
              )}
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value.slice(0, 8000))}
                rows={4}
                placeholder={`Write to ${active.customer_email}…`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                <label className="inline-flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={resolvedToggle}
                    onChange={e => setResolvedToggle(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600"
                  />
                  Mark resolved after sending
                </label>
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {sending
                    ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    : resolvedToggle
                      ? <CheckCircle2 size={14} aria-hidden="true" />
                      : <Send size={14} aria-hidden="true" />}
                  {sending ? 'Sending…' : resolvedToggle ? 'Send & resolve' : 'Send reply'}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').slice(0, 4000)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
