// Marketing prefs + privacy controls. Two cards on one page so customers
// have a single "settings" destination instead of two separate links.
import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import PreferencesClient from './PreferencesClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Preferences',
  robots: { index: false, follow: false },
}

export default async function PreferencesPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/preferences')
  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('customers')
    .select('marketing_email, marketing_sms, marketing_push')
    .eq('id', customer.id)
    .maybeSingle()
  return (
    <PreferencesClient
      initial={{
        email: data?.marketing_email ?? true,
        sms: data?.marketing_sms ?? true,
        push: data?.marketing_push ?? true,
      }}
    />
  )
}
