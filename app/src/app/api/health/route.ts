// Lightweight health check for uptime monitors and the Vercel platform.
// Returns 200 with build metadata. Deliberately does NOT touch the database —
// a Supabase outage shouldn't take down the health endpoint and cascade into
// auto-rollbacks from external monitors.
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'tmfoodstuff',
    ts: new Date().toISOString(),
    region: process.env.VERCEL_REGION || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
  })
}
