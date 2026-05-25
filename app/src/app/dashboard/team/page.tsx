// Team management — who can sign into the dashboard, with what role.
// Admin-only. Lists every row in admin_users with quick role + active
// toggles + remove buttons. Adds new members by email (they don't need a
// Supabase Auth row yet; one gets created the first time they sign in).
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { getDashboardSession } from '@/lib/admin-auth'
import PageHeader from '@/components/dashboard/PageHeader'
import TeamClient from './TeamClient'
import PermissionsMatrix from './PermissionsMatrix'

export const dynamic = 'force-dynamic'

interface TeamMember {
  id: number
  email: string
  role: 'admin' | 'staff' | 'driver'
  is_active: boolean
  created_at: string
}

export default async function TeamPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || session.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active, created_at')
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeader
        icon={Users}
        iconTone="blue"
        title="Team"
        subtitle="Manage who can sign into the dashboard and what they can see."
      />

      <TeamClient
        initial={(data || []) as TeamMember[]}
        currentEmail={session.email}
      />

      <PermissionsMatrix />
    </div>
  )
}
