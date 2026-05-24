'use client'
import { useEffect, useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface Review {
  id: number
  rating: number
  body: string | null
  created_at: string
  author: string
}

interface Summary {
  count: number
  average: number
  reviews: Review[]
}

export default function ProductReviews({ productId, productSlug }: { productId: string; productSlug: string }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitDone, setSubmitDone] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${productSlug}/reviews`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
    fetch('/api/account/me').then(r => r.json()).then(d => setSignedIn(!!d?.signedIn)).catch(() => {})
  }, [productSlug])

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
        body: JSON.stringify({ product_id: productId, rating, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || (isAr ? 'تعذّر إرسال التقييم.' : 'Could not submit review.'))
        return
      }
      setSubmitDone(true)
      // Refresh the list to pull in the new review.
      const refreshed = await fetch(`/api/products/${productSlug}/reviews`).then(r => r.json())
      setData(refreshed)
    } catch {
      setSubmitError(isAr ? 'خطأ في الاتصال.' : 'Network error.')
    } finally {
      setSubmitting(false)
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

  const summary = data || { count: 0, average: 0, reviews: [] }

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 md:p-7 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header: average + count */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-xl font-black text-gray-900">{isAr ? 'تقييمات العملاء' : 'Customer reviews'}</h2>
        {summary.count > 0 ? (
          <div className="flex items-center gap-2">
            <Stars value={summary.average} />
            <span className="text-sm font-bold text-gray-900">{summary.average.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({summary.count})</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">{isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</span>
        )}
      </div>

      {/* Write a review (signed in only) */}
      {signedIn && !submitDone && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{isAr ? 'اكتب تقييماً' : 'Write a review'}</p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} ${isAr ? 'نجوم' : 'stars'}`}
                className="p-0.5"
              >
                <Star size={22} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} aria-hidden="true" />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder={isAr ? 'شارك تجربتك مع هذا المنتج (اختياري)' : 'Share your experience with this product (optional)'}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
          {submitError && <p role="alert" className="text-sm text-red-600 mt-2">{submitError}</p>}
          <button
            onClick={submit}
            disabled={submitting}
            className="mt-3 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {submitting ? (isAr ? 'جاري الإرسال…' : 'Submitting…') : (isAr ? 'إرسال التقييم' : 'Submit review')}
          </button>
        </div>
      )}
      {submitDone && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5 text-sm text-green-800">
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
          {isAr ? 'كن أول من يقيّم هذا المنتج.' : 'Be the first to review this product.'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {summary.reviews.map(r => (
            <li key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Stars value={r.rating} size={14} />
                <span className="text-xs font-bold text-gray-700">{r.author}</span>
                <span className="text-xs text-gray-400">
                  · {new Date(r.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {r.body && <p className="text-sm text-gray-700 whitespace-pre-line">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
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
