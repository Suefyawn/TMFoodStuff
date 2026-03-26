'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Search, Leaf, User } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store'
import { usePathname, useRouter } from 'next/navigation'

const navLinks = [
  { label: 'Fruits', href: '/shop' },
  { label: 'Vegetables', href: '/shop' },
  { label: 'Organic', href: '/shop' },
  { label: 'Exotic', href: '/shop' },
  { label: 'All Products', href: '/shop' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearch, setMobileSearch] = useState('')
  const totalItems = useCartStore(state => state.totalItems())
  const pathname = usePathname()
  const router = useRouter()

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  function handleMobileSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && mobileSearch.trim()) {
      router.push(`/shop?q=${encodeURIComponent(mobileSearch.trim())}`)
      setMobileSearch('')
      setOpen(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group flex-shrink-0">
            <Leaf size={20} className="text-green-700 group-hover:text-green-600 transition-colors" />
            <span className="tracking-tight font-black text-green-700 text-xl">
              TM FoodStuff
            </span>
          </Link>

          {/* Search bar (desktop center) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search fruits, vegetables... (press Enter)"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-green-400 transition-all"
              />
            </div>
          </div>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.slice(0, 4).map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`nav-link px-3 py-2 ${pathname === link.href || pathname.startsWith('/shop') ? 'text-green-600' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="#" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors px-2">
              <User size={16} />
              <span>Sign In</span>
            </Link>
            <Link
              href="/cart"
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${
                pathname === '/cart'
                  ? 'bg-green-700 text-white'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu with slide-down animation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Mobile search */}
          <div className="px-1 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={mobileSearch}
                onChange={e => setMobileSearch(e.target.value)}
                onKeyDown={handleMobileSearch}
                placeholder="Search products... (press Enter)"
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-white focus:border-green-400 border border-transparent transition-all"
              />
            </div>
          </div>
          <div className="border-t border-gray-100 py-2 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href || pathname.startsWith('/shop')
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-1">
              <Link
                href="#"
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <User size={16} />
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
