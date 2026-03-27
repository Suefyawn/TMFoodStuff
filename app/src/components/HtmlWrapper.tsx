'use client'
import { useLangStore } from '@/lib/lang-store'
import { useEffect } from 'react'

export default function HtmlWrapper({ children }: { children: React.ReactNode }) {
  const lang = useLangStore(s => s.lang)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])

  return <>{children}</>
}
