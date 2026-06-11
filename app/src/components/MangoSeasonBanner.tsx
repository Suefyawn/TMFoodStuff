'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

// Seasonal announcement bar for mango season. Sits above the standard launch
// banner. Dismissal is remembered in localStorage so it does not nag returning
// visitors — but a new season can re-surface it by bumping STORAGE_KEY.
const STORAGE_KEY = 'mango-season-2026-dismissed'

export default function MangoSeasonBanner() {
  const { lang } = useLang()
  // Render server-side by default (no layout shift for the common, not-yet-
  // dismissed visitor) and only hide once we confirm a prior dismissal in
  // localStorage. Initial state matches SSR, so there is no hydration mismatch.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) === '1') setVisible(false)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }

  const textMobile = lang === 'ar'
    ? <>موسم المانجو هنا — مانجو باكستانية طازجة وحلوة</>
    : <>Mango Season is here — sweet Pakistani mangoes</>

  const textDesktop = lang === 'ar'
    ? <><strong>موسم المانجو وصل!</strong> مانجو باكستانية طازجة، حلوة وعصيرية — تصل طازجة إلى باب منزلك</>
    : <><strong>Mango Season is Here!</strong> Sweet, juicy Pakistani mangoes — picked fresh, delivered to your door</>

  return (
    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white">
      <Link
        href="/mangoes"
        className="block py-2.5 px-10 text-center text-sm font-semibold hover:brightness-105 transition"
      >
        <span className="inline-flex items-center justify-center gap-2">
          <Sparkles size={14} className="flex-shrink-0 text-amber-100" />
          <span className="md:hidden">{textMobile}</span>
          <span className="hidden md:inline">{textDesktop}</span>
          <span className="hidden sm:inline underline underline-offset-2 decoration-white/50 font-bold ml-1">
            {lang === 'ar' ? 'تسوق الآن' : 'Shop now'}
          </span>
        </span>
      </Link>
      <button
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded p-1 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        aria-label={lang === 'ar' ? 'إغلاق' : 'Dismiss banner'}
      >
        <X size={15} />
      </button>
    </div>
  )
}
