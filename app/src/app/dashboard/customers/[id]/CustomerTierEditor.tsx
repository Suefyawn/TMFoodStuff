'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'

const TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const

export default function CustomerTierEditor({ customerId, current }: { customerId: number; current: string }) {
  const router = useRouter()
  const [tier, setTier] = useState(current)
  const [saving, setSaving] = useState(false)

  async function update(next: string) {
    if (next === tier) return
    setSaving(true)
    setTier(next)
    try {
      const res = await fetch(`/api/dashboard/customers/${customerId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: next }),
      })
      if (res.ok) router.refresh()
      else setTier(current)
    } catch {
      setTier(current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <Shield size={11} className="text-gray-400" aria-hidden="true" />
      <span className="text-gray-500 font-bold uppercase tracking-wider">Tier</span>
      <select
        value={tier}
        disabled={saving}
        onChange={e => update(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 capitalize"
      >
        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      {saving && <Loader2 size={11} className="animate-spin text-gray-400" aria-hidden="true" />}
    </label>
  )
}
