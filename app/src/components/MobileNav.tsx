'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useLang } from '@/lib/use-lang'

export default function MobileNav() {
  const pathname = usePathname()
  const totalItems = useCartStore(s => s.totalItems())
  const { lang, tr } = useLang()

  const links = [
    { href: '/', icon: Home, label: lang === 'ar' ? 'الرئيسية' : 'Home' },
    { href: '/shop', icon: ShoppingBag, label: lang === 'ar' ? 'تسوق' : 'Shop' },
    { href: '/cart', icon: ShoppingCart, label: tr.cart, badge: totalItems },
    { href: '/account', icon: User, label: lang === 'ar' ? 'حسابي' : 'Account' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 safe-area-pb">
      <div className="grid grid-cols-4 h-16">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || (href !== '/' && href !== '#' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
