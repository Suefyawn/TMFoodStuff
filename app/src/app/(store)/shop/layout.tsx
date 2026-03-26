import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Fresh Produce',
  description: 'Browse 90+ fresh fruits and vegetables. Filter by category, organic, and more. Delivered across UAE.',
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
