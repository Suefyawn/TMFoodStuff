'use client'
// Pre-flight cart validation UI.
//
// Mounts inside cart + checkout pages. On mount (and whenever the cart
// item ids change) it POSTs the current cart to /api/cart/validate and
// surfaces any stale-price, out-of-stock, or removed items inline — so
// shoppers can fix issues before filling out the entire checkout form.
//
// Returns a hook so the parent can read the blocking state (to disable
// the checkout button) plus a banner component that renders the summary
// + one-click fix actions.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react'
import { useCartStore, type CartItemPatch } from '@/lib/store'
import { useLang } from '@/lib/use-lang'
import { formatAED } from '@/lib/utils'

interface ValidatedCartItem {
  id: string
  status: 'ok' | 'price_changed' | 'low_stock' | 'oversold' | 'unavailable' | 'removed'
  product: {
    id: number
    name: string
    slug: string
    priceAED: number
    stock: number
    isActive: boolean
    emoji: string | null
  } | null
  was?: { priceAED?: number }
  maxAvailable?: number
}

interface ValidationResult {
  items: ValidatedCartItem[]
  blocking: boolean
}

export function useCartValidation() {
  const items = useCartStore(s => s.items)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)

  // We only need to re-validate when ids or quantities change — re-running
  // on every render would hammer the endpoint. Hash the cart into a key
  // and key the effect off that.
  const cartKey = useMemo(
    () => items.map(i => `${i.id}:${i.quantity}:${i.priceAED}`).sort().join('|'),
    [items],
  )

  const cancelRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      setResult(null)
      return
    }
    cancelRef.current?.abort()
    const ctrl = new AbortController()
    cancelRef.current = ctrl
    setLoading(true)
    fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ id: i.id, quantity: i.quantity, priceAED: i.priceAED })),
      }),
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (ctrl.signal.aborted) return
        if (Array.isArray(data?.items)) setResult(data as ValidationResult)
      })
      .catch(() => { /* offline or aborted — leave previous result */ })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    return () => ctrl.abort()
  }, [cartKey, items])

  return { result, loading }
}

interface CartValidationProps {
  result: ValidationResult | null
}

export function CartValidationBanner({ result }: CartValidationProps) {
  const { lang } = useLang()
  const syncItems = useCartStore(s => s.syncItems)
  const removeItem = useCartStore(s => s.removeItem)
  const [dismissed, setDismissed] = useState(false)

  if (!result) return null
  const issues = result.items.filter(i => i.status !== 'ok' && i.status !== 'low_stock')
  if (issues.length === 0 || dismissed) return null

  const priceChanged = issues.filter(i => i.status === 'price_changed')
  const oversold = issues.filter(i => i.status === 'oversold')
  const unavailable = issues.filter(i => i.status === 'unavailable' || i.status === 'removed')

  function applyAllPriceUpdates() {
    const patches: CartItemPatch[] = priceChanged
      .filter(i => i.product)
      .map(i => ({ id: i.id, priceAED: i.product!.priceAED }))
    if (patches.length > 0) syncItems(patches)
  }

  function applyOversoldFixes() {
    const patches: CartItemPatch[] = oversold.map(i => ({
      id: i.id,
      ...(i.maxAvailable && i.maxAvailable > 0
        ? { quantity: i.maxAvailable }
        : { remove: true }),
    }))
    if (patches.length > 0) syncItems(patches)
  }

  function removeUnavailable() {
    for (const i of unavailable) removeItem(i.id)
  }

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-black text-amber-900 text-sm md:text-base">
              {lang === 'ar' ? 'تحديثات على سلتك' : 'Cart needs an update'}
            </h3>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-amber-700 hover:text-amber-900 p-1 -m-1"
              aria-label={lang === 'ar' ? 'إخفاء' : 'Dismiss'}
            >
              <X size={16} />
            </button>
          </div>

          {unavailable.length > 0 && (
            <div className="mb-3 text-sm">
              <p className="text-amber-900 mb-1.5">
                {lang === 'ar'
                  ? `${unavailable.length} منتج لم يعد متاحاً:`
                  : `${unavailable.length} ${unavailable.length === 1 ? 'item is' : 'items are'} no longer available:`}
              </p>
              <ul className="text-amber-800 space-y-0.5 mb-2">
                {unavailable.map(i => (
                  <li key={i.id} className="text-xs">
                    • {i.product?.name || (lang === 'ar' ? 'منتج محذوف' : 'Removed product')}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={removeUnavailable}
                className="text-xs font-bold bg-amber-900 text-white px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors"
              >
                {lang === 'ar' ? 'إزالة من السلة' : 'Remove from cart'}
              </button>
            </div>
          )}

          {oversold.length > 0 && (
            <div className="mb-3 text-sm">
              <p className="text-amber-900 mb-1.5">
                {lang === 'ar'
                  ? `الكمية المطلوبة غير متاحة لـ ${oversold.length} منتج:`
                  : `Not enough stock for ${oversold.length} ${oversold.length === 1 ? 'item' : 'items'}:`}
              </p>
              <ul className="text-amber-800 space-y-0.5 mb-2">
                {oversold.map(i => (
                  <li key={i.id} className="text-xs">
                    • {i.product?.name} —{' '}
                    {i.maxAvailable && i.maxAvailable > 0
                      ? (lang === 'ar' ? `${i.maxAvailable} متبقي` : `only ${i.maxAvailable} left`)
                      : (lang === 'ar' ? 'نفد المخزون' : 'out of stock')}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={applyOversoldFixes}
                className="text-xs font-bold bg-amber-900 text-white px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors"
              >
                {lang === 'ar' ? 'تعديل الكميات' : 'Adjust quantities'}
              </button>
            </div>
          )}

          {priceChanged.length > 0 && (
            <div className="text-sm">
              <p className="text-amber-900 mb-1.5">
                {lang === 'ar'
                  ? `تغيّر سعر ${priceChanged.length} منتج:`
                  : `Price changed for ${priceChanged.length} ${priceChanged.length === 1 ? 'item' : 'items'}:`}
              </p>
              <ul className="text-amber-800 space-y-0.5 mb-2">
                {priceChanged.map(i => (
                  <li key={i.id} className="text-xs">
                    • {i.product?.name} —{' '}
                    <span className="line-through opacity-70">{formatAED(i.was?.priceAED ?? 0)}</span>
                    {' → '}
                    <span className="font-bold">{formatAED(i.product?.priceAED ?? 0)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={applyAllPriceUpdates}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-900 text-white px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors"
              >
                <RefreshCw size={12} aria-hidden="true" />
                {lang === 'ar' ? 'تحديث الأسعار' : 'Update prices'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CartValidationOkProps {
  result: ValidationResult | null
}

export function CartValidationOk({ result }: CartValidationOkProps) {
  const { lang } = useLang()
  if (!result || result.items.length === 0) return null
  const hasIssues = result.items.some(i => i.status !== 'ok' && i.status !== 'low_stock')
  if (hasIssues) return null
  return (
    <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-forest-dark">
      <CheckCircle size={12} aria-hidden="true" />
      {lang === 'ar' ? 'الأسعار والمخزون محدّثة' : 'Prices and stock are up to date'}
    </div>
  )
}
