'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from './translations'

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
}

// Pairs with /lib/server-locale.ts. We persist the user's choice in two
// places: zustand's localStorage (for instant rehydration on subsequent
// loads) AND a long-lived `tmf-lang` cookie so server components can read
// the locale at request time and render the page in the right language on
// first paint — no FOUC, no SSR/CSR mismatch.
const LANG_COOKIE = 'tmf-lang'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function writeCookie(lang: Lang) {
  if (typeof document === 'undefined') return
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => {
        writeCookie(lang)
        set({ lang })
      },
    }),
    {
      name: 'tmfoodstuff-lang',
      // After zustand rehydrates from localStorage on first client render,
      // mirror that value to the cookie. Covers visitors who set the locale
      // before this cookie code shipped and would otherwise see English on
      // their next visit until they re-toggled.
      onRehydrateStorage: () => (state) => {
        if (state?.lang) writeCookie(state.lang)
      },
    },
  ),
)
