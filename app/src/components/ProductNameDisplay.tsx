'use client'
import { useLangStore } from '@/lib/lang-store'

export function ProductNameDisplay({ name, nameAr }: { name: string; nameAr?: string }) {
  const lang = useLangStore(s => s.lang)
  if (lang === 'ar' && nameAr) {
    return (
      <>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">{nameAr}</h1>
        <p className="text-sm text-gray-400 mb-4">{name}</p>
      </>
    )
  }
  return <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">{name}</h1>
}
