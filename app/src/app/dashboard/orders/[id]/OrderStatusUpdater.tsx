'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const statuses = [
  { value: 'pending', label: '🟡 Pending' },
  { value: 'confirmed', label: '✅ Confirmed' },
  { value: 'processing', label: '🔄 Processing' },
  { value: 'out_for_delivery', label: '🚚 Out for Delivery' },
  { value: 'delivered', label: '✅ Delivered' },
  { value: 'cancelled', label: '❌ Cancelled' },
]

export default function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function updateStatus(newStatus: string) {
    setSaving(true)
    await fetch('/api/dashboard/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status: newStatus }),
    })
    setStatus(newStatus)
    setSaving(false)
    router.refresh()
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
            } disabled:opacity-50`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
