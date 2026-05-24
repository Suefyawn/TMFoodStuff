'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Loader2 } from 'lucide-react'

interface Driver {
  id: string
  email: string
  is_active: boolean
}

export default function DriverAssigner({
  orderId,
  initialDriverId,
}: {
  orderId: number
  initialDriverId: string | null
}) {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [driverId, setDriverId] = useState<string>(initialDriverId || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Pull the active driver roster — the team API already returns the
    // shape we need; we filter for role=driver client-side.
    fetch('/api/dashboard/team')
      .then(r => r.json())
      .then((data: { rows?: Array<{ id: string; email: string; role: string; is_active: boolean }> }) => {
        const list = (data.rows || []).filter(r => r.role === 'driver' && r.is_active)
        setDrivers(list)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save(next: string) {
    setSaving(true)
    setError('')
    const previous = driverId
    setDriverId(next)
    try {
      const res = await fetch('/api/dashboard/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, driver_id: next || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to assign driver')
        setDriverId(previous)
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
      setDriverId(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Truck size={14} className="text-amber-400" aria-hidden="true" />
        <h3 className="text-white font-black">Driver assignment</h3>
      </div>
      {loading ? (
        <p className="text-xs text-gray-500">Loading drivers…</p>
      ) : drivers.length === 0 ? (
        <p className="text-xs text-gray-500">
          No drivers configured. Invite one from{' '}
          <a href="/dashboard/team" className="text-green-400 hover:underline">Team</a>.
        </p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={driverId}
            onChange={e => save(e.target.value)}
            disabled={saving}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 disabled:opacity-60"
          >
            <option value="">Unassigned (any driver can claim)</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.email}</option>
            ))}
          </select>
          {saving && <Loader2 size={14} className="animate-spin text-gray-400" aria-hidden="true" />}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="text-[10px] text-gray-500 mt-2">
        Unassigned orders show up for every driver. Assigning hides the order from other drivers&apos; queues while keeping it visible to admins + staff.
      </p>
    </div>
  )
}
