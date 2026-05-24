'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, X, Loader2, AlertCircle } from 'lucide-react'

interface OrderEditCardProps {
  orderId: number
  status: string
  initial: {
    customer_name: string | null
    customer_phone: string | null
    customer_email: string | null
    delivery_emirate: string | null
    delivery_area: string | null
    delivery_building: string | null
    delivery_makani: string | null
    delivery_slot: string | null
    delivery_date: string | null
    delivery_notes: string | null
    admin_notes: string | null
  }
}

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']

export default function OrderEditCard({ orderId, status, initial }: OrderEditCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    customer_name: initial.customer_name || '',
    customer_phone: initial.customer_phone || '',
    customer_email: initial.customer_email || '',
    delivery_emirate: initial.delivery_emirate || '',
    delivery_area: initial.delivery_area || '',
    delivery_building: initial.delivery_building || '',
    delivery_makani: initial.delivery_makani || '',
    delivery_slot: initial.delivery_slot || '',
    delivery_date: initial.delivery_date || '',
    delivery_notes: initial.delivery_notes || '',
    admin_notes: initial.admin_notes || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Settled orders can't be edited (matches the API). Render a passive note.
  if (status === 'delivered' || status === 'cancelled') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <AlertCircle size={14} aria-hidden="true" />
          Order details are locked because the order is {status}.
        </div>
      </div>
    )
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/orders/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, changes: form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black">Edit details</h3>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil size={14} aria-hidden="true" /> Edit
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Edit customer contact + delivery details. Status, payment, and items can't be changed here — use the status updater above (or refund for cancellations).
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-black mb-4">Edit details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Customer name" value={form.customer_name} onChange={v => setForm(f => ({ ...f, customer_name: v }))} />
        <Field label="Phone" value={form.customer_phone} onChange={v => setForm(f => ({ ...f, customer_phone: v }))} />
        <Field label="Email" value={form.customer_email} onChange={v => setForm(f => ({ ...f, customer_email: v }))} type="email" />
        <SelectField label="Emirate" value={form.delivery_emirate} onChange={v => setForm(f => ({ ...f, delivery_emirate: v }))} options={EMIRATES} />
        <Field label="Area" value={form.delivery_area} onChange={v => setForm(f => ({ ...f, delivery_area: v }))} />
        <Field label="Building / Villa" value={form.delivery_building} onChange={v => setForm(f => ({ ...f, delivery_building: v }))} />
        <Field label="Makani" value={form.delivery_makani} onChange={v => setForm(f => ({ ...f, delivery_makani: v }))} />
        <SelectField
          label="Delivery slot"
          value={form.delivery_slot}
          onChange={v => setForm(f => ({ ...f, delivery_slot: v }))}
          options={['morning', 'afternoon', 'evening']}
          labels={['Morning · 8-12', 'Afternoon · 12-5', 'Evening · 5-10']}
        />
        <Field label="Delivery date" value={form.delivery_date} onChange={v => setForm(f => ({ ...f, delivery_date: v }))} type="date" />
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Delivery notes (customer)</label>
          <textarea
            value={form.delivery_notes}
            onChange={e => setForm(f => ({ ...f, delivery_notes: e.target.value }))}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Internal admin notes (never shown to customer)</label>
          <textarea
            value={form.admin_notes}
            onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
            rows={3}
            placeholder="e.g. called to reschedule, duplicate of #TM-XYZ, leave at reception"
            className="w-full bg-gray-800 border border-amber-700/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-400 mt-3">{error}</p>}
      <div className="flex items-center gap-2 mt-5">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setError('') }}
          disabled={busy}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          <X size={14} aria-hidden="true" /> Cancel
        </button>
      </div>
    </div>
  )
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{props.label}</label>
      <input
        type={props.type || 'text'}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
      />
    </div>
  )
}

function SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: string[] }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{props.label}</label>
      <select
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
      >
        <option value="">—</option>
        {props.options.map((o, i) => (
          <option key={o} value={o}>{props.labels?.[i] ?? o}</option>
        ))}
      </select>
    </div>
  )
}
