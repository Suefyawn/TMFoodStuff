// Standalone trigger for the cart-abandonment sweep. Useful for manual
// testing — the actual scheduled run piggybacks on cleanup-abandoned-orders
// so we don't blow Vercel Hobby's 2-cron limit.
//
// Auth: Bearer CRON_SECRET (Vercel injects it automatically on scheduled runs).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sweepAbandonedCarts } from '@/lib/cart-recovery'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const denied = checkCronAuth(request)
  if (denied) return denied

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const result = await sweepAbandonedCarts(supabase)
  return NextResponse.json(result)
}
