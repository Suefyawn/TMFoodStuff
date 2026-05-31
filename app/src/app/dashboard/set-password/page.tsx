'use client'
// Landing page for the team invite / password-reset link. The Supabase action
// link (generated in /api/dashboard/team) establishes a session via the URL;
// the invitee then sets a password and is sent into the dashboard. This exists
// because dashboard login is password-only with no self-signup.
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function DashboardSetPassword() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setAuthed(true)
      setReady(true)
    })
    // Also check immediately in case the session is already resolved.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true)
      setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: updErr } = await supabase.auth.updateUser({ password })
      if (updErr) { setError(updErr.message || 'Could not set password — the link may have expired.'); setLoading(false); return }
      window.location.href = '/dashboard'
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto">TM</div>
        <h1 className="text-xl font-bold text-white text-center mb-2">Set your password</h1>
        <p className="text-gray-500 text-sm text-center mb-8">TMFoodStuff dashboard</p>

        {!ready ? (
          <p className="text-gray-500 text-sm text-center">Verifying your invite…</p>
        ) : !authed ? (
          <div className="text-center">
            <p className="text-red-400 text-sm mb-4">This invite link is invalid or has expired.</p>
            <p className="text-gray-500 text-sm">Ask an admin to re-send your invitation from Settings → Team.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Set password & continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
