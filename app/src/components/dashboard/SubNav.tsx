// Horizontal sub-nav strip rendered at the top of hub pages. Replaces
// what would otherwise be top-level sidebar entries for related-but-
// secondary destinations (Categories under Catalog, Team under Settings,
// etc.).
//
// Active state is determined by exact match OR prefix match — pass
// `exact: true` on the index item ("Settings") so it doesn't also
// stay active when you're on a child route.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface SubNavItem {
  href: string
  label: string
  exact?: boolean
}

export default function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="border-b border-gray-800 -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-1 mb-5">
      <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
        {items.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative inline-flex items-center px-3 sm:px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
                active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {item.label}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-0.5 bg-green-500 rounded-t"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Shared catalogues — defined here so every hub page reads from the same
// source of truth. If you add a new sub-page, add it in one place.

export const CATALOG_SUBNAV: SubNavItem[] = [
  { href: '/dashboard/products', label: 'Products', exact: true },
  { href: '/dashboard/categories', label: 'Categories' },
  { href: '/dashboard/stock-history', label: 'Stock log' },
]

export const CUSTOMERS_SUBNAV: SubNavItem[] = [
  { href: '/dashboard/customers', label: 'All customers', exact: true },
  { href: '/dashboard/wishlist-insights', label: 'Wishlists' },
  { href: '/dashboard/search-analytics', label: 'Searches' },
]

export const SETTINGS_SUBNAV: SubNavItem[] = [
  { href: '/dashboard/settings', label: 'Store settings', exact: true },
  { href: '/dashboard/delivery-slots', label: 'Delivery slots' },
  { href: '/dashboard/team', label: 'Team' },
  { href: '/dashboard/integrations', label: 'Integrations' },
  { href: '/dashboard/audit-log', label: 'Activity log' },
]
