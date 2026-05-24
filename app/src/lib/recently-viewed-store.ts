'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tracks the last products a visitor has looked at, persisted to
// localStorage so the strip survives reloads. Capped at 12 to keep the
// payload small.

export interface RecentItem {
  id: string
  slug: string
  name: string
  nameAr?: string
  imageUrl?: string
  emoji?: string
  priceAED: number
  unit: string
}

interface RecentStore {
  items: RecentItem[]
  push: (item: RecentItem) => void
  clear: () => void
}

const MAX = 12

export const useRecentlyViewedStore = create<RecentStore>()(
  persist(
    set => ({
      items: [],
      push: item =>
        set(state => {
          const without = state.items.filter(i => i.slug !== item.slug)
          return { items: [item, ...without].slice(0, MAX) }
        }),
      clear: () => set({ items: [] }),
    }),
    { name: 'tmfoodstuff-recently-viewed' },
  ),
)
