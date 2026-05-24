'use client'
import { useEffect } from 'react'
import { useRecentlyViewedStore } from '@/lib/recently-viewed-store'

// Mounts on product detail pages to push the product into the
// recently-viewed history. Headless — no DOM output.
export default function TrackRecentView(props: {
  id: string
  slug: string
  name: string
  nameAr?: string
  imageUrl?: string
  emoji?: string
  priceAED: number
  unit: string
}) {
  const push = useRecentlyViewedStore(s => s.push)
  useEffect(() => { push(props) }, [push, props])
  return null
}
