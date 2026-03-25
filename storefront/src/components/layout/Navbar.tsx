'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const cartCount = 0 // Will be wired to Medusa cart context

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <span className="font-bold text-xl text-brand-green tracking-tight">
              TM<span className="text-gray-900">FoodStuff</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-brand-green transition-colors font-medium">
              Home
            </Link>
            <Link href="/shop" className="text-gray-700 hover:text-brand-green transition-colors font-medium">
              Shop
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-brand-green transition-colors font-medium">
              About
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <div className="hidden sm:flex items-center gap-1 text-sm font-medium border rounded-lg overflow-hidden">
              <button className="px-3 py-1.5 bg-brand-green text-white">EN</button>
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors font-arabic">
                عربي
              </button>
            </div>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-gray-700 hover:text-brand-green hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/shop" className="block px-4 py-2 text-gray-700 hover:text-brand-green hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Shop
            </Link>
            <Link href="/about" className="block px-4 py-2 text-gray-700 hover:text-brand-green hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <div className="flex items-center gap-1 px-4 py-2 text-sm font-medium">
              <button className="px-3 py-1.5 bg-brand-green text-white rounded-l-lg">EN</button>
              <button className="px-3 py-1.5 border rounded-r-lg text-gray-600 font-arabic">عربي</button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
