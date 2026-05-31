// Staff notification recipients + email logo. Admin-only (mirrors the API gate
// requirePermission('settings.edit')).
import { redirect } from 'next/navigation'
import { getDashboardSession } from '@/lib/admin-auth'
import SubNav, { SETTINGS_SUBNAV } from '@/components/dashboard/SubNav'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsSettingsPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || session.role !== 'admin') {
    redirect('/dashboard')
  }
  return (
    <div>
      <SubNav items={SETTINGS_SUBNAV} />
      <NotificationsClient />
    </div>
  )
}
