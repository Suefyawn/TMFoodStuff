// Email delivery status — Resend webhook events (delivered / opened / bounced
// / complained / failed / ...). Visible to staff + admin (analytics.view).
import { redirect } from 'next/navigation'
import { getDashboardSession } from '@/lib/admin-auth'
import { hasPermission } from '@/lib/permissions'
import EmailsClient from './EmailsClient'

export const dynamic = 'force-dynamic'

export default async function EmailsPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || !hasPermission(session.role, 'analytics.view')) {
    redirect('/dashboard')
  }
  return <EmailsClient />
}
