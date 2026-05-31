'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Tags, Users, Settings, LogOut, Store,
  Plug, Leaf, FileText, MessageSquare, Boxes, ClipboardCheck, Truck, Megaphone,
  UserCog, Search, FileSpreadsheet, Clock, Heart, Inbox, ChevronDown, Menu, X,
  ExternalLink, Mail,
} from 'lucide-react'
import { ConfirmProvider } from '@/components/ConfirmDialog'

// ─── Navigation model ─────────────────────────────────────────────────
//
// Industry-standard SaaS admin nav: grouped by intent, not feature.
//
// `adminOnly` items hide entirely from staff (role check below). Drivers
// get a stripped shell with no sidebar at all (handled before this
// component renders its main return).
//
// `badgeKey` ties an item to one of the server-supplied count badges
// passed in via props — orders/inbox/reviews are the only ones that
// move meaningfully day-to-day.

type Role = 'admin' | 'staff' | 'driver'
type BadgeKey = 'orders' | 'inbox' | 'reviews'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
  badgeKey?: BadgeKey
  adminOnly?: boolean
  // Only show to staff (used to put items in front of staff that admins
  // reach via a deeper hub like Settings).
  staffOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    title: 'Today',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, badgeKey: 'orders' },
      { href: '/dashboard/inbox', label: 'Inbox', icon: Inbox, badgeKey: 'inbox' },
      { href: '/dashboard/reviews', label: 'Reviews', icon: MessageSquare, badgeKey: 'reviews' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/dashboard/pick', label: 'Pick queue', icon: ClipboardCheck },
      { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
      { href: '/dashboard/packing-slips', label: 'Packing slips', icon: FileText },
    ],
  },
  {
    title: 'Catalog',
    items: [
      // Single hub entry. Categories + Stock log live as sub-nav tabs on
      // the products page rather than as their own sidebar items.
      { href: '/dashboard/products', label: 'Products', icon: Package },
    ],
  },
  {
    title: 'Customers',
    items: [
      // Customers hub. Wishlists + Searches are sub-nav tabs.
      { href: '/dashboard/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'Growth',
    items: [
      { href: '/dashboard/broadcasts', label: 'Broadcasts', icon: Megaphone },
      { href: '/dashboard/accounting', label: 'Accounting', icon: FileSpreadsheet },
      { href: '/dashboard/emails', label: 'Email status', icon: Mail },
    ],
  },
  {
    title: 'Settings',
    items: [
      // Settings hub. Delivery slots, Team, Integrations, Activity log
      // are sub-nav tabs inside the page.
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, adminOnly: true },
      // Staff don't have settings.edit but DO have audit_log.view, so
      // they get a direct entry into the Activity log instead of going
      // through the locked Settings page.
      { href: '/dashboard/audit-log', label: 'Activity log', icon: FileText, staffOnly: true },
    ],
  },
]

function NavLink({
  item, pathname, badges, onClick,
}: {
  item: NavItem
  pathname: string
  badges: { orders: number; inbox: number; reviews: number }
  onClick?: () => void
}) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const badge = item.badgeKey ? badges[item.badgeKey] : 0
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-green-600/15 text-green-300'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
      }`}
    >
      <item.icon size={16} className={active ? 'text-green-400' : ''} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span
          className={`text-[10px] font-black tabular-nums leading-none rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
            active ? 'bg-green-600 text-white' : 'bg-amber-500/20 text-amber-300'
          }`}
          aria-label={`${badge} ${item.label} need attention`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

function filterSections(role: Role): NavSection[] {
  return NAV
    .map(section => ({
      ...section,
      items: section.items.filter(it => {
        if (it.adminOnly && role !== 'admin') return false
        if (it.staffOnly && role !== 'staff') return false
        return true
      }),
    }))
    .filter(section => section.items.length > 0)
}

export default function DashboardShell({
  children,
  userEmail,
  role = 'admin',
  badges = { orders: 0, inbox: 0, reviews: 0 },
}: {
  children: React.ReactNode
  userEmail: string
  role?: Role
  badges?: { orders: number; inbox: number; reviews: number }
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Close menus on route change so a tap-through doesn't leave them stuck open.
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  if (pathname === '/dashboard/login' || pathname === '/dashboard/logout') {
    return <>{children}</>
  }

  // Drivers get a stripped-down shell — only the deliveries surface
  // exists for them, so the sidebar would only have one entry. Skip it
  // entirely and let DeliveriesClient be its own full-height app.
  if (role === 'driver') {
    return <ConfirmProvider>{children}</ConfirmProvider>
  }

  const sections = filterSections(role)
  const totalBadges = badges.orders + badges.inbox + badges.reviews

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* ────────── Desktop sidebar ────────── */}
        <aside className="hidden lg:flex w-60 flex-col bg-gray-900 border-r border-gray-800 fixed h-full z-30">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center shrink-0">
              <Leaf size={16} className="text-green-400" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="font-black text-sm text-white block leading-tight">TMFoodStuff</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{role}</span>
            </div>
          </Link>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {sections.map(section => (
              <div key={section.title}>
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <NavLink key={item.href} item={item} pathname={pathname} badges={badges} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <UserBlock userEmail={userEmail} role={role} open={userMenuOpen} setOpen={setUserMenuOpen} />
        </aside>

        {/* ────────── Mobile top bar ────────── */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-2.5">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-green-600/20 flex items-center justify-center">
                <Leaf size={14} className="text-green-400" aria-hidden="true" />
              </span>
              <span className="font-black text-white">TMFoodStuff</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="relative p-2 -mr-2 text-gray-300 hover:text-white"
            >
              <Menu size={20} aria-hidden="true" />
              {totalBadges > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </button>
          </div>
        </header>

        {/* ────────── Mobile drawer ────────── */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative ml-auto w-72 max-w-[85vw] h-full bg-gray-900 border-l border-gray-800 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <span className="font-black text-sm text-white">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {sections.map(section => (
                  <div key={section.title}>
                    <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map(item => (
                        <NavLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                          badges={badges}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              <UserBlock userEmail={userEmail} role={role} open={userMenuOpen} setOpen={setUserMenuOpen} />
            </aside>
          </div>
        )}

        {/* ────────── Main content ────────── */}
        <main className="lg:ml-60 pt-12 lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </ConfirmProvider>
  )
}

// Bottom-of-sidebar account block. Click to expand: storefront link,
// logout, role chip. Mirrors the pattern used in Linear / Vercel.
function UserBlock({
  userEmail, role, open, setOpen,
}: {
  userEmail: string
  role: Role
  open: boolean
  setOpen: (v: boolean) => void
}) {
  return (
    <div className="px-3 py-3 border-t border-gray-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-800/60 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-xs font-black shrink-0">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">{userEmail}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{role}</p>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800/60"
          >
            <Store size={13} aria-hidden="true" />
            <span className="flex-1">View store</span>
            <ExternalLink size={11} className="opacity-50" aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard/logout"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={13} aria-hidden="true" />
            Sign out
          </Link>
        </div>
      )}
    </div>
  )
}
