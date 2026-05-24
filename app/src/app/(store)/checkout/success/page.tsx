import Link from 'next/link'
import { CheckCircle, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-green-600" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Payment successful!</h1>
      <p className="text-gray-500 mb-2 text-lg">Thank you — your order is confirmed.</p>
      {order && <p className="text-green-700 font-black text-2xl mb-3">#{order}</p>}
      <p className="text-gray-500 mb-8 text-sm max-w-md mx-auto">
        We&apos;ve emailed a receipt and will contact you before delivery.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/track"
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Track Your Order
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <ShoppingBag size={18} />
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
