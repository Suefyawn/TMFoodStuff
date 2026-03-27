'use client'
import { useLangStore } from '@/lib/lang-store'

export default function LangToggle() {
  const { lang, setLang } = useLangStore()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-green-500 hover:text-green-600 transition-all active:scale-95"
    >
      {lang === 'en' ? (
        <><span className="text-lg">🇦🇪</span><span>عربي</span></>
      ) : (
        <><span className="text-lg">🇬🇧</span><span>English</span></>
      )}
    </button>
  )
}
