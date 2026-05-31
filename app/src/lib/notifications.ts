// Staff/admin notification routing. Admins manage a list of recipients in the
// dashboard (notification_recipients) and toggle which notification types each
// one receives. This replaces the single ADMIN_EMAIL env var — though that var
// is still honoured as a fallback so alerts are never lost before any
// recipients have been configured.
import { createClient } from '@supabase/supabase-js'

export type NotificationType = 'new_order' | 'low_stock' | 'daily_digest'

const COLUMN: Record<NotificationType, 'notify_new_order' | 'notify_low_stock' | 'notify_daily_digest'> = {
  new_order: 'notify_new_order',
  low_stock: 'notify_low_stock',
  daily_digest: 'notify_daily_digest',
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Returns the active recipient emails subscribed to a given notification type.
// Falls back to ADMIN_EMAIL when no recipients are configured for the type, so
// notifications keep working during initial setup.
export async function getNotificationRecipients(type: NotificationType): Promise<string[]> {
  const column = COLUMN[type]
  try {
    const supabase = serviceClient()
    const { data, error } = await supabase
      .from('notification_recipients')
      .select(`email, ${column}`)
      .eq('is_active', true)
      .eq(column, true)
    if (error) throw error
    const emails = (data || [])
      .map(r => (r as Record<string, unknown>).email)
      .filter((e): e is string => typeof e === 'string' && e.includes('@'))
    if (emails.length > 0) return Array.from(new Set(emails.map(e => e.toLowerCase())))
  } catch (err) {
    console.error('[notifications] recipient lookup failed:', err)
  }
  const fallback = process.env.ADMIN_EMAIL
  return fallback ? [fallback] : []
}
