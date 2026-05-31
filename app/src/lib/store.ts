import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  nameAr?: string
  slug: string
  priceAED: number
  unit: string
  imageUrl?: string
  emoji?: string
  quantity: number
}

export interface CartItemPatch {
  id: string
  priceAED?: number
  quantity?: number
  remove?: boolean
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  syncItems: (patches: CartItemPatch[]) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        set(state => {
          const existing = state.items.find(i => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: qty }] }
        })
      },
      removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),
      updateQty: (id, qty) => {
        if (qty <= 0) {
          set(state => ({ items: state.items.filter(i => i.id !== id) }))
        } else {
          set(state => ({
            items: state.items.map(i => i.id === id ? { ...i, quantity: qty } : i),
          }))
        }
      },
      syncItems: (patches) => {
        if (patches.length === 0) return
        const byId = new Map(patches.map(p => [p.id, p]))
        set(state => ({
          items: state.items.flatMap(i => {
            const p = byId.get(i.id)
            if (!p) return [i]
            if (p.remove) return []
            const nextQty = p.quantity != null ? p.quantity : i.quantity
            if (nextQty <= 0) return []
            return [{
              ...i,
              ...(p.priceAED != null ? { priceAED: p.priceAED } : {}),
              quantity: nextQty,
            }]
          }),
        }))
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.priceAED * i.quantity, 0),
    }),
    { name: 'tmfoodstuff-cart' }
  )
)
