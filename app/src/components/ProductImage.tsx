'use client'
import { useState } from 'react'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  emoji?: string
}

function getProxiedUrl(url?: string): string {
  if (!url) return ''
  // Proxy Barakat CDN images through our API
  if (url.includes('barakatfresh.ae')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

export default function ProductImage({ src, alt, className, emoji }: ProductImageProps) {
  const [error, setError] = useState(false)
  const proxiedSrc = getProxiedUrl(src)

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <span className="text-6xl">{emoji || '🛒'}</span>
      </div>
    )
  }

  return (
    <img
      src={proxiedSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}

// Also export as named export for backwards compatibility
export { ProductImage }
