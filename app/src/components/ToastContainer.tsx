'use client'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/lib/toast-store'

const VARIANT_CLS: Record<ToastVariant, string> = {
  success: 'bg-gray-900 text-white',
  error:   'bg-rose-600 text-white',
  info:    'bg-blue-600 text-white',
}

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'error') return <AlertCircle size={16} className="text-rose-200" aria-hidden="true" />
  if (variant === 'info') return <Info size={16} className="text-blue-200" aria-hidden="true" />
  return <CheckCircle size={16} className="text-green-400" aria-hidden="true" />
}

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-[90vw] ${VARIANT_CLS[t.variant]}`}
        >
          <VariantIcon variant={t.variant} />
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
