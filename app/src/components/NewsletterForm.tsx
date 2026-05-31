'use client'
import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import { isValidEmail } from '@/lib/validators'
import { useLang } from '@/lib/use-lang'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { lang } = useLang()

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-green-400 font-semibold">
        <CheckCircle size={18} aria-hidden="true" />
        <span>{lang === 'ar' ? 'تم الاشتراك بنجاح!' : "You're subscribed!"}</span>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || (lang === 'ar' ? 'حدث خطأ ما' : 'Something went wrong'))
        return
      }
      setSubmitted(true)
    } catch {
      setError(lang === 'ar' ? 'خطأ في الشبكة — يرجى المحاولة مرة أخرى' : 'Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full md:w-auto">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto" noValidate>
        <div className="relative flex-1 md:w-64">
          <Mail size={15} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); if (error) setError('') }}
            placeholder="your@email.com"
            aria-label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'newsletter-error' : undefined}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-light transition-colors ${error ? 'border-red-500' : 'border-gray-700 focus:border-forest-light'}`}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-forest hover:bg-forest-dark text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-forest-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          {loading
            ? (lang === 'ar' ? 'جاري الاشتراك…' : 'Subscribing…')
            : (lang === 'ar' ? 'اشترك' : 'Subscribe')}
        </button>
      </form>
      {error && <p id="newsletter-error" className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
