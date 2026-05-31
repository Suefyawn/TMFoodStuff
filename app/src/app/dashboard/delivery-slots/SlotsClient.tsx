'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, AlertCircle, CheckCircle2, GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

interface Slot {
  id: number
  key: string
  label_en: string
  label_ar: string
  time_label_en: string
  time_label_ar: string
  cutoff_hour: number | null
  max_orders_per_day: number | null
  day_of_week_mask: number
  position: number
  is_active: boolean
}

// Sunday=0 … Saturday=6. UAE work week starts Monday in practice, but
// Sun-first matches the JS Date.getDay() convention so we keep it consistent.
const DAYS: Array<{ idx: number; label: string }> = [
  { idx: 0, label: 'Sun' },
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
]

function dayMaskLabel(mask: number): string {
  if (mask === 127) return 'Every day'
  if (mask === 0) return 'Never'
  return DAYS.filter(d => mask & (1 << d.idx)).map(d => d.label).join(', ')
}

export default function SlotsClient({ initial }: { initial: Slot[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [rows, setRows] = useState<Slot[]>(initial)
  const [editing, setEditing] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(slot: Partial<Slot> & { id?: number }) {
    setBusy(true)
    setError('')
    try {
      const isCreate = !slot.id
      const res = await fetch('/api/dashboard/delivery-slots', {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      if (isCreate) setRows(r => [...r, data.slot])
      else setRows(r => r.map(s => s.id === data.slot.id ? data.slot : s))
      setEditing(null)
      setCreating(false)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(slot: Slot) {
    const ok = await confirm({
      title: `Deactivate "${slot.label_en}"?`,
      message: `It will stop appearing at checkout immediately. Existing orders + subscriptions on this slot are not affected. You can reactivate at any time.`,
      confirmLabel: 'Deactivate',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await fetch('/api/dashboard/delivery-slots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slot.id }),
      })
      if (res.ok) {
        setRows(r => r.map(s => s.id === slot.id ? { ...s, is_active: false } : s))
      }
    } finally {
      setBusy(false)
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= rows.length) return
    const next = [...rows]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    // Persist new positions for the two affected rows.
    next.forEach((s, i) => { s.position = i })
    setRows(next)
    void save({ id: next[idx].id, position: next[idx].position })
    void save({ id: next[newIdx].id, position: next[newIdx].position })
  }

  return (
    <>
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((s, i) => (
          <SlotCard
            key={s.id}
            slot={s}
            editing={editing === s.id}
            busy={busy}
            onEdit={() => setEditing(s.id)}
            onCancel={() => setEditing(null)}
            onSave={save}
            onDeactivate={() => deactivate(s)}
            onActivate={() => save({ id: s.id, is_active: true })}
            onMoveUp={i > 0 ? () => move(i, -1) : undefined}
            onMoveDown={i < rows.length - 1 ? () => move(i, 1) : undefined}
          />
        ))}
      </div>

      {creating ? (
        <SlotCard
          slot={emptySlot()}
          editing
          busy={busy}
          onCancel={() => setCreating(false)}
          onSave={save}
          isNew
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-700 text-gray-300 font-bold py-3 rounded-xl text-sm"
        >
          <Plus size={14} aria-hidden="true" /> Add a slot
        </button>
      )}
    </>
  )
}

function emptySlot(): Slot {
  return {
    id: 0,
    key: '',
    label_en: '',
    label_ar: '',
    time_label_en: '',
    time_label_ar: '',
    cutoff_hour: null,
    max_orders_per_day: null,
    day_of_week_mask: 127,
    position: 99,
    is_active: true,
  }
}

interface CardProps {
  slot: Slot
  editing: boolean
  busy: boolean
  isNew?: boolean
  onEdit?: () => void
  onCancel: () => void
  onSave: (slot: Partial<Slot> & { id?: number }) => void
  onDeactivate?: () => void
  onActivate?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

function SlotCard({ slot, editing, busy, isNew, onEdit, onCancel, onSave, onDeactivate, onActivate, onMoveUp, onMoveDown }: CardProps) {
  const [draft, setDraft] = useState<Slot>(slot)

  function toggleDay(idx: number) {
    const bit = 1 << idx
    setDraft(d => ({ ...d, day_of_week_mask: d.day_of_week_mask ^ bit }))
  }

  function submit() {
    const payload: Partial<Slot> & { id?: number } = {
      ...(slot.id ? { id: slot.id } : {}),
      ...(isNew ? { key: draft.key.trim().toLowerCase() } : {}),
      label_en: draft.label_en.trim(),
      label_ar: draft.label_ar.trim(),
      time_label_en: draft.time_label_en.trim(),
      time_label_ar: draft.time_label_ar.trim(),
      cutoff_hour: draft.cutoff_hour,
      max_orders_per_day: draft.max_orders_per_day,
      day_of_week_mask: draft.day_of_week_mask,
      is_active: draft.is_active,
    }
    onSave(payload)
  }

  if (!editing) {
    return (
      <article className={`bg-gray-900 border rounded-xl p-4 ${slot.is_active ? 'border-gray-800' : 'border-gray-800 opacity-60'}`}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={onMoveUp} disabled={!onMoveUp} className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronUp size={14} aria-hidden="true" /></button>
            <button type="button" onClick={onMoveDown} disabled={!onMoveDown} className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDown size={14} aria-hidden="true" /></button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-white text-base">{slot.label_en}</h3>
              <span className="text-xs text-gray-500 font-mono">{slot.key}</span>
              {!slot.is_active && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">inactive</span>}
            </div>
            <p className="text-xs text-gray-400">{slot.time_label_en} · {slot.label_ar} ({slot.time_label_ar})</p>
            <div className="flex gap-3 flex-wrap mt-2 text-[11px] text-gray-500">
              <span>Cutoff: <span className="text-gray-300 font-bold">{slot.cutoff_hour != null ? `${slot.cutoff_hour}:00` : 'next-day only'}</span></span>
              <span>Capacity: <span className="text-gray-300 font-bold">{slot.max_orders_per_day != null ? `${slot.max_orders_per_day}/day` : 'unlimited'}</span></span>
              <span>Days: <span className="text-gray-300 font-bold">{dayMaskLabel(slot.day_of_week_mask)}</span></span>
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={onEdit} className="text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5">Edit</button>
            {slot.is_active
              ? <button type="button" onClick={onDeactivate} disabled={busy} className="text-xs font-bold text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded-lg px-3 py-1.5"><Trash2 size={11} className="inline mr-1" aria-hidden="true" />Hide</button>
              : <button type="button" onClick={onActivate} disabled={busy} className="text-xs font-bold text-green-300 bg-green-900/20 hover:bg-green-900/40 border border-green-700/50 rounded-lg px-3 py-1.5"><CheckCircle2 size={11} className="inline mr-1" aria-hidden="true" />Show</button>}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="bg-gray-900 border-2 border-green-700/60 rounded-xl p-5 space-y-4">
      {isNew && (
        <div>
          <label htmlFor={`key-${slot.id}`} className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Slot key (immutable)</label>
          <input
            id={`key-${slot.id}`}
            type="text"
            value={draft.key}
            onChange={e => setDraft({ ...draft, key: e.target.value })}
            placeholder="e.g. express_1h"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 font-mono"
          />
          <p className="text-[10px] text-gray-500 mt-1">Lowercase, digits, underscores. Used in orders + subscriptions and never changes after creation.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldInput label="Label (EN)" value={draft.label_en} onChange={v => setDraft({ ...draft, label_en: v })} placeholder="Morning" />
        <FieldInput label="Label (AR)" value={draft.label_ar} onChange={v => setDraft({ ...draft, label_ar: v })} placeholder="الصباح" />
        <FieldInput label="Time window (EN)" value={draft.time_label_en} onChange={v => setDraft({ ...draft, time_label_en: v })} placeholder="8AM - 12PM" />
        <FieldInput label="Time window (AR)" value={draft.time_label_ar} onChange={v => setDraft({ ...draft, time_label_ar: v })} placeholder="8 ص - 12 ظ" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`cutoff-${slot.id}`} className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Same-day cutoff hour (0-23)</label>
          <input
            id={`cutoff-${slot.id}`}
            type="number"
            min={0} max={23}
            value={draft.cutoff_hour ?? ''}
            onChange={e => setDraft({ ...draft, cutoff_hour: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="e.g. 7 = same-day only if ordered before 7AM"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
          />
          <p className="text-[10px] text-gray-500 mt-1">Leave blank to disable same-day delivery on this slot.</p>
        </div>
        <div>
          <label htmlFor={`cap-${slot.id}`} className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Max orders per day</label>
          <input
            id={`cap-${slot.id}`}
            type="number"
            min={1}
            value={draft.max_orders_per_day ?? ''}
            onChange={e => setDraft({ ...draft, max_orders_per_day: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="Leave blank for unlimited"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Available on</p>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map(d => {
            const on = (draft.day_of_week_mask & (1 << d.idx)) !== 0
            return (
              <button
                key={d.idx}
                type="button"
                onClick={() => toggleDay(d.idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  on ? 'bg-green-900/40 border-green-600 text-green-200' : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={e => setDraft({ ...draft, is_active: e.target.checked })}
          className="w-4 h-4 accent-green-600"
        />
        Show this slot at checkout
      </label>

      <div className="flex gap-2 pt-2 border-t border-gray-800">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
          {isNew ? 'Create slot' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-bold text-gray-400 hover:text-white px-4 py-2">Cancel</button>
      </div>
    </article>
  )
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
      />
    </div>
  )
}
