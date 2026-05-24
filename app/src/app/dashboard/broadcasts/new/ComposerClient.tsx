'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, MessageCircle, Send, Loader2, AlertCircle, CheckCircle2, Eye, Users } from 'lucide-react'

type Channel = 'email' | 'sms' | 'both'
type Audience = 'all' | 'recent_60d' | 'lapsed_60d'

interface PreviewData {
  total: number
  reachable_email: number
  reachable_sms: number
  sample: Array<{ name: string | null; email: string | null; phone: string | null }>
}

export default function ComposerClient() {
  const router = useRouter()
  const [channel, setChannel] = useState<Channel>('email')
  const [audience, setAudience] = useState<Audience>('all')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [result, setResult] = useState<{ email: { ok: number; fail: number }; sms: { ok: number; fail: number }; total_targeted: number } | null>(null)

  // Auto-refresh preview when channel or audience changes — gives the admin
  // instant feedback on reach as they tweak the audience.
  useEffect(() => {
    let cancelled = false
    setPreviewing(true)
    setPreviewError('')
    fetch('/api/dashboard/broadcasts/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, audience }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.error) setPreviewError(data.error)
        else setPreview(data)
      })
      .catch(() => { if (!cancelled) setPreviewError('Could not load preview') })
      .finally(() => { if (!cancelled) setPreviewing(false) })
    return () => { cancelled = true }
  }, [channel, audience])

  const wantsEmail = channel === 'email' || channel === 'both'
  const wantsSms = channel === 'sms' || channel === 'both'
  const reachable = (wantsEmail ? (preview?.reachable_email ?? 0) : 0) + (wantsSms ? (preview?.reachable_sms ?? 0) : 0)

  function validate(): string | null {
    if (!body.trim()) return 'Message body is required.'
    if (body.length > 4000) return 'Body too long (4000 chars max).'
    if (wantsEmail && !subject.trim()) return 'Email subject is required for email broadcasts.'
    if (reachable === 0) return 'No recipients reachable for this audience/channel combo.'
    return null
  }

  async function doSend() {
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/dashboard/broadcasts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, audience, subject, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Send failed')
        return
      }
      setResult({
        email: data.email,
        sms: data.sms,
        total_targeted: data.total_targeted,
      })
    } catch {
      setSendError('Network error')
    } finally {
      setSending(false)
    }
  }

  if (result) {
    const ok = result.email.ok + result.sms.ok
    const fail = result.email.fail + result.sms.fail
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={28} className="text-green-700" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Broadcast sent</h1>
        <p className="text-gray-400 text-sm mb-6">{ok} sent · {fail} failed · {result.total_targeted} targeted</p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left text-sm text-gray-300 space-y-2 mb-6">
          {(result.email.ok + result.email.fail) > 0 && (
            <div className="flex justify-between"><span>Email</span><span className="font-mono"><span className="text-green-400">{result.email.ok}</span>{result.email.fail > 0 && <span className="text-red-400"> / {result.email.fail} failed</span>}</span></div>
          )}
          {(result.sms.ok + result.sms.fail) > 0 && (
            <div className="flex justify-between"><span>SMS / WhatsApp</span><span className="font-mono"><span className="text-green-400">{result.sms.ok}</span>{result.sms.fail > 0 && <span className="text-red-400"> / {result.sms.fail} failed</span>}</span></div>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Link href="/dashboard/broadcasts" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl">View history</Link>
          <button onClick={() => router.refresh()} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl">Send another</button>
        </div>
      </div>
    )
  }

  const validationError = validate()

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <Link href="/dashboard/broadcasts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white">
        <ArrowLeft size={14} aria-hidden="true" /> Broadcasts
      </Link>

      <header>
        <h1 className="text-2xl font-black text-white">New broadcast</h1>
        <p className="text-gray-500 text-sm">Send an announcement to customers via email and/or SMS.</p>
      </header>

      {/* Channel */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Channels</p>
        <div className="grid grid-cols-3 gap-2">
          {(['email', 'sms', 'both'] as Channel[]).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-xs font-bold transition-colors ${
                channel === c ? 'border-green-600 bg-green-900/30 text-green-200' : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {c === 'email' && <Mail size={16} aria-hidden="true" />}
              {c === 'sms' && <MessageCircle size={16} aria-hidden="true" />}
              {c === 'both' && (
                <div className="flex gap-1">
                  <Mail size={13} aria-hidden="true" />
                  <MessageCircle size={13} aria-hidden="true" />
                </div>
              )}
              <span>{c === 'both' ? 'Both' : c.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Audience</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            ['all', 'Everyone', 'All customers who ever ordered'],
            ['recent_60d', 'Recent (60d)', 'Ordered in the last 60 days'],
            ['lapsed_60d', 'Lapsed (60d+)', "Haven't ordered in over 60 days"],
          ] as Array<[Audience, string, string]>).map(([val, label, desc]) => (
            <button
              key={val}
              type="button"
              onClick={() => setAudience(val)}
              className={`text-left rounded-xl border-2 p-3 transition-colors ${
                audience === val ? 'border-green-600 bg-green-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        {/* Reach preview */}
        <div className="mt-4 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Eye size={13} aria-hidden="true" />
            {previewing ? 'Loading…' : previewError ? <span className="text-red-400">{previewError}</span> : (
              <span>
                <span className="font-bold text-white">{preview?.total ?? 0}</span> customer{preview?.total === 1 ? '' : 's'} match
                {(channel === 'email' || channel === 'both') && <> · <span className="font-bold text-blue-300">{preview?.reachable_email ?? 0}</span> email</>}
                {(channel === 'sms' || channel === 'both') && <> · <span className="font-bold text-rose-300">{preview?.reachable_sms ?? 0}</span> SMS</>}
              </span>
            )}
          </div>
          {preview && preview.sample.length > 0 && (
            <span className="text-[10px] text-gray-500 font-mono truncate hidden sm:inline">
              e.g. {preview.sample.map(s => s.email || s.phone || s.name).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {wantsEmail && (
          <div>
            <label htmlFor="subject" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value.slice(0, 140))}
              placeholder="A note from TM FoodStuff"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
          </div>
        )}
        <div>
          <label htmlFor="body" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Message</label>
          <textarea
            id="body"
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 4000))}
            rows={8}
            placeholder="Hi! We're running a special weekend offer…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
          />
          <p className="text-[10px] text-gray-500 mt-1 text-right">{body.length}/4000</p>
        </div>
      </div>

      {sendError && (
        <div className="bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{sendError}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-gray-500">{validationError || 'Ready to send.'}</p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!!validationError}
          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-xl"
        >
          <Send size={14} aria-hidden="true" /> Review &amp; send
        </button>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !sending && setConfirmOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div onClick={e => e.stopPropagation()} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                <Users size={18} className="text-amber-300" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg leading-tight">Send broadcast?</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Will message <span className="text-white font-bold">{reachable}</span> customer{reachable === 1 ? '' : 's'} via {wantsEmail && 'email'}{wantsEmail && wantsSms && ' + '}{wantsSms && 'SMS'}. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
              {wantsEmail && subject && <p className="text-xs text-gray-400 mb-1"><span className="text-gray-500">Subject: </span>{subject}</p>}
              <p className="text-sm text-gray-200 whitespace-pre-line">{body}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !sending && setConfirmOpen(false)}
                disabled={sending}
                className="text-sm font-bold text-gray-400 hover:text-white px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doSend}
                disabled={sending}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl"
              >
                {sending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
                {sending ? 'Sending…' : `Send to ${reachable}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
