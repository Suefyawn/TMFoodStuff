'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const statuses = [
  { value: 'pending', label: '🟡 Pending' },
  { value: 'confirmed', label: '✅ Confirmed' },
  { value: 'processing', label: '🔄 Processing' },
  { value: 'out_for_delivery', label: '🚚 Out for Delivery' },
  { value: 'delivered', label: '📦 Delivered' },
  { value: 'cancelled', label: '❌ Cancelled' },
]

const CONFIRM_STATUSES = ['delivered', 'cancelled']

export default function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return
    if (CONFIRM_STATUSES.includes(newStatus)) {
      const label = statuses.find(s => s.value === newStatus)?.label ?? newStatus
      if (!confirm(`Mark this order as "${label}"? This cannot be easily undone.`)) return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update status')
        return
      }
      setStatus(newStatus)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-black mb-4">Order Status</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              status === s.value
                ? 'bg-green-600 text-white ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving && status !== s.value ? s.label : s.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {saving && <p className="mt-2 text-xs text-gray-500">Saving...</p>}
    </div>
  )
}
