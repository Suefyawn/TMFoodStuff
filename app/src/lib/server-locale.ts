// Read the customer's chosen language from a cookie at request time.
//
// Pairs with /app/src/lib/lang-store.ts on the client, which syncs the
// zustand-persisted value to the `tmf-lang` cookie whenever the toggle
// changes. Server components import this so they can render bilingual
// strings, set <html lang>/<html dir>, and emit the right Open Graph/SEO
// metadata without waiting for client hydration.
import { cookies } from 'next/headers'
import { toLocale, type Locale } from './locale'

export const LANG_COOKIE = 'tmf-lang'

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  return toLocale(store.get(LANG_COOKIE)?.value)
}
