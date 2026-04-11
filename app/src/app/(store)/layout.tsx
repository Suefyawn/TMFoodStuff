'use client'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ScrollToTop } from '@/components/ScrollToTop'
import LaunchBanner from '@/components/LaunchBanner'
import HtmlWrapper from '@/components/HtmlWrapper'
import MobileNav from '@/components/MobileNav'
import SkipLink from '@/components/SkipLink'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <HtmlWrapper>
      <SkipLink />
      <LaunchBanner />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <div id="main-content" tabIndex={-1} className="pb-16 md:pb-0 outline-none scroll-mt-20">
        {children}
      </div>
      <ScrollToTop />
      <Footer />
      <MobileNav />
    </HtmlWrapper>
  )
}
