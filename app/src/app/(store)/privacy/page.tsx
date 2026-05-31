import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How TMFoodStuff collects, uses, and protects your information when you order fresh produce in the UAE.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-playfair font-bold text-stone-900 mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-stone-600 leading-relaxed">
        <p>Last updated: March 2025</p>
        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-3">Information We Collect</h2>
          <p>We collect information you provide when placing orders: name, phone number, email address, and delivery address. We also collect payment information which is processed securely and never stored on our servers.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-3">How We Use Your Information</h2>
          <p>Your information is used solely to process and deliver your orders, send order confirmations via WhatsApp, and improve our service. We do not sell or share your personal data with third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-3">Contact</h2>
          <p>For privacy-related inquiries, contact us via WhatsApp or email.</p>
        </section>
      </div>
    </div>
  )
}
