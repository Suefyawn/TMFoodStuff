'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2 } from 'lucide-react'

interface RefundButtonProps {
  orderId: number
  orderNumber: string
  paymentMethod: string
  paymentStatus: string
  totalAed: number
  hasPaymentIntent: boolean
}

export default function RefundButton({
  orderId, orderNumber, paymentMethod, paymentStatus, totalAed, hasPaymentIntent,
}: RefundButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  // The refund flow is Stripe-only and needs a paid card order with a
  // payment intent on file. Hide the button entirely otherwise.
  if (paymentMethod !== 'card') return null
  if (!hasPaymentIntent) return null
  if (paymentStatus === 'refunded') {
    return (
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-400">
        Already refunded.
      </div>
    )
  }
  if (paymentStatus !== 'paid' && paymentStatus !== 'partially_refunded') return null

  async function handleRefund() {
    const ok = confirm(
      `Refund ${totalAed.toFixed(2)} AED for order #${orderNumber}? ` +
      `This issues a real refund on Stripe and marks the order cancelled. ` +
      `Stock decrement is NOT reversed automatically.`,
    )
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Refund failed')
        return
      }
      setDone(`Refunded ${data.amount?.toFixed?.(2) ?? totalAed.toFixed(2)} AED`)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-white font-black mb-1">Refund</h3>
          <p className="text-xs text-gray-500">
            {paymentStatus === 'partially_refunded'
              ? 'A partial refund has already been issued. Issuing again refunds the remaining balance.'
              : `Full refund: AED ${totalAed.toFixed(2)} to the card used at checkout.`}
          </p>
        </div>
        <button
          onClick={handleRefund}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/30 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
          {busy ? 'Refunding…' : 'Refund order'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {done && <p className="mt-3 text-sm text-green-400">{done}</p>}
    </div>
  )
}
