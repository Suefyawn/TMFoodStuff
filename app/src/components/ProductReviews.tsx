'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Star, Loader2, ShieldCheck, ThumbsUp, MessageCircle, X, Camera } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface ReviewImage { url: string; alt?: string }

interface Review {
  id: number
  rating: number
  title: string | null
  body: string | null
  images: ReviewImage[]
  verified_purchase: boolean
  helpful_count: number
  admin_reply: string | null
  admin_reply_at: string | null
  admin_reply_by: string | null
  created_at: string
  author: string
}

interface Summary {
  count: number
  average: number
  breakdown: Record<'1' | '2' | '3' | '4' | '5', number>
  verified_count: number
  has_photos: number
  reviews: Review[]
}

type Filter = '' | 'verified' | 'photos'

export default function ProductReviews({ productId, productSlug }: { productId: string; productSlug: string }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [data, setData] = useState<Summary | null>(null)
  const [filter, setFilter] = useState<Filter>('')
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<ReviewImage[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitDone, setSubmitDone] = useState(false)
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setLoading(true)
    const qs = filter ? `?filter=${filter}` : ''
    fetch(`/api/products/${productSlug}/reviews${qs}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`reviews ${r.status}`))))
      .then(setData)
      .catch(err => console.error('[reviews] load failed:', err))
      .finally(() => setLoading(false))
    // Only fetch the auth state once.
    if (!signedIn) {
      fetch('/api/account/me').then(r => r.json()).then(d => setSignedIn(!!d?.signedIn)).catch(() => {})
    }
  }, [productSlug, filter])

  async function uploadImage(file: File) {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'reviews')
      // Reuse the existing /api/dashboard/upload endpoint — it accepts
      // multipart uploads and returns { url }. Customer-side reviews
      // call into the same path; the endpoint allows reviews uploads
      // for any signed-in user (gated by the customer cookie).
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        setSubmitError(isAr ? 'تعذّر تحميل الصورة.' : 'Image upload failed.')
        return
      }
      const data = await res.json() as { url?: string }
      if (data.url) {
        setImages(prev => [...prev, { url: data.url!, alt: '' }].slice(0, 3))
      }
    } catch {
      setSubmitError(isAr ? 'خطأ في الاتصال.' : 'Network error during upload.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function submit() {
    if (rating < 1) {
      setSubmitError(isAr ? 'اختر تقييماً' : 'Please pick a rating.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/account/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, rating, title, body, images }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || (isAr ? 'تعذّر إرسال التقييم.' : 'Could not submit review.'))
        return
      }
      setSubmitDone(true)
      const refreshed = await fetch(`/api/products/${productSlug}/reviews`).then(r => r.json())
      setData(refreshed)
    } catch {
      setSubmitError(isAr ? 'خطأ في الاتصال.' : 'Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleHelpful(id: number) {
    if (!signedIn) return
    // Optimistic update
    const wasVoted = votedIds.has(id)
    setVotedIds(prev => {
      const next = new Set(prev)
      if (wasVoted) next.delete(id)
      else next.add(id)
      return next
    })
    setData(prev => prev ? {
      ...prev,
      reviews: prev.reviews.map(r => r.id === id ? { ...r, helpful_count: r.helpful_count + (wasVoted ? -1 : 1) } : r),
    } : prev)
    try {
      const res = await fetch(`/api/account/reviews/${id}/vote`, { method: 'POST' })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on failure.
      setVotedIds(prev => {
        const next = new Set(prev)
        if (wasVoted) next.add(id)
        else next.delete(id)
        return next
      })
      setData(prev => prev ? {
        ...prev,
        reviews: prev.reviews.map(r => r.id === id ? { ...r, helpful_count: r.helpful_count + (wasVoted ? 1 : -1) } : r),
      } : prev)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-3 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {isAr ? 'تحميل التقييمات…' : 'Loading reviews…'}
      </div>
    )
  }

  const summary = data || { count: 0, average: 0, breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, verified_count: 0, has_photos: 0, reviews: [] }
  const maxBreakdown = Math.max(...Object.values(summary.breakdown), 1)

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 md:p-7 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <h2 className="text-xl font-black text-gray-900 mb-5">{isAr ? 'تقييمات العملاء' : 'Customer reviews'}</h2>

      {/* Aggregate header — big average + per-star breakdown bars */}
      {summary.count > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-center bg-gray-50 rounded-xl p-4 sm:p-5 mb-5">
          <div className="text-center">
            <p className="text-5xl font-black text-gray-900 leading-none">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} size={14} />
            <p className="text-xs text-gray-500 mt-1">{summary.count} {isAr ? 'تقييم' : `review${summary.count === 1 ? '' : 's'}`}</p>
          </div>
          <div className="space-y-1.5 min-w-0">
            {([5, 4, 3, 2, 1] as const).map(star => {
              const n = summary.breakdown[String(star) as '1'|'2'|'3'|'4'|'5'] || 0
              const pct = (n / maxBreakdown) * 100
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-mono tabular-nums text-gray-500">{star}</span>
                  <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" aria-hidden="true" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-gray-500">{n}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-5">{isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
      )}

      {/* Filter chips */}
      {summary.count > 0 && (summary.verified_count > 0 || summary.has_photos > 0) && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          <FilterChip active={filter === ''} onClick={() => setFilter('')} label={isAr ? `الكل (${summary.count})` : `All (${summary.count})`} />
          {summary.verified_count > 0 && (
            <FilterChip active={filter === 'verified'} onClick={() => setFilter('verified')} label={isAr ? `موثّقة (${summary.verified_count})` : `Verified (${summary.verified_count})`} icon={ShieldCheck} />
          )}
          {summary.has_photos > 0 && (
            <FilterChip active={filter === 'photos'} onClick={() => setFilter('photos')} label={isAr ? `مع صور (${summary.has_photos})` : `With photos (${summary.has_photos})`} icon={Camera} />
          )}
        </div>
      )}

      {/* Write a review */}
      {signedIn && !submitDone && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{isAr ? 'اكتب تقييماً' : 'Write a review'}</p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} ${isAr ? 'نجوم' : 'stars'}`} className="p-0.5">
                <Star size={22} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} aria-hidden="true" />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 120))}
            placeholder={isAr ? 'عنوان قصير (اختياري)' : 'Short title (optional)'}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-forest-light mb-2"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 2000))}
            rows={3}
            placeholder={isAr ? 'شارك تجربتك مع هذا المنتج (اختياري)' : 'Share your experience with this product (optional)'}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-forest-light"
          />
          {/* Image upload */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={isAr ? 'حذف الصورة' : 'Remove image'}
                >
                  <X size={10} aria-hidden="true" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 hover:border-forest-light rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                {uploadingImage
                  ? <Loader2 size={16} className="animate-spin text-gray-400" aria-hidden="true" />
                  : <Camera size={16} className="text-gray-400" aria-hidden="true" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) uploadImage(f)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
          {submitError && <p role="alert" className="text-sm text-red-600 mt-2">{submitError}</p>}
          <button
            onClick={submit}
            disabled={submitting || uploadingImage}
            className="mt-3 inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {submitting ? (isAr ? 'جاري الإرسال…' : 'Submitting…') : (isAr ? 'إرسال التقييم' : 'Submit review')}
          </button>
        </div>
      )}
      {submitDone && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5 text-sm text-forest-dark">
          {isAr ? 'شكراً! تم نشر تقييمك.' : 'Thanks! Your review is live.'}
        </div>
      )}
      {!signedIn && (
        <p className="text-xs text-gray-500 mb-5">
          {isAr
            ? 'سجّل الدخول لكتابة تقييم بعد استلام طلب يحتوي على هذا المنتج.'
            : 'Sign in to write a review (verified buyers only).'}
        </p>
      )}

      {/* Review list */}
      {summary.reviews.length === 0 ? (
        <p className="text-sm text-gray-500">
          {filter
            ? (isAr ? 'لا توجد تقييمات تطابق هذا الفلتر.' : 'No reviews match this filter.')
            : (isAr ? 'كن أول من يقيّم هذا المنتج.' : 'Be the first to review this product.')}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {summary.reviews.map(r => (
            <li key={r.id} className="py-5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Stars value={r.rating} size={14} />
                <span className="text-xs font-bold text-gray-700">{r.author}</span>
                {r.verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-forest-dark bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                    <ShieldCheck size={9} aria-hidden="true" /> {isAr ? 'مشتري موثّق' : 'Verified buyer'}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  · {new Date(r.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {r.title && <p className="text-sm font-bold text-gray-900 mb-1">{r.title}</p>}
              {r.body && <p className="text-sm text-gray-700 whitespace-pre-line">{r.body}</p>}
              {r.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.images.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                      <Image src={img.url} alt={img.alt || ''} fill className="object-cover" sizes="80px" />
                    </a>
                  ))}
                </div>
              )}
              {r.admin_reply && (
                <div className={`mt-3 ${isAr ? 'border-r-2 pr-3' : 'border-l-2 pl-3'} border-forest-light bg-green-50/50 rounded ${isAr ? 'rounded-r-none' : 'rounded-l-none'} py-2 px-3`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-forest-dark mb-0.5 inline-flex items-center gap-1">
                    <MessageCircle size={9} aria-hidden="true" /> {isAr ? 'رد من TM FoodStuff' : 'Response from TM FoodStuff'}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{r.admin_reply}</p>
                </div>
              )}
              {/* Helpful vote */}
              <button
                type="button"
                onClick={() => toggleHelpful(r.id)}
                disabled={!signedIn}
                className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  votedIds.has(r.id)
                    ? 'bg-green-50 border-green-300 text-forest-dark'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                } ${!signedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={!signedIn ? (isAr ? 'سجّل الدخول للتصويت' : 'Sign in to vote') : undefined}
              >
                <ThumbsUp size={11} aria-hidden="true" />
                {isAr ? `مفيد (${r.helpful_count})` : `Helpful (${r.helpful_count})`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FilterChip({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon?: typeof Star }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
        active ? 'bg-green-50 border-forest-light text-forest-dark' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {label}
    </button>
  )
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
