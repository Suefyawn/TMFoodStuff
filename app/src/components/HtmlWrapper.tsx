'use client'
import { useLangStore } from '@/lib/lang-store'
import { useLaunchBannerStore } from '@/lib/launch-banner-store'
import { useEffect } from 'react'

export default function HtmlWrapper({ children }: { children: React.ReactNode }) {
  const lang = useLangStore(s => s.lang)
  const launchBannerDismissed = useLaunchBannerStore(s => s.dismissed)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-launch-banner', launchBannerDismissed ? 'hidden' : 'visible')
  }, [launchBannerDismissed])

  return <>{children}</>
}
