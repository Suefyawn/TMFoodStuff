import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import SubNav, { SETTINGS_SUBNAV } from '@/components/dashboard/SubNav'
import AuditLogClient from './AuditLogClient'

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // Newest 500 server-rendered; the client's "Load older events" button pages
  // through the rest via /api/dashboard/audit-log (id-cursor, 200 per page).
  const { data } = await supabase
    .from('admin_audit_log')
    .select('id, actor_email, action, entity, before, after, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6">
      <SubNav items={SETTINGS_SUBNAV} />
      <div className="-mx-4 sm:-mx-6 -mt-5">
        <AuditLogClient initialRows={data || []} />
      </div>
    </div>
  )
}
