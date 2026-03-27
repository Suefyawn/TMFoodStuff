'use client'
import { useState } from 'react'
import { X, Truck } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

export default function LaunchBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { lang } = useLang()

  if (dismissed) return null

  const bannerTextMobile = lang === 'ar'
    ? <>🎉 توصيل مجاني + استخدم <span className="font-mono font-black bg-white/20 px-1 rounded">FRESH10</span> لخصم 10٪</>
    : <>🎉 FREE DELIVERY + use <span className="font-mono font-black bg-white/20 px-1 rounded">FRESH10</span> for 10% off</>

  const bannerTextDesktop = lang === 'ar'
    ? <>🎉 عرض الإطلاق الكبير — <strong>توصيل مجاني</strong> على جميع الطلبات! استخدم كود <span className="bg-white/20 px-2 py-0.5 rounded font-mono font-black">FRESH10</span> لخصم 10٪</>
    : <>🎉 Grand Launch Offer — <strong>FREE DELIVERY</strong> on all orders! Use code <span className="bg-white/20 px-2 py-0.5 rounded font-mono font-black">FRESH10</span> for 10% off too</>

  return (
    <div className="bg-green-700 text-white py-2.5 px-4 text-center text-sm font-semibold relative">
      <div className="flex items-center justify-center gap-2">
        <Truck size={15} className="flex-shrink-0" />
        <span className="md:hidden">{bannerTextMobile}</span>
        <span className="hidden md:inline">{bannerTextDesktop}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded p-1 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  )
}
