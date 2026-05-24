import { notFound, redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import InvoiceView from './InvoiceView'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ number: string }> }

export const metadata = {
  title: 'Tax Invoice',
  robots: { index: false, follow: false },
}

export default async function InvoicePage({ params }: Params) {
  const customer = await getCurrentCustomer()
  if (!customer) {
    const { number } = await params
    redirect(`/account/login?next=/account/orders/${encodeURIComponent(number)}/invoice`)
  }
  const { number } = await params
  const supabase = getServiceRoleClient()
  const [orderRes, settingsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, status, payment_method, payment_status, customer_name, customer_email, customer_phone, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_slot, delivery_date, delivery_notes, subtotal_aed, subtotal, vat_aed, vat, delivery_fee_aed, delivery_fee, promo_code, promo_discount_aed, promo_discount, points_redeemed, points_value_aed, total_aed, total, items, created_at, placed_at')
      .eq('order_number', number)
      .eq('customer_email', customer.email.toLowerCase())
      .maybeSingle(),
    supabase.from('settings').select('key, value'),
  ])

  const order = orderRes.data
  if (!order) notFound()

  const settings: Record<string, string> = {}
  for (const row of settingsRes.data || []) settings[row.key] = row.value

  return <InvoiceView order={order} settings={settings} />
}
