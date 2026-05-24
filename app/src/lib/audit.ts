// Append-only audit log of admin actions. Called from every dashboard
// mutation endpoint so every change has a who/what/when trail. Failures
// only log — they must never block the mutation that triggered them.
import type { SupabaseClient } from '@supabase/supabase-js'
import { getDashboardSession } from './admin-auth'

interface AuditWrite {
  supabase: SupabaseClient
  action: string
  entity?: string
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
}

export async function logAdminAction(args: AuditWrite): Promise<void> {
  try {
    const session = await getDashboardSession()
    const actorEmail = session.state === 'ok' ? session.email : 'unknown'
    await args.supabase.from('admin_audit_log').insert({
      actor_email: actorEmail,
      action: args.action,
      entity: args.entity ?? null,
      before: args.before ? JSON.parse(JSON.stringify(args.before)) : null,
      after: args.after ? JSON.parse(JSON.stringify(args.after)) : null,
      metadata: args.metadata ? JSON.parse(JSON.stringify(args.metadata)) : null,
    })
  } catch (err) {
    console.error('[audit] write failed:', err)
  }
}
