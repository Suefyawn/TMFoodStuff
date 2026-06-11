'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Leaf } from 'lucide-react'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    // Clean, neutral placeholder for the premium-grocer look — no emoji.
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <Leaf size={40} className="text-sand" aria-hidden="true" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
      className={className}
      onError={() => setError(true)}
    />
  )
}

export default ProductImage
