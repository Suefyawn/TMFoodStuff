'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLang } from '@/lib/use-lang'
import { isValidEmail } from '@/lib/validators'

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError(isAr ? 'البريد الإلكتروني غير صحيح.' : 'Please enter a valid email address.')
      return
    }
    if (!password) return
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInError) {
        setError(isAr ? 'بيانات الدخول غير صحيحة.' : 'Invalid email or password.')
        setLoading(false)
        return
      }
      // Hard redirect so the refreshed session cookies arrive on the next request.
      window.location.href = next
    } catch {
      setError(isAr ? 'خطأ في الاتصال. حاول مرة أخرى.' : 'Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-7 md:p-9">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-black text-gray-900 mb-1">{isAr ? 'تسجيل الدخول' : 'Sign in'}</h1>
          <p className="text-gray-500 text-sm">{isAr ? 'إلى حسابك في TM FoodStuff' : 'to your TM FoodStuff account'}</p>
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
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 transition-colors`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{isAr ? 'كلمة المرور' : 'Password'}</label>
            <div className="relative">
              <Lock size={15} aria-hidden="true" className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-gray-400`} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 transition-colors`}
              />
            </div>
          </div>
          {error && <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            {loading ? (isAr ? 'جاري الدخول…' : 'Signing in…') : (isAr ? 'تسجيل الدخول' : 'Sign In')}
          </button>

          <p className="text-center -mt-1">
            <Link href="/account/forgot" className="text-xs text-gray-500 hover:text-green-700 hover:underline">
              {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isAr ? 'ليس لديك حساب؟ ' : 'No account yet? '}
          <Link href={`/account/signup?next=${encodeURIComponent(next)}`} className="text-green-700 font-bold hover:underline">
            {isAr ? 'سجّل الآن' : 'Create one'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
