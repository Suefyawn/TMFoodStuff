'use client'
import { create } from 'zustand'

// Storefront wishlist state. Loads once per session from /api/account/wishlist
// (which returns { signedIn: false } for guests, so calls are cheap). The
// product cards' WishlistButton reads from `productIds` via `has(id)` and
// optimistically updates on toggle.

interface WishlistStore {
  signedIn: boolean
  productIds: Set<number>
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  has: (productId: number | string) => boolean
  toggle: (productId: number | string) => Promise<{ ok: boolean; added?: boolean; signedIn?: boolean }>
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  signedIn: false,
  productIds: new Set(),
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const res = await fetch('/api/account/wishlist', { credentials: 'include' })
      if (!res.ok) {
        set({ loaded: true, loading: false })
        return
      }
      const data = await res.json()
      const ids = new Set<number>((data.items || []).map((i: { productId: number }) => i.productId))
      set({ signedIn: !!data.signedIn, productIds: ids, loaded: true, loading: false })
    } catch {
      set({ loaded: true, loading: false })
    }
  },
  has: (productId) => get().productIds.has(Number(productId)),
  toggle: async (productId) => {
    const id = Number(productId)
    if (!id) return { ok: false }
    const current = get().productIds
    const isIn = current.has(id)
    // Optimistic update.
    const next = new Set(current)
    if (isIn) next.delete(id)
    else next.add(id)
    set({ productIds: next })
    try {
      const res = await fetch('/api/account/wishlist', {
        method: isIn ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: id }),
      })
      if (res.status === 401) {
        // Roll back the optimistic update.
        set({ productIds: current })
        return { ok: false, signedIn: false }
      }
      if (!res.ok) {
        set({ productIds: current })
        return { ok: false, signedIn: true }
      }
      return { ok: true, added: !isIn, signedIn: true }
    } catch {
      set({ productIds: current })
      return { ok: false }
    }
  },
}))
