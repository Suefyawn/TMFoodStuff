'use client'
import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LogoutPage() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    // Audit trail first (needs the still-valid session), then sign out.
    fetch('/api/dashboard/auth-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'logout' }),
      keepalive: true,
    })
      .catch(() => {})
      .then(() => supabase.auth.signOut())
      .finally(() => {
        window.location.href = '/dashboard/login'
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
      Signing out…
    </div>
  )
}
