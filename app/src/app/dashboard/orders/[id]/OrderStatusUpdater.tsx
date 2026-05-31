'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Loader2, Truck, Package, XCircle, AlertCircle } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

const statuses = [
  { value: 'pending',          label: 'Pending',          Icon: Clock,        accent: 'text-yellow-400' },
  { value: 'confirmed',        label: 'Confirmed',        Icon: CheckCircle2, accent: 'text-blue-400' },
  { value: 'processing',       label: 'Processing',       Icon: Loader2,      accent: 'text-purple-400' },
  { value: 'out_for_delivery', label: 'Out for Delivery', Icon: Truck,        accent: 'text-orange-400' },
  { value: 'delivered',        label: 'Delivered',        Icon: Package,      accent: 'text-emerald-400' },
  { value: 'cancelled',        label: 'Cancelled',        Icon: XCircle,      accent: 'text-red-400' },
]

const CONFIRM_STATUSES = ['delivered']

// Canonical reasons covering the bulk of why orders get cancelled in
// practice. Operators can pick one or type their own — the value is
// stored verbatim on orders.cancellation_reason.
const CANCELLATION_REASONS = [
  'Customer requested',
  'Out of stock',
  'Payment failed',
  'Cannot deliver to address',
  'Duplicate order',
  'Fraud suspected',
  'Other',
]

export default function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Customer requested')
  const [cancelNote, setCancelNote] = useState('')
  const router = useRouter()
  const confirm = useConfirm()

  async function updateStatus(newStatus: string, reason?: string) {
    if (newStatus === status) return
    if (newStatus === 'cancelled') {
      // Open the cancellation modal to capture WHY rather than firing
      // straight away. The modal calls back into updateStatus once the
      // operator picks a reason.
      setCancelOpen(true)
      return
    }
    if (CONFIRM_STATUSES.includes(newStatus)) {
      const label = statuses.find(s => s.value === newStatus)?.label ?? newStatus
      const ok = await confirm({
        title: `Mark order as "${label}"?`,
        message: 'This is hard to undo and triggers customer notifications.',
        confirmLabel: 'Mark ' + label,
      })
      if (!ok) return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus, cancellation_reason: reason }),
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

  async function submitCancel() {
    const composed = cancelNote.trim() ? `${cancelReason} — ${cancelNote.trim()}` : cancelReason
    setCancelOpen(false)
    await updateStatus('cancelled', composed)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-bold mb-4">Order Status</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => {
          const active = status === s.value
          return (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <s.Icon size={14} className={active ? 'text-white' : s.accent} aria-hidden="true" />
              {s.label}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-3 text-sm text-red-400 inline-flex items-start gap-1.5"><AlertCircle size={14} className="mt-0.5" aria-hidden="true" />{error}</p>}
      {saving && <p className="mt-2 text-xs text-gray-500">Saving...</p>}

      {/* Cancellation reason capture. Inline rather than a modal so the
          operator can see the order context behind it. */}
      {cancelOpen && (
        <div className="mt-4 pt-4 border-t border-red-800/40 space-y-3">
          <p className="text-sm font-bold text-red-300">Cancelling this order — why?</p>
          <div className="flex flex-wrap gap-1.5">
            {CANCELLATION_REASONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setCancelReason(r)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  cancelReason === r ? 'bg-red-900/40 border-red-600 text-red-200' : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={cancelNote}
            onChange={e => setCancelNote(e.target.value.slice(0, 400))}
            placeholder="Extra notes (optional, e.g. 'mango out of stock, offered refund')"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitCancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-60"
            >
              <XCircle size={14} aria-hidden="true" /> Cancel order
            </button>
            <button
              type="button"
              onClick={() => { setCancelOpen(false); setCancelNote('') }}
              disabled={saving}
              className="text-sm font-bold text-gray-400 hover:text-white px-3 py-2"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
