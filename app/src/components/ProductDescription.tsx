'use client'
import { useLangStore } from '@/lib/lang-store'

// Renders the Arabic description when the customer's language is Arabic and
// an AR description is available; otherwise falls back to the English copy.
// Mirrors the pattern used by ProductNameDisplay so server-rendered product
// pages can still localise body text from a single client island.
export function ProductDescription({
  description,
  descriptionAr,
  className,
}: {
  description: string
  descriptionAr?: string
  className?: string
}) {
  const lang = useLangStore(s => s.lang)
  const text = lang === 'ar' && descriptionAr ? descriptionAr : description
  const dir = lang === 'ar' && descriptionAr ? 'rtl' : 'ltr'
  if (!text) return null
  return (
    <p dir={dir} className={className}>
      {text}
    </p>
  )
}
