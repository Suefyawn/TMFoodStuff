import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Securely complete your TMFoodStuff order with cash on delivery or card payment.',
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: true },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
