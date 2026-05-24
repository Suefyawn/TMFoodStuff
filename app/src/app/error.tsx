'use client'
import { useLang } from '@/lib/use-lang'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-8xl mb-6" aria-hidden="true">🥦</div>
      <h1 className="text-4xl font-black text-gray-900 mb-3">
        {isAr ? 'حدث خطأ ما' : 'Something went wrong'}
      </h1>
      <p className="text-gray-500 text-lg mb-8 max-w-sm">
        {isAr
          ? 'لم نتمكن من تحميل هذه الصفحة. يرجى المحاولة مرة أخرى بعد قليل.'
          : 'We hit a snag loading this page. Please try again in a moment.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-colors text-base focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          {isAr ? 'إعادة المحاولة' : 'Try Again'}
        </button>
        <a
          href="/"
          className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-gray-700 transition-colors text-base focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          {isAr ? 'العودة للرئيسية' : 'Back to Home'}
        </a>
      </div>
    </div>
  )
}
