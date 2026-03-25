'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { label: 'Fruits', href: '/shop/fruits' },
  { label: 'Vegetables', href: '/shop/vegetables' },
  { label: 'Organic', href: '/shop/organic' },
  { label: 'Exotic', href: '/shop/exotic' },
  { label: 'All Products', href: '/shop' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🥦</span>
            <span className="font-black text-xl text-green-700">TMFoodStuff</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Cart</span>
            </Link>
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900" onClick={() => setOpen(!open)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
