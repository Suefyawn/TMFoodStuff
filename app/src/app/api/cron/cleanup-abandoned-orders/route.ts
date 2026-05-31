// Cancels card orders that were created more than 24h ago and never paid.
// These are sessions where the customer was redirected to Stripe Checkout but
// closed the tab or otherwise didn't complete payment. Stock was never
// decremented (that only happens in the Stripe webhook), so no restock is
// required — we just mark them cancelled to keep the orders table tidy.
//
// Intended to run from Vercel Cron. Add to vercel.json:
//   { "crons": [{ "path": "/api/cron/cleanup-abandoned-orders", "schedule": "0 * * * *" }] }
// Vercel Cron presents a `x-vercel-cron-signature` header which the platform
// authenticates upstream; we additionally accept a CRON_SECRET bearer token so
// the endpoint stays callable from local/staging.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sweepAbandonedCarts } from '@/lib/cart-recovery'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000

export async function GET(request: Request) {
  const denied = checkCronAuth(request)
  if (denied) return denied

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS).toISOString()

  const { data: abandoned, error: selectErr } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('payment_method', 'card')
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .limit(500)

  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500 })
  }

  if (!abandoned || abandoned.length === 0) {
    return NextResponse.json({ cancelled: 0 })
  }

  const ids = abandoned.map((o) => o.id)
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Piggyback the cart-abandonment sweep here so we stay under Vercel
  // Hobby's 2-cron cap. The sweep is best-effort; its failures never fail
  // this handler.
  const recovery = await sweepAbandonedCarts(supabase).catch(err => {
    console.error('[cleanup-abandoned-orders] cart sweep threw:', err)
    return { scanned: 0, sent: 0, failed: 0, skipped: 0 }
  })

  return NextResponse.json({
    cancelled: abandoned.length,
    order_numbers: abandoned.map((o) => o.order_number),
    cart_recovery: recovery,
  })
}
