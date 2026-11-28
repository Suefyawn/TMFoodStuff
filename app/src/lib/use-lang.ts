'use client'
import { useContext, useSyncExternalStore } from 'react'
import { useLangStore } from './lang-store'
import { LangContext } from './lang-context'
import { t } from './translations'

const noopSubscribe = () => () => {}

// Server render and the hydration pass use the cookie language from
// LangProvider; once mounted, the persisted store wins (it may hold a
// different value from localStorage, or a fresh toggle).
export function useLang() {
  const { lang: storeLang } = useLangStore()
  const serverLang = useContext(LangContext)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const lang = mounted ? storeLang : (serverLang ?? storeLang)
  return { lang, tr: t[lang] }
}
