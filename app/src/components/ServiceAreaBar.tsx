'use client'
import { MapPin } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

// Thin informational bar above the announcement banner. Reassures customers that
// we deliver to every emirate before they even see the catalogue. Sized to
// stay un-intrusive (h-7) so the navbar still dominates the viewport.
export default function ServiceAreaBar() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  return (
    <div
      className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs font-medium"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 min-h-7 py-1 flex items-center justify-center gap-1.5 text-center">
        <MapPin size={11} className="text-forest flex-shrink-0" aria-hidden="true" />
        {/* Mobile: short label that fits one line, centred. md+: full emirate list. */}
        <span className="md:hidden text-[11px] leading-tight">
          {isAr ? 'توصيل في جميع الإمارات السبع 🇦🇪' : 'Delivering across all 7 emirates 🇦🇪'}
        </span>
        <span className="hidden md:inline">
          {isAr
            ? 'توصيل في جميع إمارات الدولة · دبي · أبوظبي · الشارقة · عجمان · رأس الخيمة · أم القيوين · الفجيرة'
            : 'Delivering across all 7 emirates · Dubai · Abu Dhabi · Sharjah · Ajman · RAK · UAQ · Fujairah'}
        </span>
      </div>
    </div>
  )
}
