'use client'
import { useEffect } from 'react'

// Reads ?ref=CODE from the URL on first paint, writes it to a 30-day cookie
// so the referral persists through signup + checkout, then strips the param
// from the visible URL so it doesn't leak into screenshots / bookmarks /
// shares. Silent on every other page load.
const REFERRAL_COOKIE = 'tmf-ref'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export default function CaptureReferral() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref')
    if (!code) return
    const normalized = code.trim().toUpperCase()
    // Match the same alphabet the migration generates with.
    if (!/^[A-Z2-9]{8}$/.test(normalized)) return

    document.cookie = `${REFERRAL_COOKIE}=${normalized}; path=/; max-age=${THIRTY_DAYS}; samesite=lax`

    // Strip ?ref= from the URL bar without triggering a reload.
    params.delete('ref')
    const newSearch = params.toString()
    const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
    window.history.replaceState({}, '', cleanUrl)
  }, [])

  return null
}
