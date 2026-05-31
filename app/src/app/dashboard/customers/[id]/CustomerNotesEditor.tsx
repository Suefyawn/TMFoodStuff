'use client'
import { useState } from 'react'
import { StickyNote, Loader2, Check } from 'lucide-react'

export default function CustomerNotesEditor({ customerId, initial }: { customerId: number; initial: string }) {
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const dirty = value !== initial

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/dashboard/customers/${customerId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: value }),
      })
      if (res.ok) setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <h2 className="text-white font-bold inline-flex items-center gap-2">
          <StickyNote size={14} className="text-amber-400" aria-hidden="true" /> Internal notes
        </h2>
        <p className="text-[10px] text-gray-500">Only visible to team members.</p>
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={3}
        placeholder="VIP, prefers afternoon delivery, allergic to nuts, etc."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
      />
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-2 inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
        >
          {saving ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : null}
          Save notes
        </button>
      )}
      {!dirty && savedAt && Date.now() - savedAt < 5000 && (
        <p className="mt-2 text-xs text-green-400 inline-flex items-center gap-1"><Check size={11} aria-hidden="true" /> Saved</p>
      )}
    </section>
  )
}
