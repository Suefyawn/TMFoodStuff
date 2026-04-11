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

export default function StickyProductCTA({ product, inStock }: Props) {
  if (!inStock) return null

  return (
    <div className="md:hidden fixed start-0 end-0 p-3 bg-white border-t border-gray-100 shadow-lg z-40 bottom-[var(--sticky-cta-bottom-mobile)]">
      <AddToCartButton product={product} size="lg" />
    </div>
  )
}
