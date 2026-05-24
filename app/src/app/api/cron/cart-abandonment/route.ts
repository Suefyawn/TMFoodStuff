// Standalone trigger for the cart-abandonment sweep. Useful for manual
// testing — the actual scheduled run piggybacks on cleanup-abandoned-orders
// so we don't blow Vercel Hobby's 2-cron limit.
//
// Auth: Vercel cron signature OR Bearer CRON_SECRET.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sweepAbandonedCarts } from '@/lib/cart-recovery'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const isVercelCron = !!request.headers.get('x-vercel-cron-signature')
  const secret = process.env.CRON_SECRET
  if (!isVercelCron && !(secret && provided === secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const result = await sweepAbandonedCarts(supabase)
  return NextResponse.json(result)
}
