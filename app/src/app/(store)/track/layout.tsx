import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Look up your TMFoodStuff order by number to see its current status and delivery slot.',
  alternates: { canonical: '/track' },
  // Order-tracking URLs include a per-order number in the query string —
  // tell crawlers to skip indexing so individual orders don't end up in
  // search results.
  robots: { index: false, follow: false },
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
