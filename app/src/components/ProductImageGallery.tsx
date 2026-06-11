'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn, Leaf, Star } from 'lucide-react'

interface Props {
  images: string[]
  name: string
  isOrganic?: boolean
  isFeatured?: boolean
}

export default function ProductImageGallery({ images, name, isOrganic, isFeatured }: Props) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  // Lock body scroll while the lightbox is open and add keyboard navigation
  // (←/→ for prev/next, Esc to close).
  useEffect(() => {
    if (!lightbox) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length])

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative w-full">
        <Leaf size={96} className="text-sand" strokeWidth={1.25} aria-hidden="true" />
        <Badges isOrganic={isOrganic} isFeatured={isFeatured} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image — click to open lightbox */}
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label={`Zoom in on ${name}`}
        className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative w-full group cursor-zoom-in"
      >
        <Image
          src={images[active]}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="object-cover transition-opacity duration-200"
          key={images[active]}
        />
        <Badges isOrganic={isOrganic} isFeatured={isFeatured} />
        <span className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 bg-white/85 backdrop-blur rounded-full flex items-center justify-center text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} aria-hidden="true" />
        </span>

        {/* Arrow navigation — only when multiple images */}
        {images.length > 1 && (
          <>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft size={18} className="text-gray-800" aria-hidden="true" />
            </span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight size={18} className="text-gray-800" aria-hidden="true" />
            </span>

            {/* Dot indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); setActive(i) }}
                  aria-label={`Image ${i + 1}`}
                  className={`block rounded-full transition-all cursor-pointer ${i === active ? 'bg-white w-4 h-1.5' : 'bg-white/60 w-1.5 h-1.5'}`}
                />
              ))}
            </div>
          </>
        )}
      </button>

      {/* Thumbnail strip — only when 2+ images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-forest-light shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image src={url} alt={`${name} ${i + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — image ${active + 1} of ${images.length}`}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
            aria-label="Close"
            className="absolute top-4 right-4 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div className="relative w-full max-w-5xl aspect-square" onClick={e => e.stopPropagation()}>
            <Image
              src={images[active]}
              alt={name}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  aria-label="Previous image"
                  className="absolute left-2 md:-left-14 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next() }}
                  aria-label="Next image"
                  className="absolute right-2 md:-right-14 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
                <div className="absolute bottom-2 md:-bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-xs font-bold tabular-nums bg-black/40 md:bg-transparent px-3 py-1 rounded-full">
                  {active + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Badges({ isOrganic, isFeatured }: { isOrganic?: boolean; isFeatured?: boolean }) {
  if (!isOrganic && !isFeatured) return null
  return (
    <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2">
      {isOrganic && (
        <span className="inline-flex items-center gap-1 bg-forest-light text-white text-xs font-black px-3 py-1.5 rounded-full shadow">
          <Leaf size={11} aria-hidden="true" /> Organic
        </span>
      )}
      {isFeatured && (
        <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1.5 rounded-full shadow">
          <Star size={11} aria-hidden="true" fill="currentColor" /> Featured
        </span>
      )}
    </div>
  )
}
