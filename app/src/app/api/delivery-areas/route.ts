import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DELIVERY_EMIRATE, loadDeliveryAreas } from '@/lib/delivery-areas'

// Public: only the area list is exposed, nothing else from settings.
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const areas = await loadDeliveryAreas(supabase)
  return NextResponse.json(
    { emirate: DELIVERY_EMIRATE, areas },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
