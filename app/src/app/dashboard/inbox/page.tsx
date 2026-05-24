// Shared support inbox. Two-pane layout: list of threads on the left,
// selected thread + composer on the right. Reads through the admin API
// so the same permission gate (customers.message) applies.
import { redirect } from 'next/navigation'
import { Inbox } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import InboxClient from './InboxClient'

export const dynamic = 'force-dynamic'

interface Thread {
  id: number
  customer_id: number | null
  customer_email: string
  customer_name: string | null
  subject: string | null
  status: 'open' | 'pending_customer' | 'resolved' | 'spam'
  assigned_to: string | null
  last_message_at: string
  last_message_direction: 'in' | 'out'
  message_count: number
  created_at: string
}

export default async function InboxPage() {
  const session = await requirePermission('customers.message')
  if (!session) redirect('/dashboard')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('support_threads')
    .select('id, customer_id, customer_email, customer_name, subject, status, assigned_to, last_message_at, last_message_direction, message_count, created_at')
    .order('last_message_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-900/40 rounded-xl flex items-center justify-center">
          <Inbox size={20} className="text-indigo-300" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Support inbox</h1>
          <p className="text-gray-500 text-sm">Emails to support@ land here. Reply directly — the customer sees it threaded under the original.</p>
        </div>
      </header>
      <InboxClient initialThreads={(data || []) as Thread[]} currentUserEmail={session.email} />
    </div>
  )
}
