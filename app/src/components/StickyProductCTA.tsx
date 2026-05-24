'use client'
import AddToCartButton from './AddToCartButton'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    priceAED: number
    unit: string
    imageUrl?: string
    emoji?: string
  }
  inStock: boolean
}

// Anchored above MobileNav. We use `calc(4rem + safe-area-inset-bottom)` so
// iOS Safari's home-indicator padding pushes us above the nav instead of
// letting the two collide. MobileNav itself is h-16 + safe-area-pb.
export default function StickyProductCTA({ product, inStock }: Props) {
  if (!inStock) return null

  return (
    <div
      className="md:hidden fixed left-0 right-0 p-3 bg-white border-t border-gray-100 shadow-lg z-40"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <AddToCartButton product={product} size="lg" />
    </div>
  )
}
