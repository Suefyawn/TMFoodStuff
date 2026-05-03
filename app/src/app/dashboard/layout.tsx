'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Tags, Users, Settings, LogOut, Store } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/categories', label: 'Categories', icon: Tags },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function NavLink({ item, pathname }: { item: typeof navItems[number]; pathname: string }) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-green-600/20 text-green-400 border border-green-600/30'
          : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
      }`}
    >
      <item.icon size={18} />
      {item.label}
    </Link>
  )
}

function MobileNavLink({ item, pathname }: { item: typeof navItems[number]; pathname: string }) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`p-2 rounded-lg transition-colors ${active ? 'text-green-400 bg-green-600/10' : 'text-gray-400 hover:text-white'}`}
    >
      <item.icon size={18} />
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-gray-900 border-r border-gray-800 fixed h-full z-30">
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🥬</span>
            <span className="font-black text-lg text-white">TMFoodStuff</span>
          </Link>
          <p className="text-xs text-gray-600 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors border border-transparent">
            <Store size={18} />
            View Store
          </Link>
          <Link href="/dashboard/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-transparent">
            <LogOut size={18} />
            Logout
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg">🥬</span>
            <span className="font-black text-white">TMFoodStuff</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {navItems.map(item => (
              <MobileNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
