'use client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ScrollToTop } from '@/components/ScrollToTop'
import LaunchBanner from '@/components/LaunchBanner'
import ServiceAreaBar from '@/components/ServiceAreaBar'
import HtmlWrapper from '@/components/HtmlWrapper'
import MobileNav from '@/components/MobileNav'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import PwaInstallPrompt from '@/components/PwaInstallPrompt'
import ToastContainer from '@/components/ToastContainer'
import CaptureReferral from '@/components/CaptureReferral'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <HtmlWrapper>
      <CaptureReferral />
      <ServiceAreaBar />
      <LaunchBanner />
      <Navbar />
      <div className="pb-16 md:pb-0">
        {children}
      </div>
      <ScrollToTop />
      <Footer />
      <MobileNav />
      <FloatingWhatsApp />
      <PwaInstallPrompt />
      <ToastContainer />
    </HtmlWrapper>
  )
}
