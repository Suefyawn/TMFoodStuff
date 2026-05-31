'use client'
import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/use-lang'

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971544408411').replace(/\D/g, '')

// Site-wide floating action button that opens WhatsApp with a locale-aware
// pre-filled message. Hidden on /checkout and /cart so it can't overlap the
// primary "Place order" CTA, and on the dashboard area entirely.
export default function FloatingWhatsApp() {
  const pathname = usePathname()
  const { lang } = useLang()
  const isAr = lang === 'ar'

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/checkout')) return null

  const message = isAr
    ? 'مرحباً TM FoodStuff، أريد الاستفسار عن طلب أو منتج.'
    : 'Hi TM FoodStuff, I have a question about an order or product.'

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isAr ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
      className={`fixed bottom-20 md:bottom-6 ${isAr ? 'left-4 md:left-6' : 'right-4 md:right-6'} z-40 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-lg shadow-forest-light/30 transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-forest-light focus-visible:ring-offset-2`}
    >
      <MessageCircle size={26} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      <span className="sr-only">{isAr ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}</span>
    </a>
  )
}
