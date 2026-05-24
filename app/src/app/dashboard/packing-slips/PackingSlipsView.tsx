'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Leaf } from 'lucide-react'

interface Item {
  id?: number | string
  name?: string
  product_name?: string
  quantity?: number
  unit?: string
  price_aed?: number
}

interface OrderRow {
  id: number
  order_number: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  delivery_emirate: string | null
  delivery_area: string | null
  delivery_building: string | null
  delivery_makani: string | null
  delivery_notes: string | null
  delivery_slot: string | null
  delivery_date: string | null
  items: unknown
  total_aed: number | null
  total: number | null
  payment_method: string | null
  payment_status: string | null
  created_at: string
}

interface BundleComponent { name: string; quantity: number; emoji?: string }

interface Props {
  date: string
  orders: OrderRow[]
  qrs: (string | null)[]
  settings: Record<string, string>
  // Map of product_id → bundle components. Populated only for products
  // that ARE bundles. Picker uses this to expand bundle line items into
  // their constituents on the slip.
  bundleMap: Record<number, BundleComponent[]>
  statusAll: boolean
}

export default function PackingSlipsView({ date, orders, qrs, settings, bundleMap, statusAll }: Props) {
  const router = useRouter()
  const company = settings.company_name || 'TM FoodStuff'

  function changeDate(newDate: string) {
    router.replace(`/dashboard/packing-slips?date=${newDate}${statusAll ? '&status=all' : ''}`)
  }

  return (
    <div className="bg-gray-100 min-h-screen print:bg-white">
      {/* Toolbar (hidden on print) */}
      <div className="print:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-green-700"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to orders
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-gray-500">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={e => changeDate(e.target.value)}
                style={{ colorScheme: 'light' }}
                className="text-sm font-semibold border-2 border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={statusAll}
                onChange={e => router.replace(`/dashboard/packing-slips?date=${date}${e.target.checked ? '&status=all' : ''}`)}
                className="w-4 h-4 accent-green-600"
              />
              Include processing &amp; out-for-delivery (re-print)
            </label>
            <span className="text-xs text-gray-500">{orders.length} order{orders.length === 1 ? '' : 's'}</span>
            <button
              onClick={() => window.print()}
              disabled={orders.length === 0}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Printer size={14} aria-hidden="true" /> Print stack
            </button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-500">
          <p className="text-sm">No matching orders for {date}.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto py-6 print:py-0 print:max-w-none">
          {orders.map((o, idx) => (
            <Slip key={o.id} order={o} qrSvg={qrs[idx]} company={company} settings={settings} bundleMap={bundleMap} />
          ))}
        </div>
      )}

      {/* A4 print layout: one slip per page, no toolbar, no shadows. */}
      <style>{`
        @media print {
          @page { margin: 12mm; size: A4; }
          html, body { background: white !important; }
          .packing-slip { page-break-after: always; box-shadow: none !important; border: 0 !important; margin: 0 !important; }
          .packing-slip:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  )
}

function Slip({ order, qrSvg, company, settings, bundleMap }: { order: OrderRow; qrSvg: string | null; company: string; settings: Record<string, string>; bundleMap: Record<number, BundleComponent[]> }) {
  const items = Array.isArray(order.items) ? (order.items as Item[]) : []
  const total = Number(order.total_aed ?? order.total ?? 0)
  const paymentLabel = order.payment_method === 'card'
    ? (order.payment_status === 'paid' ? 'Card — PAID' : `Card — ${order.payment_status}`)
    : `Cash on Delivery — collect AED ${total.toFixed(2)}`

  return (
    <div className="packing-slip mx-auto mb-6 print:mb-0 max-w-2xl bg-white shadow-md print:shadow-none rounded-lg print:rounded-none overflow-hidden">
      {/* Brand stripe */}
      <div className="bg-green-600 text-white px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Leaf size={18} aria-hidden="true" />
          <span className="font-black text-base">{company} · Packing Slip</span>
        </div>
        <p className="font-mono font-black">#{order.order_number}</p>
      </div>

      <div className="p-6">
        {/* Customer + slot header */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Deliver to</p>
            <p className="text-lg font-black text-gray-900">{order.customer_name || '—'}</p>
            <p className="text-sm text-gray-700 font-bold leading-snug">
              {order.delivery_building && <>{order.delivery_building}<br /></>}
              {order.delivery_area}{order.delivery_emirate ? `, ${order.delivery_emirate}` : ''}
            </p>
            {order.delivery_makani && <p className="text-xs text-gray-500 mt-0.5">Makani: <span className="font-mono">{order.delivery_makani}</span></p>}
            {order.customer_phone && (
              <p className="text-sm text-gray-800 font-bold mt-1 tabular-nums">{order.customer_phone}</p>
            )}
          </div>
          <div className="text-right">
            {qrSvg ? (
              <div className="inline-block bg-white p-1 border border-gray-200 rounded">
                <div className="w-24 h-24" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              </div>
            ) : null}
            <p className="text-[10px] text-gray-500 mt-1 font-mono">{order.order_number}</p>
          </div>
        </div>

        {/* Slot + payment row */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mr-2">Slot</span>
            <span className="font-bold text-gray-900">
              {order.delivery_slot || '—'}
              {order.delivery_date && (
                <span className="text-gray-500 font-normal"> · {new Date(order.delivery_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
              )}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mr-2">Payment</span>
            <span className={`font-bold ${order.payment_method === 'card' && order.payment_status === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
              {paymentLabel}
            </span>
          </div>
        </div>

        {/* Items as a checklist */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-2 w-8 text-[10px] font-bold uppercase tracking-wider text-gray-500">Pack</th>
              <th className="py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Item</th>
              <th className="py-2 px-2 text-right w-16 text-[10px] font-bold uppercase tracking-wider text-gray-500">Qty</th>
              <th className="py-2 pl-2 w-20 text-[10px] font-bold uppercase tracking-wider text-gray-500">Unit</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="py-3 text-xs text-gray-500 italic">No line items.</td></tr>
            ) : items.flatMap((it, i) => {
              const productId = Number((it as { product_id?: number | string; id?: number | string }).product_id ?? it.id)
              const components = Number.isFinite(productId) ? bundleMap[productId] : undefined
              const lineQty = Number(it.quantity ?? 1)
              const rows = [
                <tr key={`it-${i}`} className={`border-b border-gray-100 ${components ? 'bg-amber-50/40' : ''}`}>
                  <td className="py-2.5 pr-2">
                    <span className="inline-block w-5 h-5 border-2 border-gray-400 rounded" aria-label="check box" />
                  </td>
                  <td className="py-2.5 px-2 font-bold text-gray-900">
                    {it.product_name || it.name || `#${it.id ?? i}`}
                    {components && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">Bundle</span>}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-mono text-base text-gray-900">{lineQty}</td>
                  <td className="py-2.5 pl-2 text-gray-600">{it.unit || ''}</td>
                </tr>,
              ]
              // Indented sub-rows for bundle components. Multiply by the
              // bundle's line quantity so "2 boxes" expands the contents.
              if (components) {
                components.forEach((c, ci) => {
                  rows.push(
                    <tr key={`it-${i}-c-${ci}`} className="border-b border-gray-100 bg-amber-50/20">
                      <td className="py-2 pr-2">
                        <span className="inline-block w-3 h-3 border border-gray-400 rounded ml-3" aria-label="check box" />
                      </td>
                      <td className="py-2 px-2 text-gray-700 pl-6">
                        {c.emoji && <span className="mr-1">{c.emoji}</span>}
                        {c.name}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums font-mono text-sm text-gray-700">
                        {Number(c.quantity) * lineQty}
                      </td>
                      <td className="py-2 pl-2 text-gray-500 text-xs">component</td>
                    </tr>
                  )
                })
              }
              return rows
            })}
          </tbody>
        </table>

        {/* Customer note + total */}
        {order.delivery_notes && (
          <div className="mt-4 border-2 border-amber-300 bg-amber-50 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700 mb-0.5">Customer note</p>
            <p className="text-sm text-amber-900 italic leading-snug">{order.delivery_notes}</p>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Packed by: ____________________</p>
            <p className="mt-2">Time: ____________________</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Total</p>
            <p className="text-2xl font-black text-gray-900 tabular-nums">AED {total.toFixed(2)}</p>
          </div>
        </div>

        {settings.invoice_footer_note && (
          <p className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center italic">
            {settings.invoice_footer_note}
          </p>
        )}
      </div>
    </div>
  )
}
