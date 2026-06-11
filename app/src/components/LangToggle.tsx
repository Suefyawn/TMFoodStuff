'use client'
import { Globe } from 'lucide-react'
import { useLangStore } from '@/lib/lang-store'

export default function LangToggle() {
  const { lang, setLang } = useLangStore()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-forest-light hover:text-forest transition-all active:scale-95"
    >
      <Globe size={15} aria-hidden="true" />
      <span>{lang === 'en' ? 'عربي' : 'English'}</span>
    </button>
  )
}
