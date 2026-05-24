'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

interface RefundButtonProps {
  orderId: number
  orderNumber: string
  paymentMethod: string
  paymentStatus: string
  totalAed: number
  // What's still refundable after prior partial refunds. The order page
  // computes this from the order_refunds ledger and only renders this
  // component when remainingAed > 0, so we can default to refunding it all.
  remainingAed: number
  hasPaymentIntent: boolean
}

export default function RefundButton({
  orderId, orderNumber, paymentMethod, paymentStatus, totalAed, remainingAed, hasPaymentIntent,
}: RefundButtonProps) {
  const router = useRouter()
  const isCard = paymentMethod === 'card'
  // Card refunds need a payment intent to call Stripe; show a disabled
  // explainer instead of hiding the whole panel so the operator knows why.
  const cardMissingIntent = isCard && !hasPaymentIntent
  // Card refunds also need a paid (or partially-refunded) state.
  const cardWrongState = isCard && paymentStatus !== 'paid' && paymentStatus !== 'partially_refunded'

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>(remainingAed.toFixed(2))
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [restock, setRestock] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const confirm = useConfirm()

  async function issue() {
    const parsed = parseFloat(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a positive AED amount.')
      return
    }
    if (parsed > remainingAed + 0.001) {
      setError(`Cannot exceed remaining refundable balance (AED ${remainingAed.toFixed(2)}).`)
      return
    }
    const isFull = Math.abs(parsed - remainingAed) < 0.01
    const ok = await confirm({
      title: `${isFull ? 'Full' : 'Partial'} refund of AED ${parsed.toFixed(2)}?`,
      message: isCard
        ? `Stripe will return this to the customer's card${isFull ? ' and the order will be marked refunded' : ''}. Cannot be undone.`
        : `Records a COD refund for order #${orderNumber}. You handle the cash separately.`,
      confirmLabel: isCard ? 'Refund via Stripe' : 'Record refund',
      destructive: true,
    })
    if (!ok) return

    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          amount: parsed,
          reason: reason || undefined,
          notes: notes || undefined,
          restock,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Refund failed')
        return
      }
      setDone(`Refunded AED ${parsed.toFixed(2)}${data.partial ? ' (partial)' : ''}${restock ? ' · stock restored' : ''}`)
      setOpen(false)
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
            {cardMissingIntent
              ? 'No Stripe payment intent on this order — refund manually in Stripe Dashboard.'
              : cardWrongState
                ? `Card order is in "${paymentStatus}" state — cannot refund through Stripe yet.`
                : isCard
                  ? `Refunds go back to the card used at checkout. Remaining: AED ${remainingAed.toFixed(2)} of ${totalAed.toFixed(2)}.`
                  : `Records a COD refund (cash handled separately). Remaining: AED ${remainingAed.toFixed(2)} of ${totalAed.toFixed(2)}.`}
          </p>
        </div>
        {!cardMissingIntent && !cardWrongState && (
          <button
            onClick={() => setOpen(v => !v)}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/30 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <RotateCcw size={16} aria-hidden="true" />
            {open ? 'Cancel' : 'New refund'}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="refund-amount" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Amount (AED)
              </label>
              <input
                id="refund-amount"
                type="number"
                min={0.01}
                max={remainingAed}
                step={0.01}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setAmount(remainingAed.toFixed(2))}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-300"
                >
                  Full ({remainingAed.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((remainingAed / 2).toFixed(2))}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-300"
                >
                  Half
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="refund-reason" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Reason
              </label>
              <select
                id="refund-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              >
                <option value="">Select a reason…</option>
                <option value="Customer requested">Customer requested</option>
                <option value="Damaged in transit">Damaged in transit</option>
                <option value="Out of stock">Out of stock after order</option>
                <option value="Quality issue">Quality issue</option>
                <option value="Duplicate order">Duplicate order</option>
                <option value="Fraudulent charge">Fraudulent charge</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="refund-notes" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Internal notes (optional)
            </label>
            <input
              id="refund-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 2 mangoes bruised, customer kept the rest"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={restock}
              onChange={e => setRestock(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            Restock the order's items
          </label>

          <button
            onClick={issue}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
            {busy ? 'Processing…' : isCard ? 'Issue refund via Stripe' : 'Record refund'}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {done && <p className="mt-3 text-sm text-green-400">{done}</p>}
    </div>
  )
}
