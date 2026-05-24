'use client'
import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

// Manually triggers /api/dashboard/digest so the admin can verify the daily
// digest email renders correctly without waiting for the 02:30 UTC cron.
export default function DigestPreviewButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function trigger() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/dashboard/digest', { method: 'POST' })
      const data = await res.json()
      if (res.ok) setMsg({ type: 'ok', text: 'Digest sent to ADMIN_EMAIL.' })
      else setMsg({ type: 'err', text: data.error === 'no_resend' ? 'Resend API key not configured.' : (data.error || 'Failed') })
    } catch {
      setMsg({ type: 'err', text: 'Network error.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={trigger}
        disabled={busy}
        className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
      >
        {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Send size={12} aria-hidden="true" />}
        Send daily digest now
      </button>
      {msg && (
        <span className={`text-xs ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</span>
      )}
    </div>
  )
}
