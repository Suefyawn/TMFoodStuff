import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Suspense } from 'react'
import { PostHogProvider } from '@/components/PostHogProvider'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TMFoodStuff — Fresh Fruits & Vegetables UAE',
    template: '%s | TMFoodStuff',
  },
  description: 'Order fresh fruits and vegetables online. Same-day delivery across Dubai, Abu Dhabi, Sharjah, Ajman and all UAE emirates. Premium quality, farm fresh daily.',
  keywords: ['fresh fruits UAE', 'vegetables delivery Dubai', 'grocery delivery UAE', 'organic fruits Dubai'],
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TM FoodStuff',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    url: SITE_URL,
    siteName: 'TMFoodStuff',
    title: 'TMFoodStuff — Fresh Fruits & Vegetables UAE',
    description: 'Premium fresh fruits & vegetables delivered across UAE. Same-day delivery.',
    images: [{ url: '/icons/og-image.png', width: 1200, height: 630, alt: 'TMFoodStuff — Fresh Fruits & Vegetables UAE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TMFoodStuff — Fresh Fruits & Vegetables UAE',
    description: 'Premium fresh fruits & vegetables delivered across UAE. Same-day delivery.',
    images: ['/icons/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#16a34a" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-inter`}>
        <Suspense fallback={null}>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  )
}
