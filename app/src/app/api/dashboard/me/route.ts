import { NextResponse } from 'next/server'
import { getDashboardSession } from '@/lib/dashboard-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getDashboardSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    email: session.user.email ?? null,
    role: session.role,
  })
}
