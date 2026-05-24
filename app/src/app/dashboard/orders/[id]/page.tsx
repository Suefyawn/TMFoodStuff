import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { User, MapPin, ShoppingBag, Printer } from 'lucide-react'
import OrderStatusUpdater from './OrderStatusUpdater'
import RefundButton from './RefundButton'
import DriverAssigner from './DriverAssigner'
import OrderEditCard from './OrderEditCard'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'
import { getDashboardSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

async function getOrder(id: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('orders').select('*').eq('id', parseInt(id)).single()
  return data
}

async function getStatusHistory(orderId: number) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase
    .from('order_status_history')
    .select('status, changed_at, actor_email, note')
    .eq('order_id', orderId)
    .order('changed_at', { ascending: true })
  return data || []
}

async function getRefunds(orderId: number) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase
    .from('order_refunds')
    .select('id, amount_aed, reason, notes, refund_type, payment_method, stripe_refund_id, restocked, created_at, created_by')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  return data || []
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  const session = await getDashboardSession()
  const isAdmin = session.state === 'ok' && session.role === 'admin'

  if (!order) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Order not found</div>
    </div>
  )

  const [statusHistory, refunds] = await Promise.all([
    getStatusHistory(order.id),
    getRefunds(order.id),
  ])
  const orderTotal = Number(order.total_aed ?? order.total ?? 0)
  const refundedTotal = refunds.reduce((s, r) => s + Number(r.amount_aed), 0)
  const remainingRefundable = Math.max(0, orderTotal - refundedTotal)

  const phone = order.customer_phone || ''
  const waMsg = encodeURIComponent(
    `Hi ${order.customer_name}! Your TMFoodStuff order #${order.order_number} has been confirmed. We'll deliver during your ${order.delivery_slot || 'selected'} slot. Thank you! 🥦`
  )
  const items = order.items || []

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/orders" className="text-gray-500 hover:text-white text-sm transition-colors shrink-0">← Orders</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-white font-black truncate">{order.order_number}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/orders/${order.id}/invoice`}
            className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-bold px-3 sm:px-4 py-2 rounded-xl border border-gray-700 transition-colors"
            title="Open branded receipt for printing or PDF export"
          >
            <Printer size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Print receipt</span>
            <span className="sm:hidden">Print</span>
          </Link>
          {phone && (
            <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${waMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-3 sm:px-4 py-2 rounded-xl transition-colors">
              <span className="hidden sm:inline">WhatsApp Customer</span><span className="sm:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        {/* Cancellation explainer — only renders for cancelled orders that
            captured a reason. Reads-only here; the reason was set at the
            time of cancellation. */}
        {order.status === 'cancelled' && order.cancellation_reason && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-900/40 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-red-300 text-sm font-black">✕</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-300 mb-0.5">Cancellation reason</p>
              <p className="text-sm text-red-100 font-bold">{order.cancellation_reason}</p>
              {order.cancelled_at && (
                <p className="text-[10px] text-red-400 mt-1">
                  {new Date(order.cancelled_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {order.cancelled_by && <> · by {order.cancelled_by}</>}
                </p>
              )}
            </div>
          </div>
        )}

        <OrderStatusUpdater orderId={String(order.id)} currentStatus={order.status || 'pending'} />

        <DriverAssigner orderId={order.id} initialDriverId={order.driver_id || null} />

        {/* Full status timeline with actor + note so admins can see who
            changed what and when — same component the customer sees, with
            the `full` variant turned on. */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-4">Status timeline</h2>
          <div className="[&_p]:!text-gray-300 [&_p.font-bold]:!text-white [&_li_p:not(.font-bold)]:!text-gray-500">
            <OrderStatusTimeline
              history={statusHistory}
              currentStatus={order.status || 'pending'}
              deliveryDate={order.delivery_date}
              deliverySlot={order.delivery_slot}
              variant="full"
            />
          </div>
        </section>

        {isAdmin && remainingRefundable > 0.01 && (
          <RefundButton
            orderId={order.id}
            orderNumber={order.order_number}
            paymentMethod={order.payment_method || 'cod'}
            paymentStatus={order.payment_status || 'pending'}
            totalAed={orderTotal}
            remainingAed={remainingRefundable}
            hasPaymentIntent={!!order.stripe_payment_intent}
          />
        )}

        {refunds.length > 0 && (
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-3 flex items-center gap-2">
              Refunds
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/30 border border-amber-800 rounded px-1.5 py-0.5">
                AED {refundedTotal.toFixed(2)} of {orderTotal.toFixed(2)} refunded
              </span>
            </h3>
            <ul className="divide-y divide-gray-800">
              {refunds.map(r => (
                <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${r.refund_type === 'full' ? 'text-red-300 bg-red-900/40 border border-red-800' : 'text-amber-200 bg-amber-900/40 border border-amber-800'}`}>
                        {r.refund_type}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{r.payment_method}</span>
                      {r.restocked && <span className="text-[10px] font-bold uppercase tracking-wider text-green-300 bg-green-900/40 border border-green-800 rounded px-1.5 py-0.5">restocked</span>}
                      <span className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {r.reason && <p className="text-sm text-gray-300">{r.reason}</p>}
                    {r.notes && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                    {r.stripe_refund_id && <p className="text-[10px] text-gray-600 font-mono mt-1">{r.stripe_refund_id}</p>}
                    {r.created_by && <p className="text-[10px] text-gray-600 mt-0.5">by {r.created_by}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-red-400 tabular-nums">AED {Number(r.amount_aed).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <OrderEditCard
          orderId={order.id}
          status={order.status || 'pending'}
          initial={{
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            delivery_emirate: order.delivery_emirate,
            delivery_area: order.delivery_area,
            delivery_building: order.delivery_building,
            delivery_makani: order.delivery_makani,
            delivery_slot: order.delivery_slot,
            delivery_date: order.delivery_date,
            delivery_notes: order.delivery_notes,
            admin_notes: order.admin_notes,
          }}
        />

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-4 inline-flex items-center gap-2"><User size={16} className="text-gray-400" aria-hidden="true" /> Customer</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-white font-semibold">{order.customer_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-white">{phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-300">{order.customer_email || '—'}</span></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-black mb-4 inline-flex items-center gap-2"><MapPin size={16} className="text-gray-400" aria-hidden="true" /> Delivery</h3>
            <div className="space-y-2 text-sm">
              {order.delivery_date && <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-white font-semibold">{new Date(order.delivery_date + 'T00:00:00').toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Slot</span><span className="text-white font-semibold capitalize">{order.delivery_slot || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="text-white">{order.delivery_area || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Emirate</span><span className="text-white">{order.delivery_emirate || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Building</span><span className="text-gray-300">{order.delivery_building || '—'}</span></div>
              {order.delivery_makani && <div className="flex justify-between"><span className="text-gray-500">Makani</span><span className="text-gray-300">{order.delivery_makani}</span></div>}
              {order.delivery_notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span className="text-yellow-400">{order.delivery_notes}</span></div>}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <h3 className="text-white font-black p-5 border-b border-gray-800 inline-flex items-center gap-2"><ShoppingBag size={16} className="text-gray-400" aria-hidden="true" /> Order Items</h3>
          <div className="divide-y divide-gray-800">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white font-semibold text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity} {item.unit}</p>
                </div>
                <span className="text-green-400 font-bold text-sm">AED {((item.price_aed || item.priceAED || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-gray-800 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>AED {(order.subtotal || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>VAT 5%</span><span>AED {(order.vat || 0).toFixed(2)}</span></div>
            {(order.promo_discount || 0) > 0 && <div className="flex justify-between text-green-400"><span>Promo ({order.promo_code})</span><span>-AED {(order.promo_discount || 0).toFixed(2)}</span></div>}
            <div className="flex justify-between text-white font-black text-base border-t border-gray-700 pt-2"><span>Total</span><span className="text-green-400">AED {(order.total || 0).toFixed(2)}</span></div>
          </div>
        </div>
      </main>
    </div>
  )
}
