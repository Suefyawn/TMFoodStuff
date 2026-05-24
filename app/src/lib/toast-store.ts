'use client'
import { create } from 'zustand'

// Global toast queue. Components anywhere on the storefront can pop a
// notification via `useToast().show(...)` instead of rolling local
// dismissible banners. ToastContainer renders the queue, auto-dismisses,
// and stacks them vertically when multiple fire in quick succession.

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  show: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (message, opts) => {
    const id = nextId++
    const toast: Toast = {
      id,
      message,
      variant: opts?.variant ?? 'success',
      duration: opts?.duration ?? 2800,
    }
    set(state => ({ toasts: [...state.toasts, toast] }))
    // Auto-dismiss handled here so callers don't need to wire it up.
    setTimeout(() => get().dismiss(id), toast.duration)
  },
  dismiss: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))

// Convenience hook so callers don't import the store directly.
export function useToast() {
  return {
    show: useToastStore(s => s.show),
  }
}
