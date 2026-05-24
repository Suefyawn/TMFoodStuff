'use client'
import { useLang } from '@/lib/use-lang'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971544408411'

export default function AccountPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl" aria-hidden="true">👤</span>
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-3">
        {isAr ? 'حسابي' : 'Account'}
      </h1>
      <p className="text-gray-500 text-lg mb-2">
        {isAr ? 'قريباً' : 'Coming Soon'}
      </p>
      <p className="text-gray-400 text-sm mb-8">
        {isAr
          ? 'حسابات العملاء قريباً. حتى ذلك الحين، تواصل معنا عبر واتساب لتتبع الطلبات والدعم.'
          : 'Customer accounts are on their way. In the meantime, reach us via WhatsApp for order tracking and support.'}
      </p>
      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(isAr ? 'مرحباً TMFoodStuff، أحتاج إلى مساعدة في طلبي' : 'Hi TMFoodStuff, I need help with my order')}`}
        className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true">📱</span>
        {isAr ? 'الدعم عبر واتساب' : 'WhatsApp Support'}
      </a>
    </div>
  )
}
