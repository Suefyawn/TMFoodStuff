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
  // Self-service recovery when the one-time link has expired.
  const [resendEmail, setResendEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    if (tokenHash && (type === 'invite' || type === 'recovery')) {
      // Verify the one-time token from the invite link to establish a session.
      // Done here (not on a plain GET) so email link-scanners can't consume it.
      supabase.auth.verifyOtp({ type, token_hash: tokenHash }).then(({ error }) => {
        setAuthed(!error)
        setReady(true)
      })
      return
    }
    // Fallback: a session may already be present (e.g. legacy hash link).
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setReady(true)
    })
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

  async function requestFreshLink(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail.trim())) { setError('Enter a valid email address.'); return }
    setError('')
    setResendState('sending')
    try {
      await fetch('/api/dashboard/team/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      })
      // Always show success — the endpoint is deliberately non-revealing.
      setResendState('sent')
    } catch {
      setError('Network error — please try again.')
      setResendState('idle')
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
          resendState === 'sent' ? (
            <div className="text-center">
              <p className="text-emerald-300 text-sm mb-2">Check your inbox.</p>
              <p className="text-gray-500 text-sm">If that email is on the team, a fresh link is on its way. It expires in about an hour — please use it soon.</p>
            </div>
          ) : (
            <form onSubmit={requestFreshLink} className="space-y-3">
              <p className="text-red-400 text-sm text-center">This link is invalid or has expired.</p>
              <p className="text-gray-500 text-xs text-center">Enter your email and we'll send a fresh one.</p>
              <input
                type="email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={resendState === 'sending'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {resendState === 'sending' ? 'Sending…' : 'Email me a fresh link'}
              </button>
            </form>
          )
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
