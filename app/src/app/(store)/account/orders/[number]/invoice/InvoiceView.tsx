'use client'
import Link from 'next/link'
import { Printer, ArrowLeft, MessageCircle, Leaf } from 'lucide-react'
import { SITE_URL } from '@/lib/site'

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
  placed_at?: string | null
}

interface Props {
  order: OrderRow
  settings: Record<string, string>
  // Inline SVG for the QR code that takes the customer to the tracking page.
  // Generated server-side via the `qrcode` lib so the printed page never needs
  // network access to render it. Optional — when missing we hide the QR block.
  qrSvg?: string | null
  // Back-button destination differs between customer (account/order detail)
  // and admin (dashboard order detail) views.
  backHref: string
  backLabel: string
}

// Branded, print-ready Tax Invoice. Used in two places:
//   1. /account/orders/[number]/invoice — customer self-serve
//   2. /dashboard/orders/[id]/invoice   — admin print/save-as-PDF
// The rendered HTML is identical apart from the back-link target.
export default function InvoiceView({ order, settings, qrSvg, backHref, backLabel }: Props) {
  const items = Array.isArray(order.items) ? (order.items as Array<{
    name: string; quantity: number; price_aed: number; unit?: string;
  }>) : []
  const subtotal = Number(order.subtotal_aed ?? order.subtotal ?? 0)
  const vat = Number(order.vat_aed ?? order.vat ?? 0)
  const deliveryFee = Number(order.delivery_fee_aed ?? order.delivery_fee ?? 0)
  const promoDiscount = Number(order.promo_discount_aed ?? order.promo_discount ?? 0)
  const pointsValue = Number(order.points_value_aed ?? 0)
  const total = Number(order.total_aed ?? order.total ?? 0)
  const company = settings.company_name || 'TM FoodStuff'
  const invoiceDate = new Date(order.placed_at || order.created_at)
  const dueLabel = order.payment_method === 'card' && order.payment_status === 'paid' ? 'Paid' : 'Due on delivery'

  return (
    <div className="bg-gray-100 min-h-screen print:bg-white">
      {/* Action bar (hidden when printing) */}
      <div className="print:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-forest-dark transition-colors"
          >
            <ArrowLeft size={14} aria-hidden="true" /> {backLabel}
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Printer size={14} aria-hidden="true" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Invoice canvas */}
      <div className="max-w-3xl mx-auto bg-white print:max-w-none print:mx-0 my-6 print:my-0 shadow-md print:shadow-none rounded-lg print:rounded-none overflow-hidden">
        {/* Brand stripe */}
        <div className="bg-forest text-white px-8 md:px-12 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <Leaf size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-lg leading-tight">{company}</p>
              <p className="text-[11px] uppercase tracking-wider text-green-100 mt-0.5">
                Fresh fruits &amp; vegetables · UAE
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-green-100 font-bold">Tax Invoice</p>
            <p className="font-mono font-black text-lg leading-tight">#{order.order_number}</p>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {/* Company + invoice meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
            <div>
              {settings.company_address && (
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{settings.company_address}</p>
              )}
              {settings.vat_trn && (
                <p className="text-xs text-gray-500 mt-3">
                  <span className="font-bold">VAT TRN:</span> {settings.vat_trn}
                </p>
              )}
            </div>
            <div className="text-right">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-end gap-3">
                  <dt className="text-gray-500">Invoice date</dt>
                  <dd className="font-semibold text-gray-900 tabular-nums">
                    {invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </dd>
                </div>
                <div className="flex justify-end gap-3">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-semibold text-gray-900 uppercase text-xs tracking-wider">
                    {order.status.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div className="flex justify-end gap-3">
                  <dt className="text-gray-500">Payment</dt>
                  <dd className={`font-semibold text-xs uppercase tracking-wider ${dueLabel === 'Paid' ? 'text-forest-dark' : 'text-amber-700'}`}>
                    {dueLabel}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Bill to + Deliver to + QR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-gray-200">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Billed to</p>
              <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
              <p className="text-xs text-gray-600 mt-0.5 break-all">{order.customer_email}</p>
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
                  {order.delivery_slot} · {new Date(order.delivery_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              )}
            </div>
            {qrSvg && (
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Track this order</p>
                <div className="inline-block bg-white p-1.5 border border-gray-200 rounded-lg">
                  <div className="w-24 h-24" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">tmfoodstuff.ae/track</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-50 border-y border-gray-200">
                <th className="py-3 pl-3 pr-2">Description</th>
                <th className="py-3 px-2 text-right w-16">Qty</th>
                <th className="py-3 px-2 text-right w-28">Unit price</th>
                <th className="py-3 pl-2 pr-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const lineTotal = Number(item.price_aed) * item.quantity
                return (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 pl-3 pr-2 text-gray-800">
                      {item.name}{item.unit ? ` (${item.unit})` : ''}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums">AED {Number(item.price_aed).toFixed(2)}</td>
                    <td className="py-2.5 pl-2 pr-3 text-right font-semibold text-gray-900 tabular-nums">AED {lineTotal.toFixed(2)}</td>
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
                accent={deliveryFee === 0 ? 'text-forest-dark' : ''}
              />
              {promoDiscount > 0 && (
                <Row
                  label={`Promo (${order.promo_code})`}
                  value={`−AED ${promoDiscount.toFixed(2)}`}
                  accent="text-forest-dark"
                />
              )}
              {pointsValue > 0 && (
                <Row
                  label={`Loyalty points (${order.points_redeemed} pts)`}
                  value={`−AED ${pointsValue.toFixed(2)}`}
                  accent="text-forest-dark"
                />
              )}
              <div className="pt-3 mt-2 border-t-2 border-gray-900 flex justify-between text-base font-playfair font-bold text-stone-900">
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

          {/* Thank-you footer */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Thank you for choosing {company}.</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Need help? Message us on WhatsApp or visit {SITE_URL.replace(/^https?:\/\//, '')}/track
                </p>
              </div>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971544408411'}?text=${encodeURIComponent(`Hi, I have a question about order ${order.order_number}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="print:hidden inline-flex items-center gap-2 bg-green-50 border border-green-200 text-forest-dark hover:bg-green-100 text-xs font-bold px-3 py-2 rounded-lg transition-colors w-fit"
              >
                <MessageCircle size={12} aria-hidden="true" />
                Contact support
              </a>
            </div>

            {settings.invoice_footer_note && (
              <p className="mt-4 text-xs text-gray-500 text-center leading-relaxed border-t border-gray-100 pt-4">
                {settings.invoice_footer_note}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 14mm; size: A4; }
          html, body { background: white !important; }
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
