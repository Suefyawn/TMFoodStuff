'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, User } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLang } from '@/lib/use-lang'
import { isValidEmail } from '@/lib/validators'

function SignupInner() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError(isAr ? 'البريد الإلكتروني غير صحيح.' : 'Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim() || undefined },
        },
      })
      if (signUpError) {
        setError(signUpError.message || (isAr ? 'تعذّر إنشاء الحساب.' : 'Could not create the account.'))
        setLoading(false)
        return
      }
      // Supabase returns user but no session when email confirmation is required.
      if (data.session) {
        window.location.href = next
        return
      }
      setNeedsConfirmation(true)
      setLoading(false)
    } catch {
      setError(isAr ? 'خطأ في الاتصال. حاول مرة أخرى.' : 'Network error. Please try again.')
      setLoading(false)
    }
  }

  if (needsConfirmation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-5xl mb-4" aria-hidden="true">📬</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">{isAr ? 'تحقق من بريدك' : 'Check your inbox'}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {isAr
            ? `أرسلنا رابط تأكيد إلى ${email}. اضغط على الرابط لتفعيل حسابك.`
            : `We just sent a confirmation link to ${email}. Click it to activate your account.`}
        </p>
        <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-green-700 font-bold hover:underline">
          {isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-7 md:p-9">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-black text-gray-900 mb-1">{isAr ? 'إنشاء حساب' : 'Create account'}</h1>
          <p className="text-gray-500 text-sm">{isAr ? 'تتبّع الطلبات، احفظ العناوين، واطلب أسرع' : 'Track orders, save addresses, check out faster'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{isAr ? 'الاسم الكامل' : 'Full name'}</label>
            <div className="relative">
              <User size={15} aria-hidden="true" className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-gray-400`} />
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isAr ? 'أحمد المنصوري' : 'Ahmed Al Mansouri'}
                autoComplete="name"
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 transition-colors`}
              />
            </div>
          </div>
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
                placeholder={isAr ? '٨ أحرف على الأقل' : 'At least 8 characters'}
                autoComplete="new-password"
                minLength={8}
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
            {loading ? (isAr ? 'جاري إنشاء الحساب…' : 'Creating account…') : (isAr ? 'إنشاء الحساب' : 'Create account')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isAr ? 'لديك حساب؟ ' : 'Already have an account? '}
          <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-green-700 font-bold hover:underline">
            {isAr ? 'سجّل دخول' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  )
}
