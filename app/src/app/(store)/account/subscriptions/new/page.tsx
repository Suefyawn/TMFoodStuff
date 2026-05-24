import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import NewSubscriptionClient from './NewSubscriptionClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'New subscription',
  robots: { index: false, follow: false },
}

interface Product {
  id: number
  name_en: string | null
  name_ar: string | null
  unit: string | null
  price_aed: number | null
  emoji: string | null
}

interface Address {
  id: number
  label: string | null
  building: string | null
  area: string | null
  emirate: string | null
  makani: string | null
  is_default: boolean
}

export default async function NewSubscriptionPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/subscriptions/new')

  const supabase = getServiceRoleClient()

  const [{ data: products }, { data: addresses }, { data: profile }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name_en, name_ar, unit, price_aed, emoji')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('name_en', { ascending: true })
      .limit(300),
    supabase
      .from('customer_addresses')
      .select('id, label, building, area, emirate, makani, is_default')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false }),
    supabase
      .from('customers')
      .select('full_name, phone')
      .eq('id', customer.id)
      .maybeSingle(),
  ])

  return (
    <NewSubscriptionClient
      products={(products || []) as Product[]}
      addresses={(addresses || []) as Address[]}
      defaultName={profile?.full_name || ''}
      defaultPhone={profile?.phone || ''}
    />
  )
}
