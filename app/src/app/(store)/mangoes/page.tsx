import type { Metadata } from 'next'
import MangoesContent from './MangoesContent'
import { getMangoProducts } from '@/lib/products-api'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml } from '@/lib/json-ld'
import { formatAED } from '@/lib/utils'

export const revalidate = 60

const PAGE_URL = `${SITE_URL}/mangoes`

export const metadata: Metadata = {
  title: 'Mango Season UAE — Fresh Pakistani & Indian Mangoes Delivered',
  description:
    'Mango season is here! Order sweet, juicy Pakistani Chaunsa, Taimoor, Alphonso and Tomy mangoes online. Hand-picked, quality-checked and delivered same-day across Dubai, Abu Dhabi, Sharjah and all UAE emirates.',
  alternates: { canonical: '/mangoes' },
  openGraph: {
    title: 'Mango Season is Here 🥭 — Fresh Mangoes Delivered Across UAE',
    description:
      'Sweet, juicy Pakistani & Indian mangoes — picked fresh, delivered to your door. Same-day delivery across all UAE emirates.',
    url: PAGE_URL,
    type: 'website',
    siteName: 'TMFoodStuff',
    images: [{ url: `${SITE_URL}/mango-hero.jpg`, width: 1216, height: 704, alt: 'Fresh Pakistani mangoes in a box' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mango Season is Here 🥭 — Fresh Mangoes Delivered Across UAE',
    description:
      'Sweet, juicy Pakistani & Indian mangoes — picked fresh, delivered to your door across the UAE.',
    images: [`${SITE_URL}/mango-hero.jpg`],
  },
}

export default async function MangoesPage() {
  const mangoes = await getMangoProducts(12)

  // CollectionPage + ItemList JSON-LD so search engines understand this as a
  // curated seasonal collection and can surface the individual products.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mango Season — Fresh Mangoes Delivered Across UAE',
    url: PAGE_URL,
    description:
      'Seasonal collection of fresh Pakistani and Indian mangoes delivered across the UAE.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: mangoes.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          url: `${SITE_URL}/product/${p.slug}`,
          image: p.imageUrl?.startsWith('http') ? p.imageUrl : `${SITE_URL}${p.imageUrl || ''}`,
          offers: {
            '@type': 'Offer',
            price: p.priceAED.toFixed(2),
            priceCurrency: 'AED',
            availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          description: p.description || `Fresh ${p.name} — ${formatAED(p.priceAED)} per ${p.unit}.`,
        },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <MangoesContent mangoes={mangoes} />
    </>
  )
}
