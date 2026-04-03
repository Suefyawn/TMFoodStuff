'use client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ScrollToTop } from '@/components/ScrollToTop'
import LaunchBanner from '@/components/LaunchBanner'
import HtmlWrapper from '@/components/HtmlWrapper'
import MobileNav from '@/components/MobileNav'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <HtmlWrapper>
      <LaunchBanner />
      <Navbar />
      <div className="pb-16 md:pb-0">
        {children}
      </div>
      <ScrollToTop />
      <Footer />
      <MobileNav />
    </HtmlWrapper>
  )
}
