'use client'
import { useLang } from '@/lib/use-lang'

export default function SkipLink() {
  const { lang } = useLang()
  const label = lang === 'ar' ? 'تخطي إلى المحتوى' : 'Skip to main content'

  return (
    <a
      href="#main-content"
      className="focus-ring sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 rtl:focus:left-auto rtl:focus:right-3 z-[100] bg-white text-green-800 font-bold px-4 py-2 rounded-xl shadow-lg border border-gray-200"
    >
      {label}
    </a>
  )
}
