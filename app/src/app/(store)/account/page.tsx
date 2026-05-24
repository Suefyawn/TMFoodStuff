import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AccountClient from './AccountClient'

export const dynamic = 'force-dynamic'

interface OrderRow {
  id: number
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  delivery_slot: string | null
  delivery_emirate: string | null
  delivery_area: string | null
  total: number
  total_aed: number | null
  items: unknown
  created_at: string
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    redirect('/account/login?next=/account')
  }

  // Fetch orders matching this user's email. We use the service role here so
  // we bypass the staff-only RLS policies on the orders table while still
  // restricting the data to the signed-in customer's own email.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await admin
    .from('orders')
    .select('id, order_number, status, payment_method, payment_status, delivery_slot, delivery_emirate, delivery_area, total, total_aed, items, created_at')
    .eq('customer_email', user.email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(50)

  const orders: OrderRow[] = (data || []) as OrderRow[]

  // Pull the customer profile so the account header reflects edits the
  // customer has made to their full_name / phone after signup.
  const { data: profile } = await admin
    .from('customers')
    .select('full_name, phone')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()
  const fullName = (profile?.full_name as string | undefined)
    || (user.user_metadata && (user.user_metadata.full_name as string | undefined))
    || ''
  const phone = (profile?.phone as string | undefined) || ''

  return <AccountClient email={user.email} fullName={fullName} phone={phone} orders={orders} />
}
