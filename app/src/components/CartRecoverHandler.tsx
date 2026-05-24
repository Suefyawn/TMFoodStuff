'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import { useToastStore } from '@/lib/toast-store'

// Detects ?recover=TOKEN on the cart page, fetches the saved cart snapshot
// from the server, merges it into the local cart, copies the WELCOMEBACK10
// code to clipboard, and strips the param. Idempotent — the server's GET
// endpoint marks the cart `recovered_at` so a second visit is a no-op.
export default function CartRecoverHandler() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const addItem = useCartStore(s => s.addItem)
  const showToast = useToastStore(s => s.show)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    const token = params.get('recover')
    if (!token || !/^[a-f0-9]{32}$/.test(token)) return
    fired.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/cart/sync?t=${token}`)
        if (!res.ok) {
          showToast('Recovery link expired — your cart may already be loaded.', { variant: 'info' })
          return
        }
        const data = await res.json() as { items: Array<{ id: string; name: string; slug: string; priceAED: number; unit: string; quantity: number; imageUrl?: string; emoji?: string }> }
        // Merge: only re-add items not already in the cart so we don't
        // double up quantity if the customer kept some state.
        const existing = new Set(useCartStore.getState().items.map(i => i.id))
        let added = 0
        for (const it of data.items) {
          if (existing.has(it.id)) continue
          addItem({
            id: it.id,
            name: it.name,
            slug: it.slug,
            priceAED: it.priceAED,
            unit: it.unit,
            imageUrl: it.imageUrl,
            emoji: it.emoji,
          }, it.quantity)
          added++
        }
        try { await navigator.clipboard.writeText('WELCOMEBACK10') } catch { /* ignore */ }
        showToast(
          added > 0
            ? `Welcome back! Restored ${added} item${added === 1 ? '' : 's'}. Code WELCOMEBACK10 copied — 10% off.`
            : 'Welcome back! Your code WELCOMEBACK10 has been copied — 10% off.',
          { variant: 'success', duration: 6000 },
        )
      } catch {
        showToast('Could not restore cart — please try again.', { variant: 'error' })
      } finally {
        // Strip ?recover so a refresh doesn't re-process.
        const next = new URLSearchParams(params.toString())
        next.delete('recover')
        const qs = next.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      }
    })()
  }, [params, addItem, showToast, router, pathname])

  return null
}
