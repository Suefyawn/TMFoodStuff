'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertCircle } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  useEffect(() => {
    // Push the error to Sentry so production failures aren't invisible to
    // ops. No-op when NEXT_PUBLIC_SENTRY_DSN is unset (sentry.client.config
    // doesn't initialise the SDK in that case).
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <AlertCircle size={36} className="text-red-600" aria-hidden="true" />
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
        {isAr ? 'حدث خطأ ما' : 'Something went wrong'}
      </h1>
      <p className="text-gray-500 text-base md:text-lg mb-2 max-w-sm">
        {isAr
          ? 'لم نتمكن من تحميل هذه الصفحة. يرجى المحاولة مرة أخرى بعد قليل.'
          : 'We hit a snag loading this page. Please try again in a moment.'}
      </p>
      {error.digest && (
        <p className="text-gray-400 text-xs font-mono mb-8" aria-label="Error reference">
          ref: {error.digest}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-green-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-green-700 transition-colors text-base focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          {isAr ? 'إعادة المحاولة' : 'Try again'}
        </button>
        <a
          href="/"
          className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-gray-700 transition-colors text-base focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          {isAr ? 'العودة للرئيسية' : 'Back to home'}
        </a>
      </div>
    </div>
  )
}
