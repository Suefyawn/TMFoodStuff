'use client'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/use-lang'

// Stacks ABOVE the FloatingWhatsApp button (which sits at bottom-20 on
// mobile / bottom-6 on desktop). Anchored on the opposite horizontal edge
// from WhatsApp so the two don't collide in RTL mode either. Hidden on the
// surfaces that already have their own sticky bottom CTAs (cart, checkout,
// product detail) so it never obscures the primary action.
export function ScrollToTop() {
  const [show, setShow] = useState(false)
  const pathname = usePathname()
  const { lang } = useLang()
  const isAr = lang === 'ar'

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Suppress on surfaces with their own bottom-anchored CTA so we don't
  // pile UI on top of the customer's primary action.
  const hideOnPath =
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/product/')
  if (hideOnPath || !show) return null

  // WhatsApp anchors to one side; ScrollToTop anchors to the other so they
  // never overlap regardless of language.
  const sideClass = isAr ? 'right-4 md:right-6' : 'left-4 md:left-6'

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-36 ${sideClass} md:bottom-24 z-40 w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors`}
      aria-label={isAr ? 'العودة إلى أعلى' : 'Scroll to top'}
    >
      <ArrowUp size={18} className="text-gray-600" aria-hidden="true" />
    </button>
  )
}
