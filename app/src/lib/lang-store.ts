'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from './translations'

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'tmfoodstuff-lang' }
  )
)
