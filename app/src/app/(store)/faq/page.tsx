import type { Metadata } from 'next'
import FaqContent from './FaqContent'
import { FAQS } from './data'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about TM FoodStuff — delivery zones, order changes, payment, freshness guarantee, returns, and more.',
  alternates: { canonical: '/faq' },
}

// Server-rendered JSON-LD lets Google index FAQ rich-results for the page,
// which can win extra real-estate in search. We always emit English Q/As to
// the structured data because that's the dominant search language for the
// site; the visible UI still toggles between EN and AR for the user.
function FaqJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q_en,
      acceptedAnswer: { '@type': 'Answer', text: f.a_en },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default function FaqPage() {
  return (
    <>
      <FaqJsonLd />
      <FaqContent />
    </>
  )
}
