'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

// Captures the `beforeinstallprompt` event on Chromium / Edge / Android and
// surfaces a small "Install app" pill in the bottom-left so a customer can
// pin the storefront to their home screen. iOS Safari fires no such event;
// users there install via the share sheet, so we deliberately don't render
// any iOS-specific instructions here (those would need a custom modal and
// detection — defer until we ship a real app).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'tmfoodstuff-pwa-dismissed-at'
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export default function PwaInstallPrompt() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return

    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setVisible(false)
    setEvent(null)
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={isAr ? 'تثبيت التطبيق' : 'Install app'}
      className={`fixed bottom-20 md:bottom-6 ${isAr ? 'right-4 md:right-6' : 'left-4 md:left-6'} z-40 max-w-xs bg-white border border-gray-200 shadow-xl rounded-2xl p-3 flex items-center gap-3`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
        <Download size={18} className="text-forest-dark" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">
          {isAr ? 'ثبّت تطبيق TM FoodStuff' : 'Install TM FoodStuff'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {isAr ? 'تسوّق أسرع بضغطة واحدة' : 'Faster shopping in one tap'}
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-forest hover:bg-forest-dark text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-forest-light focus-visible:ring-offset-2"
      >
        {isAr ? 'تثبيت' : 'Install'}
      </button>
      <button
        onClick={dismiss}
        aria-label={isAr ? 'إغلاق' : 'Dismiss'}
        className="text-gray-400 hover:text-gray-700 transition-colors p-1"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
