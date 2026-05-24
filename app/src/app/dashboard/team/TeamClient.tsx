'use client'
import { useState } from 'react'
import { UserPlus, Loader2, AlertCircle, Trash2, Shield, ShieldCheck, Truck, CircleSlash } from 'lucide-react'
import { useConfirm } from '@/components/ConfirmDialog'

interface TeamMember {
  id: number
  email: string
  role: 'admin' | 'staff' | 'driver'
  is_active: boolean
  created_at: string
}

interface Props {
  initial: TeamMember[]
  currentEmail: string
}

const ROLE_LABEL: Record<TeamMember['role'], string> = {
  admin: 'Admin — full access incl. refunds & team',
  staff: 'Staff — orders, products, customers, reviews',
  driver: 'Driver — delivery queue only',
}

const ROLE_BADGE: Record<TeamMember['role'], { bg: string; text: string; icon: typeof Shield }> = {
  admin: { bg: 'bg-purple-900/40 border-purple-700 text-purple-200', text: 'admin', icon: ShieldCheck },
  staff: { bg: 'bg-blue-900/40 border-blue-700 text-blue-200', text: 'staff', icon: Shield },
  driver: { bg: 'bg-amber-900/40 border-amber-700 text-amber-200', text: 'driver', icon: Truck },
}

export default function TeamClient({ initial, currentEmail }: Props) {
  const [rows, setRows] = useState(initial)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamMember['role']>('staff')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirm = useConfirm()

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      // Prepend if new, replace if email already existed (upsert).
      setRows(prev => {
        const existing = prev.findIndex(r => r.email === data.row.email)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = { ...next[existing], ...data.row }
          return next
        }
        return [{ ...data.row, created_at: new Date().toISOString() }, ...prev]
      })
      setEmail('')
      setRole('staff')
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  async function update(id: number, patch: Partial<Pick<TeamMember, 'role' | 'is_active'>>) {
    setError('')
    const prev = rows
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r))
    try {
      const res = await fetch('/api/dashboard/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Update failed')
        setRows(prev)
      }
    } catch {
      setRows(prev)
      setError('Network error')
    }
  }

  async function remove(id: number, who: string) {
    const ok = await confirm({
      title: `Remove ${who}?`,
      message: 'They will lose dashboard access immediately. You can re-invite by email any time.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (!ok) return
    const prev = rows
    setRows(rs => rs.filter(r => r.id !== id))
    try {
      const res = await fetch('/api/dashboard/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Delete failed')
        setRows(prev)
      }
    } catch {
      setRows(prev)
      setError('Network error')
    }
  }

  return (
    <>
      {/* Invite form */}
      <form onSubmit={add} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Invite team member</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as TeamMember['role'])}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500"
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="driver">Driver</option>
          </select>
          <button
            type="submit"
            disabled={busy || !email}
            className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-lg text-sm"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <UserPlus size={14} aria-hidden="true" />}
            Invite
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2">{ROLE_LABEL[role]}</p>
        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-start gap-1.5">
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <p className="text-[10px] text-gray-600 mt-3">
          The invitee signs in at /dashboard/login with magic link / OAuth — their Supabase Auth row is created on first sign-in.
        </p>
      </form>

      {/* Members list */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">{rows.length} member{rows.length === 1 ? '' : 's'}</p>
        <ul className="divide-y divide-gray-800">
          {rows.map(m => {
            const isSelf = m.email === currentEmail
            const badge = ROLE_BADGE[m.role]
            return (
              <li key={m.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{m.email}</p>
                    {isSelf && <span className="text-[10px] font-bold uppercase tracking-wider text-green-300 bg-green-900/30 border border-green-700 rounded px-1.5 py-0.5">you</span>}
                    {!m.is_active && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">inactive</span>}
                  </div>
                  <p className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 border ${badge.bg}`}>
                    <badge.icon size={10} aria-hidden="true" /> {badge.text}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    disabled={isSelf}
                    onChange={e => update(m.id, { role: e.target.value as TeamMember['role'] })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="driver">Driver</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => update(m.id, { is_active: !m.is_active })}
                    disabled={isSelf}
                    title={m.is_active ? 'Deactivate' : 'Reactivate'}
                    className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${m.is_active ? 'border-gray-700 hover:bg-gray-800 text-gray-400' : 'border-green-700 hover:bg-green-900/30 text-green-300'}`}
                  >
                    <CircleSlash size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id, m.email)}
                    disabled={isSelf}
                    title="Remove from team"
                    className="p-1.5 rounded-lg border border-red-700/50 hover:bg-red-900/30 text-red-300 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
