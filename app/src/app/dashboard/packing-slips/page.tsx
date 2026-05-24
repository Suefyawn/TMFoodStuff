// Daily packing-slip stack — one slip per order, one page per slip, optimised
// for an A4 printer. Operators land here, pick the date (defaults to today),
// confirm the order count, and hit print. The browser handles the rest via
// `@page` + page-break-after on each slip.
//
// QR on each slip deep-links to the admin order detail page so a packer with
// a phone can pull up the canonical record in one scan.
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { isAdminAuthed } from '@/lib/admin-auth'
import { generateQrSvg } from '@/lib/qr'
import { SITE_URL } from '@/lib/site'
import PackingSlipsView from './PackingSlipsView'

export const dynamic = 'force-dynamic'

interface SearchParams { date?: string; status?: string }

function todayIsoDubai(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())
}

export default async function PackingSlipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')

  const params = await searchParams
  const date = params.date || todayIsoDubai()
  // Default to packable orders. Allow ?status=all to include processing /
  // out_for_delivery for re-prints.
  const statusFilter = params.status === 'all'
    ? ['pending', 'confirmed', 'processing', 'out_for_delivery']
    : ['pending', 'confirmed']

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [ordersRes, settingsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, status, customer_name, customer_phone, customer_email, delivery_emirate, delivery_area, delivery_building, delivery_makani, delivery_notes, delivery_slot, delivery_date, items, total_aed, total, payment_method, payment_status, created_at')
      .eq('delivery_date', date)
      .in('status', statusFilter)
      .order('delivery_slot', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase.from('settings').select('key, value'),
  ])

  const orders = ordersRes.data || []
  const settings: Record<string, string> = {}
  for (const row of settingsRes.data || []) settings[row.key] = row.value

  // Generate a QR per order in parallel. Failures are silently nulled.
  const qrs = await Promise.all(
    orders.map(o => generateQrSvg(`${SITE_URL}/dashboard/orders/${o.id}`)),
  )

  return (
    <PackingSlipsView
      date={date}
      orders={orders}
      qrs={qrs}
      settings={settings}
      statusAll={params.status === 'all'}
    />
  )
}
