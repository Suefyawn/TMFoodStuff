// Mobile-first delivery queue for drivers. Pairs with the picker view —
// orders that picker has marked "processing" land here, ready to load on the
// truck. Driver advances each through "out_for_delivery" → "delivered".
//
// Grouped by emirate then area so the route is obvious at a glance. Each
// card has tap-to-call, WhatsApp, and a "Navigate" link that hands the
// address off to whatever map app the phone has installed.
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient as createBareClient } from '@supabase/supabase-js'
import { getDashboardSession } from '@/lib/admin-auth'
import DeliveriesClient from './DeliveriesClient'

export const dynamic = 'force-dynamic'

interface OrderLite {
  id: number
  order_number: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  delivery_emirate: string | null
  delivery_area: string | null
  delivery_building: string | null
  delivery_makani: string | null
  delivery_notes: string | null
  delivery_slot: string | null
  delivery_date: string | null
  total_aed: number | null
  total: number | null
  payment_method: string | null
  payment_status: string | null
  driver_id: string | null
}

export default async function DeliveriesPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok') redirect('/dashboard/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Resolve the signed-in driver's admin_users.id when the role is driver
  // so we can scope their queue to (assigned to me OR unassigned). This
  // lets a driver still grab a same-day unassigned order without an admin
  // needing to dispatch them by hand.
  let driverId: string | null = null
  if (session.role === 'driver') {
    const bare = createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: row } = await bare
      .from('admin_users')
      .select('id')
      .eq('email', session.email)
      .maybeSingle()
    driverId = row?.id || null
  }

  let query = supabase
    .from('orders')
    .select('id, order_number, status, customer_name, customer_phone, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_notes, delivery_slot, delivery_date, total_aed, total, payment_method, payment_status, driver_id')
    .in('status', ['processing', 'out_for_delivery'])
    .order('delivery_date', { ascending: true, nullsFirst: false })
    .order('delivery_emirate', { ascending: true, nullsFirst: false })
    .order('delivery_area', { ascending: true, nullsFirst: false })

  if (driverId) {
    // Driver-scoped view: their assigned orders + the unassigned pool.
    query = query.or(`driver_id.eq.${driverId},driver_id.is.null`)
  }

  const { data, error } = await query

  return <DeliveriesClient initialOrders={(data || []) as OrderLite[]} errorMessage={error?.message} canClaim={session.role === 'driver'} />
}
