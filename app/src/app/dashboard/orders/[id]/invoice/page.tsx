// Admin-side print/save-as-PDF view for any order. Reuses the same branded
// InvoiceView the customer sees so what staff print matches what customers
// archive. Looked up by primary key (admins know order ids, not just numbers).
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { generateQrSvg } from '@/lib/qr'
import { SITE_URL } from '@/lib/site'
import InvoiceView from '@/app/(store)/account/orders/[number]/invoice/InvoiceView'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export const metadata = {
  title: 'Receipt',
  robots: { index: false, follow: false },
}

export default async function AdminInvoicePage({ params }: Params) {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  const { id } = await params
  const orderId = parseInt(id, 10)
  if (!Number.isFinite(orderId)) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [orderRes, settingsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, status, payment_method, payment_status, customer_name, customer_email, customer_phone, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_slot, delivery_date, delivery_notes, subtotal_aed, subtotal, vat_aed, vat, delivery_fee_aed, delivery_fee, promo_code, promo_discount_aed, promo_discount, points_redeemed, points_value_aed, total_aed, total, items, created_at, placed_at')
      .eq('id', orderId)
      .maybeSingle(),
    supabase.from('settings').select('key, value'),
  ])

  const order = orderRes.data
  if (!order) notFound()

  const settings: Record<string, string> = {}
  for (const row of settingsRes.data || []) settings[row.key] = row.value

  const qrSvg = await generateQrSvg(`${SITE_URL}/track?o=${encodeURIComponent(order.order_number)}`)

  return (
    <InvoiceView
      order={order}
      settings={settings}
      qrSvg={qrSvg}
      backHref={`/dashboard/orders/${order.id}`}
      backLabel="Back to order"
    />
  )
}
