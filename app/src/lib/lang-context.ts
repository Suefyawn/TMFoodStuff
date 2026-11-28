'use client'
import { createContext, createElement } from 'react'
import type { Lang } from './translations'

// The language the server rendered with, read from the tmf-lang cookie in
// the root layout. useLang() uses it until the client has mounted, so the
// first client render matches the server HTML (Arabic chrome for Arabic
// visitors, no English flash before hydration). After mount the zustand
// store, which also reads localStorage, takes over as before.
export const LangContext = createContext<Lang | null>(null)

export function LangProvider({ initialLang, children }: { initialLang: Lang; children?: React.ReactNode }) {
  return createElement(LangContext.Provider, { value: initialLang }, children)
}
