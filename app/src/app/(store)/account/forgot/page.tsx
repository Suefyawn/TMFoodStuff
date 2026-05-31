'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLang } from '@/lib/use-lang'
import { isValidEmail } from '@/lib/validators'
import { SITE_URL } from '@/lib/site'

// First step of the password-reset flow. Calls Supabase Auth to email a
// recovery link to the customer; clicking that link lands them on
// /account/reset where they can set a new password.
//
// We always show the same success message regardless of whether the email
// exists — leaks the existence of accounts otherwise, and Supabase silently
// no-ops unknown emails server-side anyway.
export default function ForgotPasswordPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError(isAr ? 'البريد الإلكتروني غير صحيح.' : 'Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${SITE_URL}/account/reset`,
      })
      setSent(true)
    } catch {
      setError(isAr ? 'خطأ في الاتصال. حاول مرة أخرى.' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-5">
          <Mail size={26} className="text-forest-dark" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-playfair font-bold text-stone-900 mb-2">{isAr ? 'تحقق من بريدك' : 'Check your inbox'}</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          {isAr
            ? `إذا كان لدينا حساب مرتبط بـ ${email}، فقد أرسلنا رابط إعادة تعيين كلمة المرور. تحقق من بريدك الإلكتروني (وملف الرسائل غير المرغوبة).`
            : `If we have an account for ${email}, we've sent a password reset link. Check your inbox (and spam folder).`}
        </p>
        <Link href="/account/login" className="inline-flex items-center gap-1.5 text-forest-dark font-bold hover:underline">
          <ArrowLeft size={14} aria-hidden="true" />
          {isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-7 md:p-9">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-playfair font-bold text-stone-900 mb-1">{isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}</h1>
          <p className="text-gray-500 text-sm">
            {isAr ? 'سنرسل لك رابط إعادة تعيين.' : "We'll send you a reset link."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
            <div className="relative">
              <Mail size={15} aria-hidden="true" className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-gray-400`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                autoFocus
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-light focus:border-forest-light transition-colors`}
              />
            </div>
          </div>

          {error && <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest hover:bg-forest-dark text-white font-black py-3.5 rounded-xl transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-forest-light focus-visible:ring-offset-2"
          >
            {loading ? (isAr ? 'جاري الإرسال…' : 'Sending…') : (isAr ? 'إرسال رابط الإعادة' : 'Send reset link')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/account/login" className="text-forest-dark font-bold hover:underline inline-flex items-center gap-1.5">
            <ArrowLeft size={13} aria-hidden="true" />
            {isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
