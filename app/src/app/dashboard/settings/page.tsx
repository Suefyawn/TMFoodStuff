// Store settings + promo codes — admin-only. The server gate here mirrors the
// API (requirePermission('settings.edit') is admin-only), so staff/drivers
// who navigate directly to /dashboard/settings are bounced rather than shown
// an editor that would only 403 on every call.
import { redirect } from 'next/navigation'
import { getDashboardSession } from '@/lib/admin-auth'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/dashboard')
  }
  return <SettingsClient />
}
