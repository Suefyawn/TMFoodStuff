'use client'
import { useEffect, useRef } from 'react'
import { useCartStore } from '@/lib/store'

// Pushes the current cart snapshot to /api/cart/sync whenever it changes,
// debounced 2 seconds so rapid +/- clicks don't spam the server. No-ops
// when the customer isn't signed in (the API itself short-circuits).
//
// We don't cache "is signed in" state — the API check is cheap and the
// alternative (subscribing to a customer-store) means another moving part.
// A few wasted POSTs per session is fine.
const DEBOUNCE_MS = 2000

export default function CartSync() {
  const items = useCartStore(s => s.items)
  const subtotal = useCartStore(s => s.subtotal())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastJson = useRef<string>('')

  useEffect(() => {
    const payload = JSON.stringify({
      items: items.map(it => ({
        id: it.id,
        name: it.name,
        slug: it.slug,
        priceAED: it.priceAED,
        unit: it.unit,
        quantity: it.quantity,
        imageUrl: it.imageUrl,
        emoji: it.emoji,
      })),
      subtotal,
    })
    // Skip when the snapshot is unchanged (e.g. parent rerender).
    if (payload === lastJson.current) return
    lastJson.current = payload

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        // keepalive lets the request finish even if the tab is closing —
        // important since abandonment IS people closing the tab.
        keepalive: true,
      }).catch(() => { /* network blip — next change retries */ })
    }, DEBOUNCE_MS)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [items, subtotal])

  return null
}
