'use client'
import { useLangStore } from './lang-store'
import { t } from './translations'

export function useLang() {
  const { lang } = useLangStore()
  return { lang, tr: t[lang] }
}
