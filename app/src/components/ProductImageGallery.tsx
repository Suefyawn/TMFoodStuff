'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  emoji?: string
  name: string
  isOrganic?: boolean
  isFeatured?: boolean
}

export default function ProductImageGallery({ images, emoji, name, isOrganic, isFeatured }: Props) {
  const [active, setActive] = useState(0)

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative w-full">
        <span className="text-[80px] md:text-[120px]">{emoji}</span>
        <Badges isOrganic={isOrganic} isFeatured={isFeatured} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative w-full group">
        <img
          src={images[active]}
          alt={name}
          className="w-full h-full object-cover transition-opacity duration-200"
          key={images[active]}
        />
        <Badges isOrganic={isOrganic} isFeatured={isFeatured} />

        {/* Arrow navigation — only when multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={18} className="text-gray-800" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={18} className="text-gray-800" />
            </button>

            {/* Dot indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — only when 2+ images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img src={url} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Badges({ isOrganic, isFeatured }: { isOrganic?: boolean; isFeatured?: boolean }) {
  if (!isOrganic && !isFeatured) return null
  return (
    <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2">
      {isOrganic && <span className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow">🌱 Organic</span>}
      {isFeatured && <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1.5 rounded-full shadow">⭐ Featured</span>}
    </div>
  )
}
