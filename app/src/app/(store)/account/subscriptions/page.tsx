import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import SubscriptionsClient from './SubscriptionsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My subscriptions',
  robots: { index: false, follow: false },
}

interface SubItem {
  product_id: number
  name: string
  unit: string
  price_aed: number
  quantity: number
  emoji?: string
}

interface SubRow {
  id: number
  name: string | null
  items: SubItem[]
  frequency_days: number
  delivery_slot: string
  delivery_emirate: string
  delivery_area: string
  delivery_building: string | null
  status: 'active' | 'paused' | 'cancelled'
  next_delivery_date: string
  pause_until: string | null
  last_delivery_date: string | null
  total_orders: number
  created_at: string
  customer_name: string
  customer_phone: string
}

export default async function SubscriptionsPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/subscriptions')
  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('id, name, items, frequency_days, delivery_slot, delivery_emirate, delivery_area, delivery_building, status, next_delivery_date, pause_until, last_delivery_date, total_orders, created_at, customer_name, customer_phone')
    .eq('customer_id', customer.id)
    .order('status', { ascending: true })  // active first
    .order('created_at', { ascending: false })

  return <SubscriptionsClient subscriptions={(data || []) as SubRow[]} />
}
