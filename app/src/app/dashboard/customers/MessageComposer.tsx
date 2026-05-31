'use client'
import { useState } from 'react'
import { Mail, MessageCircle, Send, X, Loader2 } from 'lucide-react'

interface Props {
  email?: string | null
  phone?: string | null
  onClose: () => void
}

// Inline modal for sending an ad-hoc message to a customer over email and/or
// SMS. Used from the dashboard customers + order pages. The API audit-logs
// every send so the trail survives even after the message has been delivered.
export default function MessageComposer({ email, phone, onClose }: Props) {
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean }>({
    email: !!email,
    sms: !!phone,
  })
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string, string> | null>(null)

  async function send() {
    setError('')
    setResult(null)
    if (!channels.email && !channels.sms) {
      setError('Pick at least one channel.')
      return
    }
    if (!body.trim()) {
      setError('Message body is required.')
      return
    }
    setBusy(true)
    try {
      const picked = (Object.entries(channels) as Array<['email' | 'sms', boolean]>)
        .filter(([, v]) => v)
        .map(([k]) => k)
      const res = await fetch('/api/dashboard/customers/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, subject, body, channels: picked }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send.')
        return
      }
      setResult(data.results || {})
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Message customer"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div onClick={e => e.stopPropagation()} className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Message customer</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-white">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Channels */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Send via</p>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${channels.email ? 'border-emerald-600/50 bg-emerald-600/10' : 'border-gray-700 bg-gray-800'} ${!email ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={e => setChannels(c => ({ ...c, email: e.target.checked }))}
                  disabled={!email}
                  className="w-4 h-4 accent-emerald-600"
                />
                <Mail size={14} className="text-gray-400" aria-hidden="true" />
                <span className="text-sm text-gray-200">Email</span>
                <span className="text-xs text-gray-500 ml-auto truncate max-w-[200px]">{email || 'no address on file'}</span>
              </label>
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${channels.sms ? 'border-emerald-600/50 bg-emerald-600/10' : 'border-gray-700 bg-gray-800'} ${!phone ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={e => setChannels(c => ({ ...c, sms: e.target.checked }))}
                  disabled={!phone}
                  className="w-4 h-4 accent-emerald-600"
                />
                <MessageCircle size={14} className="text-gray-400" aria-hidden="true" />
                <span className="text-sm text-gray-200">SMS / WhatsApp</span>
                <span className="text-xs text-gray-500 ml-auto truncate max-w-[200px]">{phone || 'no phone on file'}</span>
              </label>
            </div>
          </div>

          {/* Subject (email only) */}
          {channels.email && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5" htmlFor="msg-subject">Email subject</label>
              <input
                id="msg-subject"
                value={subject}
                onChange={e => setSubject(e.target.value.slice(0, 140))}
                placeholder="A note from TM FoodStuff"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5" htmlFor="msg-body">Message</label>
            <textarea
              id="msg-body"
              value={body}
              onChange={e => setBody(e.target.value.slice(0, 4000))}
              rows={6}
              placeholder="Hi {customer}, …"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-gray-500 mt-1 text-right">{body.length}/4000</p>
          </div>

          {error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
          {result && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 space-y-1">
              {Object.entries(result).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500">{k}</span>
                  <span className={
                    v === 'sent' ? 'text-emerald-400' :
                    v === 'skipped' ? 'text-yellow-400' : 'text-red-400'
                  }>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-800">
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm font-bold px-3 py-2 rounded-lg">Close</button>
          <button
            onClick={send}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
            {busy ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
