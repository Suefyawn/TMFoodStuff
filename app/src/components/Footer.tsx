'use client'
import Link from 'next/link'
import { MessageCircle, Smartphone, CreditCard, Phone, MapPin, Leaf, Apple, Sprout, Sparkles, Gift, Truck, Mail } from 'lucide-react'
import { NewsletterForm } from './NewsletterForm'
import { useLang } from '@/lib/use-lang'

export default function Footer() {
  const { lang, tr } = useLang()

  const deliveryAreas = lang === 'ar'
    ? ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين']
    : ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']

  const shopLinks = [
    { icon: <Apple size={14} />, label: lang === 'ar' ? 'فواكه' : 'Fruits', href: '/shop?category=fruits' },
    { icon: <Leaf size={14} />, label: lang === 'ar' ? 'خضروات' : 'Vegetables', href: '/shop?category=vegetables' },
    { icon: <Sprout size={14} />, label: lang === 'ar' ? 'عضوي' : 'Organic', href: '/shop?category=organic' },
    { icon: <Sparkles size={14} />, label: lang === 'ar' ? 'فواكه غريبة' : 'Exotic Fruits', href: '/shop?category=exotic' },
    { icon: <Gift size={14} />, label: lang === 'ar' ? 'سلال هدايا' : 'Gift Baskets', href: '/shop?category=gifts' },
    { icon: <Truck size={14} />, label: lang === 'ar' ? 'جميع المنتجات' : 'All Products', href: '/shop' },
  ]

  const companyLinks = lang === 'ar'
    ? [['من نحن', '#'], ['سياسة التوصيل', '#'], ['سياسة الخصوصية', '#'], ['الشروط والأحكام', '#'], ['اتصل بنا', '#'], ['وظائف', '#']]
    : [['About Us', '#'], ['Delivery Policy', '#'], ['Privacy Policy', '#'], ['Terms & Conditions', '#'], ['Contact Us', '#'], ['Careers', '#']]

  return (
    <>
      {/* WhatsApp floating button — above bottom nav on mobile */}
      <a
        href="https://wa.me/971500000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title={tr.whatsappUs}
      >
        <MessageCircle size={26} fill="currentColor" />
      </a>

      <footer className="bg-gray-950 text-gray-400 mt-20">
        {/* Newsletter strip */}
        <div className="border-b border-white/10 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2">
                <Leaf size={20} className="text-green-500" />
                {tr.newsletterTitle}
              </h3>
              <p className="text-gray-400 text-sm">{tr.newsletterSub}</p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Main footer grid — single column on mobile, 4 cols on desktop */}
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Leaf size={20} className="text-green-500" />
              <span className="font-black text-white text-xl tracking-tight">
                TM FoodStuff
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-gray-500">
              {lang === 'ar'
                ? 'فواكه وخضروات طازجة فاخرة توصل يومياً في جميع أنحاء الإمارات. من المزرعة إلى بابك، دائماً طازج.'
                : 'Premium fresh fruits & vegetables delivered daily across the UAE. Farm to door, always fresh.'}
            </p>

            {/* App download badges */}
            <div className="flex flex-col gap-2 mb-5">
              <button className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors w-full">
                <Smartphone size={22} className="text-gray-300 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs text-gray-400">{lang === 'ar' ? 'حمّل من' : 'Download on the'}</div>
                  <div className="font-black text-sm">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors w-full">
                <Smartphone size={22} className="text-gray-300 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs text-gray-400">{lang === 'ar' ? 'احصل عليه من' : 'Get it on'}</div>
                  <div className="font-black text-sm">Google Play</div>
                </div>
              </button>
            </div>

            <a
              href="https://wa.me/971500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={16} />
              {tr.whatsappUs}
            </a>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-black text-white mb-5">{lang === 'ar' ? 'تسوق' : 'Shop'}</h4>
            <ul className="space-y-2.5 text-sm">
              {shopLinks.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center gap-2 hover:text-white transition-colors">
                    <span className="text-gray-600">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Areas */}
          <div>
            <h4 className="font-black text-white mb-5 flex items-center gap-2">
              <MapPin size={16} className="text-green-500" />
              {tr.deliveryAreas}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {deliveryAreas.map(city => (
                <li key={city} className="hover:text-white transition-colors cursor-default">
                  {city}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-black text-white mb-5">{tr.company}</h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact */}
            <div className="mt-6 space-y-2">
              <a href="tel:+971500000000" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <Phone size={14} className="text-green-600 flex-shrink-0" />
                +971 50 000 0000
              </a>
              <a href="mailto:hello@tmfoodstuff.ae" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <Mail size={14} className="text-green-600 flex-shrink-0" />
                hello@tmfoodstuff.ae
              </a>
            </div>

            {/* Payment methods */}
            <div className="mt-6">
              <h5 className="text-white font-bold text-sm mb-3">{tr.weAccept}</h5>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">VISA</span>
                <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">MC</span>
                <span className="inline-flex items-center gap-1 bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  <CreditCard size={12} /> COD
                </span>
                <span className="inline-flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  <Smartphone size={12} /> Pay
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center text-xs gap-2">
          <span className="text-gray-500 text-center md:text-left">© 2025 TMFoodStuff. {tr.allRights} | {tr.vatRegistered}</span>
          <span className="text-gray-500">{tr.pricesIncludeVAT}</span>
        </div>
      </footer>
    </>
  )
}
