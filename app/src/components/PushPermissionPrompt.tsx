'use client'
import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

// Lightweight permission prompt that appears as a slide-in card after the
// customer has interacted with the site (we wait for the first add-to-cart
// or 60s of dwell time so the prompt doesn't fire on first paint, which
// browsers increasingly penalise).
//
// Once dismissed or granted, the user-level decision is persisted in
// localStorage. We never re-prompt in the same browser.
//
// On grant we register the service worker, subscribe via PushManager, and
// POST the subscription to /api/push/subscribe.

const DECISION_KEY = 'tmf-push-decision'  // 'granted' | 'denied' | 'dismissed'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export default function PushPermissionPrompt() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Bail if the platform doesn't support push, or the user has already
    // decided in this browser.
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'default') return
    const prior = localStorage.getItem(DECISION_KEY)
    if (prior) return

    // Wait 45s of dwell time before prompting. Mobile Safari treats early
    // permission prompts as spam; this delay also filters out bots and
    // people who bounce immediately.
    const t = setTimeout(() => setShow(true), 45_000)
    return () => clearTimeout(t)
  }, [])

  async function subscribe() {
    setBusy(true)
    try {
      // 1. Get the VAPID public key from our API.
      const res = await fetch('/api/push/subscribe')
      if (!res.ok) throw new Error('Failed to load VAPID key')
      const { publicKey } = await res.json() as { publicKey: string }

      // 2. Ensure the SW is registered. We register here lazily so the
      //    storefront doesn't pay the SW download cost for users who never
      //    opt in.
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // 3. Subscribe via PushManager. Cast to BufferSource for TS — the
      //    PushManager spec accepts the raw bytes but lib.dom hasn't
      //    caught up to the wider Uint8Array generic.
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      })

      // 4. Send the subscription up.
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      })

      localStorage.setItem(DECISION_KEY, 'granted')
      setShow(false)
    } catch (err) {
      // Most likely cause: browser denied the permission prompt.
      console.error('[push] subscribe failed:', err)
      localStorage.setItem(DECISION_KEY, 'denied')
      setShow(false)
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    localStorage.setItem(DECISION_KEY, 'dismissed')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="region"
      aria-label={isAr ? 'تفعيل الإشعارات' : 'Enable notifications'}
      className="fixed bottom-20 md:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto sm:max-w-xs z-40 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-300"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={isAr ? 'إغلاق' : 'Dismiss'}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
      >
        <X size={14} aria-hidden="true" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 shrink-0">
          <Bell size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-black text-gray-900 text-sm leading-tight mb-0.5">
            {isAr ? 'تتبع طلباتك لحظياً' : 'Get order updates instantly'}
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-snug">
            {isAr ? 'احصل على إشعار عند تأكيد الطلب أو خروج المندوب.' : "We'll ping you when your order is confirmed and on the way."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={subscribe}
              disabled={busy}
              className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
            >
              {busy ? (isAr ? 'جارٍ…' : 'Enabling…') : (isAr ? 'تفعيل' : 'Enable')}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold px-3 py-1.5"
            >
              {isAr ? 'لاحقاً' : 'Not now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
