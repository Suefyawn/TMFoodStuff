'use client'
import Link from 'next/link'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { formatAED, calculateTotal } from '@/lib/utils'
import { useLang } from '@/lib/use-lang'

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, subtotal } = useCartStore()
  const sub = subtotal()
  const { vat, deliveryFee, total } = calculateTotal(sub)
  const { lang, tr } = useLang()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShoppingCart size={52} className="text-green-300" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">{tr.cartEmpty}</h1>
        <p className="text-gray-500 mb-2 text-lg">{lang === 'ar' ? 'يبدو أنك لم تضف أي شيء بعد.' : "Looks like you haven't added anything yet."}</p>
        <p className="text-gray-400 text-sm mb-8">{tr.cartEmptySub}</p>
        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
          {tr.startShopping} <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
          <ShoppingCart className="text-green-600" size={24} />
          {tr.yourCart}
          <span className="text-base md:text-lg font-normal text-gray-400">({items.length} {tr.itemsWord})</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors min-h-[44px] px-2"
        >
          <Trash2 size={15} /> {tr.clearAll}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 flex gap-3 md:gap-4 shadow-sm">
              {/* Image */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : item.emoji ? (
                  <span className="text-3xl md:text-4xl">{item.emoji}</span>
                ) : (
                  <Package size={28} className="text-gray-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.slug}`} className="font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-1 text-sm md:text-base">
                  {item.name}
                </Link>
                <p className="text-xs text-gray-400 mb-2 md:mb-3">
                  {lang === 'ar' ? `لكل ${item.unit}` : `per ${item.unit}`}
                </p>

                <div className="flex items-center justify-between gap-2">
                  {/* Qty controls — bigger touch targets on mobile */}
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-green-600 text-white shadow-sm flex items-center justify-center hover:bg-green-700 transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="font-black text-green-700 text-base md:text-lg">{formatAED(item.priceAED * item.quantity)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 md:w-8 md:h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-black text-gray-900 text-xl mb-4">{tr.orderSummary}</h2>
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-800 font-semibold flex flex-col gap-1">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true">🎉</span>
                <span className="font-black">{tr.launchOfferTitle}</span>
              </span>
              <span>{tr.launchOfferBody}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{tr.subtotal} ({items.reduce((s, i) => s + i.quantity, 0)} {tr.itemsWord})</span>
                <span>{formatAED(sub)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{tr.vat}</span>
                <span>{formatAED(vat)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{tr.delivery}</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600 font-semibold">{tr.freeDelivery}</span> : formatAED(deliveryFee)}</span>
              </div>
              <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-800 font-semibold">
                🚚 {tr.freeDeliveryNote}
              </div>
              <div className="border-t-2 pt-4 flex justify-between font-black text-gray-900 text-lg">
                <span>{tr.total}</span>
                <span className="text-green-700">{formatAED(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="w-full mt-6 bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-colors text-lg shadow-lg flex items-center justify-center gap-2"
            >
              {tr.proceedCheckout} <ArrowRight size={18} />
            </Link>
            <Link href="/shop" className="w-full mt-3 text-center text-sm text-gray-500 hover:text-green-600 transition-colors block">
              ← {tr.continueShopping}
            </Link>
            <p className="text-xs text-gray-400 text-center mt-4">
              {lang === 'ar' ? 'جميع الأسعار تشمل ضريبة القيمة المضافة ٥٪' : 'All prices include 5% UAE VAT'}
            </p>
          </div>
        </div>
      </div>

      {/* Sticky checkout button on mobile */}
      <div className="fixed start-0 end-0 p-3 bg-white border-t border-gray-100 shadow-lg md:hidden z-40 bottom-[var(--cart-sticky-bottom-mobile)]">
        <Link
          href="/checkout"
          className="w-full bg-green-600 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 transition-colors"
        >
          {tr.checkout} · {formatAED(total)} <ArrowRight size={18} />
        </Link>
      </div>
      {/* Bottom spacer so content isn't hidden behind sticky bar on mobile */}
      <div className="h-24 md:hidden" />
    </div>
  )
}
