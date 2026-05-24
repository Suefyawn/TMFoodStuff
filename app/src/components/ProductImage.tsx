'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Leaf } from 'lucide-react'

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
        {emoji ? (
          <span className="text-6xl" aria-hidden="true">{emoji}</span>
        ) : (
          <Leaf size={48} className="text-gray-300" aria-hidden="true" />
        )}
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
