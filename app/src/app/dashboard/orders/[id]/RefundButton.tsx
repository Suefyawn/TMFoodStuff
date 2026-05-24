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
  const [showPartial, setShowPartial] = useState(false)
  const [partialAmount, setPartialAmount] = useState<string>('')
  const [busy, setBusy] = useState<'full' | 'partial' | null>(null)
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

  async function issueRefund(amount?: number) {
    const isPartial = amount !== undefined
    const promptText = isPartial
      ? `Partial refund of AED ${amount?.toFixed(2)} for order #${orderNumber}? Stripe will refund this amount to the customer's card. The order will stay open.`
      : `Full refund of AED ${totalAed.toFixed(2)} for order #${orderNumber}? Stripe issues a real refund and marks the order cancelled. Stock decrement is NOT reversed automatically.`
    if (!confirm(promptText)) return
    setBusy(isPartial ? 'partial' : 'full')
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, amount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Refund failed')
        return
      }
      setDone(`Refunded AED ${data.amount?.toFixed?.(2) ?? totalAed.toFixed(2)}${data.partial ? ' (partial)' : ''}`)
      setShowPartial(false)
      setPartialAmount('')
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(null)
    }
  }

  function handlePartial() {
    const amount = parseFloat(partialAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive AED amount.')
      return
    }
    if (amount > totalAed) {
      setError(`Cannot exceed the order total (AED ${totalAed.toFixed(2)}).`)
      return
    }
    issueRefund(amount)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-white font-black mb-1">Refund</h3>
          <p className="text-xs text-gray-500">
            {paymentStatus === 'partially_refunded'
              ? 'A partial refund has already been issued. A second full refund will refund the remaining balance.'
              : `Full: AED ${totalAed.toFixed(2)} to the card used at checkout. Partial: any amount up to the order total.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPartial(v => !v)}
            disabled={!!busy}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold px-3 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            Partial…
          </button>
          <button
            onClick={() => issueRefund()}
            disabled={!!busy}
            className="inline-flex items-center gap-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/30 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {busy === 'full' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
            {busy === 'full' ? 'Refunding…' : 'Refund full'}
          </button>
        </div>
      </div>
      {showPartial && (
        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-gray-400" htmlFor="partial-amt">Refund AED</label>
          <input
            id="partial-amt"
            type="number"
            min={0.01}
            max={totalAed}
            step={0.01}
            value={partialAmount}
            onChange={e => setPartialAmount(e.target.value)}
            placeholder={totalAed.toFixed(2)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 w-32"
          />
          <button
            onClick={handlePartial}
            disabled={busy === 'partial'}
            className="inline-flex items-center gap-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/30 font-bold px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {busy === 'partial' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
            {busy === 'partial' ? 'Refunding…' : 'Issue partial refund'}
          </button>
          <button onClick={() => { setShowPartial(false); setPartialAmount(''); setError('') }} className="text-xs text-gray-500 hover:text-gray-300 font-bold">Cancel</button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {done && <p className="mt-3 text-sm text-green-400">{done}</p>}
    </div>
  )
}
