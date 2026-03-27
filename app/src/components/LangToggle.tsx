'use client'
import { useLangStore } from '@/lib/lang-store'

export default function LangToggle() {
  const { lang, setLang } = useLangStore()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:border-green-500 hover:text-green-600 transition-all"
      title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      {lang === 'en' ? (
        <><span className="text-base">🇦🇪</span> عربي</>
      ) : (
        <><span className="text-base">🇬🇧</span> English</>
      )}
    </button>
  )
}
