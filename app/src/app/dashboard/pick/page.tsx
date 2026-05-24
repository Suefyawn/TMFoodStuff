// Mobile-first picking queue for warehouse staff.
//
// Shows every undelivered/un-cancelled order grouped by delivery date so the
// picker can work through "today" first. Order detail expands inline with
// big tap-target checkboxes for each line item; ticked state is persisted
// to localStorage keyed by order id so closing the tab doesn't lose
// progress. When every item is ticked, "Mark packed" advances the order's
// status to `processing` via the existing PATCH endpoint.
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { isAdminAuthed } from '@/lib/admin-auth'
import PickerClient from './PickerClient'

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
  delivery_slot: string | null
  delivery_date: string | null
  items: unknown
  total_aed: number | null
  total: number | null
  created_at: string
}

export default async function PickerPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // Anything that still needs packing — pending or confirmed. Once status
  // advances to processing/out_for_delivery/delivered, it leaves the queue.
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, customer_name, customer_phone, delivery_emirate, delivery_area, delivery_building, delivery_slot, delivery_date, items, total_aed, total, created_at')
    .in('status', ['pending', 'confirmed'])
    .order('delivery_date', { ascending: true, nullsFirst: false })
    .order('delivery_slot', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  return <PickerClient initialOrders={(data || []) as OrderLite[]} errorMessage={error?.message} />
}
