// Accounting export hub. Pick a date range, choose which CSV to download.
// All exports are admin-only and stream straight from the API; no caching.
import { redirect } from 'next/navigation'
import { getDashboardSession } from '@/lib/admin-auth'
import AccountingClient from './AccountingClient'

export const dynamic = 'force-dynamic'

export default async function AccountingPage() {
  const session = await getDashboardSession()
  if (session.state !== 'ok' || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/dashboard')
  }
  return <AccountingClient />
}
