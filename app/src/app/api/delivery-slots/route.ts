// Public read endpoint for the storefront checkout slot picker.
//
// GET /api/delivery-slots          → all active slots, no availability info
// GET /api/delivery-slots?date=... → slots with availability for that date
//
// Caching: 30s edge cache, 5min SWR — slot definitions change rarely,
// but capacity counts move with each order. Caller is responsible for
// re-fetching when the customer changes the date.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getActiveSlots, getSlotAvailabilityForDate } from '@/lib/delivery-slots'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const slots = await getSlotAvailabilityForDate(supabase, date)
    return NextResponse.json({ slots }, {
      headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=60' },
    })
  }

  const slots = await getActiveSlots(supabase)
  return NextResponse.json({ slots }, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  })
}
