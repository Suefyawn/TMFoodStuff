import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ScrollToTop } from '@/components/ScrollToTop'

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
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    url: 'https://tm-food-stuff.vercel.app',
    siteName: 'TMFoodStuff',
    title: 'TMFoodStuff — Fresh Fruits & Vegetables UAE',
    description: 'Premium fresh fruits & vegetables delivered across UAE. Same-day delivery.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-inter`}>
        <Navbar />
        {children}
        <ScrollToTop />
        <Footer />
      </body>
    </html>
  )
}
