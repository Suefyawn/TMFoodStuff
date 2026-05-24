'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

// Branded confirm() replacement.
//
// Usage:
//   const confirm = useConfirm()
//   const ok = await confirm({
//     title: 'Refund AED 50?',
//     message: 'Stripe will refund this to the customer's card. Cannot be undone.',
//     confirmLabel: 'Refund',
//     destructive: true,
//   })
//
// The provider is mounted once in the root layout; useConfirm returns a
// promise that resolves true on confirm, false on cancel/escape/backdrop.

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type Resolver = (value: boolean) => void

interface ConfirmContextValue {
  open: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext)
  // Fall back to native confirm if the provider isn't mounted — keeps the
  // hook safe to call from anywhere without crashing.
  if (!ctx) {
    return (opts) => Promise.resolve(window.confirm(opts.message || opts.title))
  }
  return ctx.open
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<Resolver | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const open = useCallback((next: ConfirmOptions) => new Promise<boolean>(resolve => {
    resolverRef.current = resolve
    setOpts(next)
  }), [])

  function resolve(value: boolean) {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOpts(null)
  }

  // Esc cancels.
  useEffect(() => {
    if (!opts) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolve(false)
      if (e.key === 'Enter') resolve(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts])

  return (
    <ConfirmContext.Provider value={{ open }}>
      {children}
      {mounted && opts && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => resolve(false)}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  opts.destructive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                  <AlertTriangle size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-lg leading-tight">{opts.title}</h2>
                  {opts.message && (
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{opts.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => resolve(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => resolve(false)}
                className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                {opts.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => resolve(true)}
                autoFocus
                className={`inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl transition-colors ${
                  opts.destructive
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {opts.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </ConfirmContext.Provider>
  )
}

// Used by an action button that wants to render its own loading state
// inside the dialog footer instead of dismissing immediately.
export function ConfirmBusy({ busy, label }: { busy: boolean; label: string }) {
  return (
    <>
      {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {label}
    </>
  )
}
