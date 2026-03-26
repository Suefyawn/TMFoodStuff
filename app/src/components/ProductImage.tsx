'use client'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  emoji?: string
}

export function ProductImage({ src, alt, className, emoji }: ProductImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      className={className}
      onError={(e) => {
        const img = e.target as HTMLImageElement
        img.style.display = 'none'
        // Show emoji fallback if available
        if (emoji) {
          const parent = img.parentElement
          if (parent) {
            const span = document.createElement('span')
            span.className = 'text-[120px]'
            span.textContent = emoji
            parent.appendChild(span)
          }
        }
      }}
    />
  )
}
