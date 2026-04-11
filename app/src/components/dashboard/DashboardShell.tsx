'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, ShoppingCart, Tags, Users, Settings, LogOut, Store } from 'lucide-react'
import { dashboardFetch } from '@/lib/dashboard-fetch'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/categories', label: 'Categories', icon: Tags },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)

  const bare =
    pathname.startsWith('/dashboard/login') ||
    pathname.startsWith('/dashboard/logout')

  useEffect(() => {
    if (bare) return
    dashboardFetch<{ email: string | null; role: string }>('/api/dashboard/me').then(r => {
      if (r.ok && r.data) setEmail(r.data.email)
    })
  }, [bare, pathname])

  if (bare) {
    return <div className="min-h-screen bg-gray-950 text-gray-100">{children}</div>
  }

  function linkActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="hidden lg:flex w-64 flex-col bg-gray-900 border-r border-gray-800 fixed inset-y-0 z-30">
        <div className="px-5 py-5 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🥬</span>
            <div>
              <span className="font-black text-lg text-white tracking-tight">TMFoodStuff</span>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Admin</p>
            </div>
          </Link>
          {email && <p className="text-xs text-gray-500 mt-3 truncate" title={email}>{email}</p>}
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = linkActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-green-600/15 text-green-400 border border-green-600/25' : 'text-gray-400 hover:text-white hover:bg-gray-800/80 border border-transparent'
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-2 py-4 border-t border-gray-800 space-y-0.5">
          <Link
            href="/dashboard/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            Log out
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <Store size={18} />
            View storefront
          </Link>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-3 py-2.5 gap-2">
          <Link href="/dashboard" className="font-black text-white text-sm truncate">
            TMFoodStuff
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto py-1">
            {navItems.map(item => {
              const active = linkActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2.5 rounded-lg flex-shrink-0 ${active ? 'text-green-400 bg-green-600/15' : 'text-gray-400'}`}
                  aria-label={item.label}
                  title={item.label}
                >
                  <item.icon size={20} />
                </Link>
              )
            })}
            <Link href="/dashboard/logout" className="p-2.5 text-red-400 flex-shrink-0" title="Log out">
              <LogOut size={20} />
            </Link>
          </nav>
        </div>
      </div>

      <main className="flex-1 lg:ml-64 pt-[52px] lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}
