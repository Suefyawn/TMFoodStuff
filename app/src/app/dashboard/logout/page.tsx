'use client'
import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LogoutPage() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.signOut().finally(() => {
      window.location.href = '/dashboard/login'
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
      Signing out…
    </div>
  )
}
