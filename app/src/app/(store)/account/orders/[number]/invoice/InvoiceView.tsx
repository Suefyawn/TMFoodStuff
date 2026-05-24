'use client'
import Link from 'next/link'
import { Printer, ArrowLeft } from 'lucide-react'

interface OrderRow {
  id: number
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_emirate: string | null
  delivery_area: string | null
  delivery_building: string | null
  delivery_makani: string | null
  delivery_slot: string | null
  delivery_date: string | null
  delivery_notes: string | null
  subtotal_aed: number | null
  subtotal: number | null
  vat_aed: number | null
  vat: number | null
  delivery_fee_aed: number | null
  delivery_fee: number | null
  promo_code: string | null
  promo_discount_aed: number | null
  promo_discount: number | null
  points_redeemed: number | null
  points_value_aed: number | null
  total_aed: number | null
  total: number | null
  items: unknown
  created_at: string
}

export default function InvoiceView({ order, settings }: { order: OrderRow; settings: Record<string, string> }) {
  const items = Array.isArray(order.items) ? (order.items as Array<{
    name: string; quantity: number; price_aed: number; unit?: string;
  }>) : []
  const subtotal = Number(order.subtotal_aed ?? order.subtotal ?? 0)
  const vat = Number(order.vat_aed ?? order.vat ?? 0)
  const deliveryFee = Number(order.delivery_fee_aed ?? order.delivery_fee ?? 0)
  const promoDiscount = Number(order.promo_discount_aed ?? order.promo_discount ?? 0)
  const pointsValue = Number(order.points_value_aed ?? 0)
  const total = Number(order.total_aed ?? order.total ?? 0)

  // Invoice number = ORDER_NUMBER itself (UAE FTA allows the order number to
  // double as the tax invoice number provided it's unique and sequential).
  const invoiceDate = new Date(order.created_at)

  return (
    <div className="bg-gray-50 min-h-screen print:bg-white">
      {/* Action bar (hidden when printing) */}
      <div className="print:hidden bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <Link
            href={`/account/orders/${order.order_number}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-green-700"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to order
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Printer size={14} aria-hidden="true" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-3xl mx-auto bg-white print:max-w-none print:mx-0 my-6 print:my-0 shadow-sm print:shadow-none">
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 flex-wrap pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">{settings.company_name || 'TM FoodStuff'}</h1>
              <p className="text-sm text-gray-600 whitespace-pre-line">{settings.company_address || ''}</p>
              {settings.vat_trn && (
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-bold">VAT TRN:</span> {settings.vat_trn}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-700 mb-2">
                Tax Invoice
              </div>
              <p className="text-sm font-mono font-bold text-gray-900">#{order.order_number}</p>
              <p className="text-xs text-gray-500 mt-1">
                {invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-bold">
                Status: {order.status.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Bill to + Deliver to */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-200">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Billed to</p>
              <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{order.customer_email}</p>
              <p className="text-xs text-gray-600">{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Deliver to</p>
              {order.delivery_building && <p className="text-xs text-gray-700">{order.delivery_building}</p>}
              <p className="text-sm font-bold text-gray-900">
                {order.delivery_area}{order.delivery_emirate ? `, ${order.delivery_emirate}` : ''}
              </p>
              {order.delivery_makani && <p className="text-xs text-gray-500 mt-0.5">Makani: {order.delivery_makani}</p>}
              {order.delivery_date && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Slot: {order.delivery_slot} · {new Date(order.delivery_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              )}
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-200">
                <th className="py-2.5 pr-2">Description</th>
                <th className="py-2.5 px-2 text-right w-16">Qty</th>
                <th className="py-2.5 px-2 text-right w-24">Unit price</th>
                <th className="py-2.5 pl-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const lineTotal = Number(item.price_aed) * item.quantity
                return (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 pr-2 text-gray-800">{item.name}{item.unit ? ` (${item.unit})` : ''}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums">AED {Number(item.price_aed).toFixed(2)}</td>
                    <td className="py-2.5 pl-2 text-right font-semibold text-gray-900 tabular-nums">AED {lineTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <dl className="w-full max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal (excl. VAT)" value={`AED ${subtotal.toFixed(2)}`} />
              <Row label="VAT 5%" value={`AED ${vat.toFixed(2)}`} />
              <Row
                label="Delivery"
                value={deliveryFee === 0 ? 'FREE' : `AED ${deliveryFee.toFixed(2)}`}
                accent={deliveryFee === 0 ? 'text-green-700' : ''}
              />
              {promoDiscount > 0 && (
                <Row
                  label={`Promo (${order.promo_code})`}
                  value={`−AED ${promoDiscount.toFixed(2)}`}
                  accent="text-green-700"
                />
              )}
              {pointsValue > 0 && (
                <Row
                  label={`Loyalty points (${order.points_redeemed} pts)`}
                  value={`−AED ${pointsValue.toFixed(2)}`}
                  accent="text-green-700"
                />
              )}
              <div className="pt-2 mt-2 border-t-2 border-gray-300 flex justify-between text-base font-black text-gray-900">
                <dt>Total payable</dt>
                <dd className="tabular-nums">AED {total.toFixed(2)}</dd>
              </div>
              <p className="text-xs text-gray-500 text-right pt-1">
                Paid by: {order.payment_method === 'card'
                  ? (order.payment_status === 'paid' ? 'Card (paid online)' : `Card (${order.payment_status})`)
                  : 'Cash on Delivery'}
              </p>
            </dl>
          </div>

          {/* Footer note */}
          {settings.invoice_footer_note && (
            <p className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
              {settings.invoice_footer_note}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 16mm; }
        }
      `}</style>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-600">{label}</dt>
      <dd className={`tabular-nums ${accent || 'text-gray-900'}`}>{value}</dd>
    </div>
  )
}
