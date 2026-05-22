import Link from 'next/link'
import { getDashboardSession } from '@/lib/admin-auth'
import DashboardShell from './DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getDashboardSession()

  if (session.state === 'ok') {
    return <DashboardShell userEmail={session.email}>{children}</DashboardShell>
  }

  if (session.state === 'denied') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-4">🔒</div>
          <h1 className="text-xl font-black text-white mb-2">Access denied</h1>
          <p className="text-gray-500 text-sm mb-6">
            <span className="text-gray-300">{session.email}</span> is not an authorised
            dashboard account. Ask an administrator to add your email to the admin list.
          </p>
          <Link
            href="/dashboard/logout"
            className="inline-block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Sign out
          </Link>
        </div>
      </div>
    )
  }

  // Guest — the unauthenticated /dashboard/login (and /dashboard/logout) pages.
  // Middleware guarantees protected routes never reach here without a session.
  return <>{children}</>
}
