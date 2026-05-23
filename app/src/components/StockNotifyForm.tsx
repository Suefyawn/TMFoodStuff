'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { isValidEmail } from '@/lib/validators'
import { useLang } from '@/lib/use-lang'

export default function StockNotifyForm({ productId, productName }: { productId: string; productName: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')
  const { lang } = useLang()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    if (!isValidEmail(email)) {
      setEmailError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address')
      return
    }
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
        <p className="text-green-700 font-semibold text-sm">
          {lang === 'ar'
            ? `سنرسل لك بريداً إلكترونياً عندما يعود ${productName} إلى المخزون!`
            : `We'll email you when ${productName} is back in stock!`}
        </p>
      </div>
    )
  }

  const labelText = lang === 'ar' ? 'أبلغني عند توفره مجدداً:' : 'Get notified when this is back in stock:'
  const buttonText = lang === 'ar' ? 'أبلغني' : 'Notify Me'
  const errorText = lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.'

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 font-medium">{labelText}</p>
      <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
          placeholder="your@email.com"
          aria-label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
          aria-invalid={emailError ? 'true' : undefined}
          aria-describedby={emailError ? 'stock-notify-email-error' : undefined}
          required
          className={`flex-1 border-2 rounded-xl px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition-colors min-h-[52px] ${emailError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-60 min-h-[52px] shrink-0 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          <Bell size={16} aria-hidden="true" />
          {status === 'loading' ? '…' : buttonText}
        </button>
      </form>
      {emailError && (
        <p id="stock-notify-email-error" className="text-red-500 text-xs">{emailError}</p>
      )}
      {status === 'error' && (
        <p className="text-red-500 text-xs">{errorText}</p>
      )}
    </div>
  )
}
