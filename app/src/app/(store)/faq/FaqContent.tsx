'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { useLang } from '@/lib/use-lang'
import { FAQS } from './data'

export default function FaqContent() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [open, setOpen] = useState<string | null>(null)

  // Group by category, preserving declaration order within each group.
  const groups = FAQS.reduce<Record<string, typeof FAQS>>((acc, f) => {
    const key = isAr ? f.group_ar : f.group_en
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
  const groupOrder = Array.from(new Set(FAQS.map(f => (isAr ? f.group_ar : f.group_en))))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="text-center mb-10 md:mb-14">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
          {isAr ? 'الأسئلة الشائعة' : 'Frequently asked questions'}
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          {isAr
            ? 'إجابات سريعة على الأسئلة الأكثر شيوعاً. لم تجد ما تبحث عنه؟ تواصل معنا على واتساب.'
            : "Quick answers to the things customers ask most. Can't find what you're looking for? Reach us on WhatsApp."}
        </p>
      </header>

      <div className="space-y-10">
        {groupOrder.map(groupLabel => (
          <section key={groupLabel}>
            <h2 className="text-xs font-black uppercase tracking-wider text-green-700 mb-3 px-2">
              {groupLabel}
            </h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
              {groups[groupLabel].map((f, i) => {
                const id = `${groupLabel}-${i}`
                const isOpen = open === id
                const q = isAr ? f.q_ar : f.q_en
                const a = isAr ? f.a_ar : f.a_en
                return (
                  <div key={id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${id}`}
                      onClick={() => setOpen(isOpen ? null : id)}
                      className="w-full text-left flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-bold text-gray-900 text-base leading-snug">{q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`faq-panel-${id}`}
                      hidden={!isOpen}
                      className="px-5 pb-5 text-gray-600 text-sm leading-relaxed"
                    >
                      {a}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 md:mt-16 bg-green-50 border border-green-100 rounded-3xl p-7 md:p-9 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {isAr ? 'لا تزال لديك أسئلة؟' : 'Still have a question?'}
        </h2>
        <p className="text-gray-600 text-sm mb-5">
          {isAr
            ? 'تواصل معنا مباشرة على واتساب وسنرد عادةً خلال دقائق.'
            : "Message us on WhatsApp — we usually reply within minutes."}
        </p>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971544408411'}?text=${encodeURIComponent('Hi TMFoodStuff, I have a question')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
        >
          <MessageCircle size={16} aria-hidden="true" />
          {isAr ? 'تواصل عبر واتساب' : 'WhatsApp us'}
        </a>
        <p className="mt-4 text-xs text-gray-500">
          {isAr ? 'أو زر ' : 'Or visit our '}
          <Link href="/contact" className="text-green-700 font-bold hover:underline">
            {isAr ? 'صفحة الاتصال' : 'contact page'}
          </Link>
        </p>
      </div>
    </div>
  )
}
