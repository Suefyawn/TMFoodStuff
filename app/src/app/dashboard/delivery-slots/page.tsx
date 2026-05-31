// Admin page for managing delivery slots. Admin-only.
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Clock } from 'lucide-react'
import { getDashboardSession } from '@/lib/admin-auth'
import PageHeader from '@/components/dashboard/PageHeader'
import SubNav, { SETTINGS_SUBNAV } from '@/components/dashboard/SubNav'
import SlotsClient from './SlotsClient'

export const dynamic = 'force-dynamic'

export default async function DeliverySlotsPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/dashboard')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('delivery_slots')
    .select('*')
    .order('position', { ascending: true })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <SubNav items={SETTINGS_SUBNAV} />
      <PageHeader
        icon={Clock}
        iconTone="cyan"
        title="Delivery slots"
        subtitle="What time windows customers can pick at checkout. Cutoffs, capacity, and per-day availability are honoured everywhere."
      />
      <SlotsClient initial={data || []} />
    </div>
  )
}
