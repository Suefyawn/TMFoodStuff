import HomeContent from './HomeContent'
import { getFeaturedProducts } from '@/lib/products-api'
import { SITE_URL } from '@/lib/site'

export const revalidate = 60 // Revalidate every 60 seconds

// LocalBusiness JSON-LD so Google can show the store as a rich result with
// hours, location, contact, and customer rating placeholders. Kept inline on
// the home page (one canonical place) rather than the layout to avoid
// repeating it across every URL.
const STORE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'OnlineGrocery',
  name: 'TMFoodStuff',
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon.svg`,
  image: `${SITE_URL}/icons/og-image.png`,
  description: 'Premium fresh fruits & vegetables delivered across the UAE. Same-day delivery in Dubai, Abu Dhabi, Sharjah and all emirates.',
  telephone: '+971544408411',
  email: 'hello@tmfoodstuff.ae',
  priceRange: 'AED',
  paymentAccepted: ['Cash', 'Credit Card'],
  currenciesAccepted: 'AED',
  areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
  address: { '@type': 'PostalAddress', addressCountry: 'AE' },
  sameAs: ['https://wa.me/971544408411'],
}

export default async function HomePage() {
  const featured = await getFeaturedProducts(10)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STORE_JSON_LD) }}
      />
      <HomeContent featuredProducts={featured} />
    </>
  )
}
