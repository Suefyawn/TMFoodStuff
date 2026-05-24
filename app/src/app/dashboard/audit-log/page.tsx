import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AuditLogClient from './AuditLogClient'

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // Capped at 500 rows. Pagination can come later — for now the actor + action
  // filters in the client narrow it down enough for the launch volumes.
  const { data } = await supabase
    .from('admin_audit_log')
    .select('id, actor_email, action, entity, before, after, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  return <AuditLogClient initialRows={data || []} />
}
