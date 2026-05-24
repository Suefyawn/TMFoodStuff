import { notFound, redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import CustomerOrderDetail from './CustomerOrderDetail'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ number: string }> }

export default async function CustomerOrderPage({ params }: Params) {
  const customer = await getCurrentCustomer()
  if (!customer) {
    const { number } = await params
    redirect(`/account/login?next=/account/orders/${encodeURIComponent(number)}`)
  }
  const { number } = await params
  const supabase = getServiceRoleClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_method, payment_status, customer_name, customer_email, customer_phone, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_slot, delivery_date, delivery_notes, subtotal_aed, subtotal, vat_aed, vat, delivery_fee_aed, delivery_fee, promo_code, promo_discount_aed, promo_discount, total_aed, total, items, created_at, placed_at')
    .eq('order_number', number)
    .eq('customer_email', customer.email.toLowerCase())
    .maybeSingle()
  if (!order) notFound()
  return <CustomerOrderDetail order={order} />
}
