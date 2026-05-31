'use client'
import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Trash2, Loader2, Mail, Check } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'

interface Recipient {
  id: number
  email: string
  name: string | null
  notify_new_order: boolean
  notify_low_stock: boolean
  notify_daily_digest: boolean
  is_active: boolean
}

type ToggleKey = 'notify_new_order' | 'notify_low_stock' | 'notify_daily_digest' | 'is_active'

const TYPE_COLS: { key: Exclude<ToggleKey, 'is_active'>; label: string; hint: string }[] = [
  { key: 'notify_new_order', label: 'New orders', hint: 'Email on every new order' },
  { key: 'notify_low_stock', label: 'Low stock', hint: 'When a product drops below its threshold' },
  { key: 'notify_daily_digest', label: 'Daily digest', hint: 'Once-a-day operations summary' },
]

export default function NotificationsClient() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ email: '', name: '', notify_new_order: true, notify_low_stock: true, notify_daily_digest: false })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/notifications')
      if (!res.ok) throw new Error(`load ${res.status}`)
      const data = await res.json()
      setRecipients(data.recipients || [])
      setLogoUrl(data.logoUrl || '')
    } catch (err) {
      console.error(err)
      setError('Could not load notification settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function saveLogo(urls: string[]) {
    const url = urls[0] || ''
    setLogoUrl(url)
    await fetch('/api/dashboard/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: url }),
    }).catch(() => setError('Could not save logo.'))
  }

  async function addRecipient() {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not add recipient.'); return }
      setRecipients(prev => [...prev, data.recipient])
      setDraft({ email: '', name: '', notify_new_order: true, notify_low_stock: true, notify_daily_digest: false })
    } finally {
      setAdding(false)
    }
  }

  async function toggle(r: Recipient, key: ToggleKey) {
    const next = !r[key]
    setRecipients(prev => prev.map(x => x.id === r.id ? { ...x, [key]: next } : x))
    const res = await fetch('/api/dashboard/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, [key]: next }),
    })
    if (!res.ok) { setError('Could not update recipient.'); load() }
  }

  async function remove(id: number) {
    setRecipients(prev => prev.filter(x => x.id !== id))
    await fetch('/api/dashboard/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => { setError('Could not remove recipient.'); load() })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Bell size={20} className="text-green-400" />
        <h1 className="text-xl font-bold text-white">Notifications</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Recipients */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="mb-1 flex items-center gap-2">
          <Mail size={16} className="text-gray-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">Staff recipients</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">Who receives operational emails, and which ones. Customer order emails always go to the customer.</p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-6"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-bold py-2 pr-3">Recipient</th>
                  {TYPE_COLS.map(c => (
                    <th key={c.key} className="font-bold py-2 px-3 text-center" title={c.hint}>{c.label}</th>
                  ))}
                  <th className="font-bold py-2 px-3 text-center">Active</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recipients.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-600 text-sm">No recipients yet. Add one below — until then alerts fall back to the ADMIN_EMAIL env var.</td></tr>
                )}
                {recipients.map(r => (
                  <tr key={r.id} className={r.is_active ? '' : 'opacity-50'}>
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-white">{r.email}</div>
                      {r.name && <div className="text-xs text-gray-500">{r.name}</div>}
                    </td>
                    {TYPE_COLS.map(c => (
                      <td key={c.key} className="py-3 px-3 text-center">
                        <CheckBox checked={r[c.key]} onChange={() => toggle(r, c.key)} />
                      </td>
                    ))}
                    <td className="py-3 px-3 text-center">
                      <CheckBox checked={r.is_active} onChange={() => toggle(r, 'is_active')} />
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => remove(r.id)} className="text-gray-600 hover:text-red-400 transition-colors" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="email"
            value={draft.email}
            onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
            placeholder="staff@email.com"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-500 outline-none"
          />
          <input
            type="text"
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Name (optional)"
            className="sm:w-44 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-500 outline-none"
          />
          <button
            onClick={addRecipient}
            disabled={adding}
            className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add
          </button>
        </div>
      </section>

      {/* Email logo */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1">Email logo</h2>
        <p className="text-xs text-gray-500 mb-4">Shown in the header of every email. Use a white or transparent PNG (it sits on a coloured band). Leave empty to use the “TM FoodStuff” wordmark.</p>
        <div className="max-w-xs">
          <ImageUploader images={logoUrl ? [logoUrl] : []} onChange={saveLogo} maxImages={1} />
        </div>
      </section>
    </div>
  )
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
        checked ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-800 border-gray-600 text-transparent hover:border-gray-500'
      }`}
      aria-pressed={checked}
    >
      <Check size={13} strokeWidth={3} />
    </button>
  )
}
