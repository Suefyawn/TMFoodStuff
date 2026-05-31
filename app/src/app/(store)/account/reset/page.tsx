'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLang } from '@/lib/use-lang'

// Landing page for the Supabase recovery-link email. Supabase parses the
// `#access_token=...&type=recovery` URL fragment automatically and creates a
// short-lived session before the page renders, so we just need to render the
// new-password form and call `auth.updateUser({ password })`.
//
// Guards: when no recovery session is present (someone landed here directly,
// or the link expired) we surface a helpful message + a link back to /forgot.
export default function ResetPasswordPage() {
  const router = useRouter()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [ready, setReady] = useState<'checking' | 'ok' | 'expired'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    // Wait one tick so Supabase finishes consuming the URL fragment.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      setReady(data.session ? 'ok' : 'expired')
    }, 200)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) {
        setError(updateErr.message || (isAr ? 'تعذّر تحديث كلمة المرور.' : 'Could not update the password.'))
        setLoading(false)
        return
      }
      setDone(true)
      setTimeout(() => router.push('/account'), 1800)
    } catch {
      setError(isAr ? 'خطأ في الاتصال. حاول مرة أخرى.' : 'Network error. Please try again.')
      setLoading(false)
    }
  }

  if (ready === 'checking') {
    return <div className="max-w-md mx-auto px-4 py-20 text-center text-stone-400 text-sm">…</div>
  }

  if (ready === 'expired') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-playfair font-bold text-stone-900 mb-2">{isAr ? 'الرابط منتهي' : 'Link expired'}</h1>
        <p className="text-stone-500 text-sm mb-6">
          {isAr
            ? 'هذا الرابط لإعادة تعيين كلمة المرور لم يعد صالحاً. اطلب رابطاً جديداً.'
            : 'This password-reset link is no longer valid. Request a new one.'}
        </p>
        <Link
          href="/account/forgot"
          className="inline-block bg-forest hover:bg-forest-dark text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          {isAr ? 'طلب رابط جديد' : 'Request a new link'}
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 size={28} className="text-forest-dark" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-playfair font-bold text-stone-900 mb-2">{isAr ? 'تم التحديث' : 'Password updated'}</h1>
        <p className="text-stone-500 text-sm">{isAr ? 'جاري التحويل إلى حسابك…' : 'Redirecting to your account…'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white border border-stone-100 rounded-3xl shadow-sm p-7 md:p-9">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-playfair font-bold text-stone-900 mb-1">{isAr ? 'كلمة مرور جديدة' : 'New password'}</h1>
          <p className="text-stone-500 text-sm">{isAr ? 'اختر كلمة مرور قوية لحسابك.' : 'Choose a strong password for your account.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">{isAr ? 'كلمة المرور الجديدة' : 'New password'}</label>
            <div className="relative">
              <Lock size={15} aria-hidden="true" className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                required
                autoFocus
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-light focus:border-forest-light transition-colors`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">{isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}</label>
            <div className="relative">
              <Lock size={15} aria-hidden="true" className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} />
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                required
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-light focus:border-forest-light transition-colors`}
              />
            </div>
          </div>

          {error && <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest hover:bg-forest-dark text-white font-black py-3.5 rounded-xl transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-forest-light focus-visible:ring-offset-2"
          >
            {loading ? (isAr ? 'جاري التحديث…' : 'Updating…') : (isAr ? 'تحديث كلمة المرور' : 'Update password')}
          </button>
        </form>
      </div>
    </div>
  )
}
