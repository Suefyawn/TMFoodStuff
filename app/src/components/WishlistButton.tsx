'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/lib/wishlist-store'
import { useLang } from '@/lib/use-lang'

interface WishlistButtonProps {
  productId: string | number
  size?: 'sm' | 'lg'
}

// Toggleable heart for product cards / detail pages. Loads the wishlist state
// once per session; guests get redirected to /account/login on click.
export default function WishlistButton({ productId, size = 'sm' }: WishlistButtonProps) {
  const router = useRouter()
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const has = useWishlistStore(s => s.has(productId))
  const signedIn = useWishlistStore(s => s.signedIn)
  const load = useWishlistStore(s => s.load)
  const toggle = useWishlistStore(s => s.toggle)
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [load])

  async function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const result = await toggle(productId)
    setBusy(false)
    if (result.signedIn === false) {
      // Send guests to login; the button will work on the next visit.
      router.push('/account/login?next=' + encodeURIComponent(window.location.pathname + window.location.search))
    }
  }

  const dimension = size === 'lg' ? 44 : 36
  const iconSize = size === 'lg' ? 20 : 16
  const label = has
    ? (isAr ? 'إزالة من المفضلة' : 'Remove from wishlist')
    : (isAr ? 'أضف إلى المفضلة' : 'Add to wishlist')

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      aria-pressed={has}
      title={label}
      style={{ width: dimension, height: dimension }}
      className={`inline-flex items-center justify-center rounded-full border transition-colors ${
        has
          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
          : 'bg-white/90 backdrop-blur border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200'
      } ${busy ? 'opacity-60 cursor-wait' : 'cursor-pointer'} focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 shadow-sm`}
    >
      <Heart size={iconSize} fill={has && !signedIn ? 'none' : has ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}
