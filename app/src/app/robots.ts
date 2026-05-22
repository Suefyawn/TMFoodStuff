import type { MetadataRoute } from 'next'

const BASE = 'https://tmfoodstuff.ae'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
