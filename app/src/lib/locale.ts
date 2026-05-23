// Shared Locale type and a strict coercion helper. Kept in its own module so
// it can be imported from both client and server code without dragging in any
// store, translation table, or React dependency.
export type Locale = 'en' | 'ar'

export const DEFAULT_LOCALE: Locale = 'en'

export function toLocale(input: unknown): Locale {
  return input === 'ar' ? 'ar' : 'en'
}
