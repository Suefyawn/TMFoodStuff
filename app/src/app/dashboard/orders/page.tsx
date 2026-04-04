import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

async function getOrders() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  return data || []
}

export default async function OrdersPage() {
  const orders = await getOrders()
  return <OrdersClient initialOrders={orders} />
}
