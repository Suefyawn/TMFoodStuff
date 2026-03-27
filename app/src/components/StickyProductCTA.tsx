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
    <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-gray-100 shadow-lg z-40">
      <AddToCartButton product={product} size="lg" />
    </div>
  )
}
