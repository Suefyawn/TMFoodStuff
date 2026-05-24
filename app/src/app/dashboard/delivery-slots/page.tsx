// Admin page for managing delivery slots. Admin-only.
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Clock } from 'lucide-react'
import { getDashboardSession } from '@/lib/admin-auth'
import SlotsClient from './SlotsClient'

export const dynamic = 'force-dynamic'

export default async function DeliverySlotsPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || session.role !== 'admin') {
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
      <header className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-cyan-900/40 rounded-xl flex items-center justify-center">
          <Clock size={20} className="text-cyan-300" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Delivery slots</h1>
          <p className="text-gray-500 text-sm">
            What time windows customers can pick at checkout. Cutoffs, capacity, and per-day availability are honoured everywhere.
          </p>
        </div>
      </header>
      <SlotsClient initial={data || []} />
    </div>
  )
}
