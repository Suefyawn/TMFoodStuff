import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import AddressesClient from './AddressesClient'

export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/addresses')
  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('customer_addresses')
    .select('id, label, building, street, area, emirate, makani, is_default, created_at')
    .eq('customer_id', customer.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  return <AddressesClient initialAddresses={data || []} />
}
