'use client'
import { useState } from 'react'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  emoji?: string
}

export function ProductImage({ src, alt, className, emoji }: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <span className="text-6xl">{emoji || '🛒'}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}

export default ProductImage
