'use client'
import { useState, useEffect, useCallback } from 'react'
import { Mail, Loader2, RefreshCw } from 'lucide-react'

interface EmailEvent {
  id: number
  resend_email_id: string | null
  event_type: string
  recipient: string | null
  subject: string | null
  occurred_at: string | null
  created_at: string
}

// Visual treatment per Resend event type.
const STYLES: Record<string, { label: string; cls: string }> = {
  'email.sent': { label: 'Sent', cls: 'bg-gray-700 text-gray-200' },
  'email.delivered': { label: 'Delivered', cls: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/40' },
  'email.delivery_delayed': { label: 'Delayed', cls: 'bg-amber-600/20 text-amber-300 border border-amber-600/40' },
  'email.opened': { label: 'Opened', cls: 'bg-blue-600/20 text-blue-300 border border-blue-600/40' },
  'email.clicked': { label: 'Clicked', cls: 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/40' },
  'email.bounced': { label: 'Bounced', cls: 'bg-red-600/20 text-red-300 border border-red-600/40' },
  'email.complained': { label: 'Complaint', cls: 'bg-orange-600/20 text-orange-300 border border-orange-600/40' },
  'email.failed': { label: 'Failed', cls: 'bg-red-600/20 text-red-300 border border-red-600/40' },
  'email.suppressed': { label: 'Suppressed', cls: 'bg-gray-600/30 text-gray-300' },
  'email.received': { label: 'Inbound', cls: 'bg-teal-600/20 text-teal-300 border border-teal-600/40' },
}

function badge(type: string) {
  return STYLES[type] || { label: type.replace(/^email\./, ''), cls: 'bg-gray-700 text-gray-300' }
}

const HEADLINE = [
  { key: 'email.delivered', label: 'Delivered', color: 'text-emerald-400' },
  { key: 'email.opened', label: 'Opened', color: 'text-blue-400' },
  { key: 'email.bounced', label: 'Bounced', color: 'text-red-400' },
  { key: 'email.complained', label: 'Complaints', color: 'text-orange-400' },
  { key: 'email.failed', label: 'Failed', color: 'text-red-400' },
]

export default function EmailsClient() {
  const [events, setEvents] = useState<EmailEvent[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = filter ? `?type=${encodeURIComponent(filter)}` : ''
      const res = await fetch(`/api/dashboard/email-events${qs}`)
      if (!res.ok) throw new Error(`load ${res.status}`)
      const data = await res.json()
      setEvents(data.events || [])
      setCounts(data.counts7d || {})
    } catch (err) {
      console.error('[emails] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Email status</h1>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* 7-day headline counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {HEADLINE.map(h => (
          <div key={h.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`text-2xl font-bold ${h.color}`}>{counts[h.key] ?? 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">{h.label} · 7d</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${filter === '' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>All</button>
        {Object.keys(STYLES).map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${filter === t ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {badge(t).label}
          </button>
        ))}
      </div>

      {/* Event feed */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm p-6"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">
            No email events yet. They appear here as Resend reports delivery status for sent mail.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-800">
                  <th className="text-left font-bold py-3 px-4">Status</th>
                  <th className="text-left font-bold py-3 px-4">Recipient</th>
                  <th className="text-left font-bold py-3 px-4 hidden sm:table-cell">Subject</th>
                  <th className="text-right font-bold py-3 px-4">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {events.map(ev => {
                  const b = badge(ev.event_type)
                  const when = ev.occurred_at || ev.created_at
                  return (
                    <tr key={ev.id}>
                      <td className="py-3 px-4"><span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span></td>
                      <td className="py-3 px-4 text-gray-200 break-all">{ev.recipient || '—'}</td>
                      <td className="py-3 px-4 text-gray-400 hidden sm:table-cell truncate max-w-[260px]">{ev.subject || '—'}</td>
                      <td className="py-3 px-4 text-right text-gray-500 whitespace-nowrap">{new Date(when).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'short', timeStyle: 'short' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
