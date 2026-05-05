'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'

export default function StockNotifyForm({ productId, productName }: { productId: string; productName: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/notify-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="w-full flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
        <Bell size={20} className="text-green-600 shrink-0" />
        <p className="text-green-700 font-semibold text-sm">We'll email you when {productName} is back in stock!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 font-medium">Get notified when this is back in stock:</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors min-h-[52px]"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-60 min-h-[52px] shrink-0"
        >
          <Bell size={16} />
          {status === 'loading' ? '...' : 'Notify Me'}
        </button>
      </form>
      {status === 'error' && <p className="text-red-500 text-xs">Something went wrong. Please try again.</p>}
    </div>
  )
}
