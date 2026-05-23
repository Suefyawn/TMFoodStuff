import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  if (!rateLimit(`promo:${getClientIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ valid: false, error: 'Too many attempts. Please try again shortly.' }, { status: 429 })
  }

  const { code } = await request.json()
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('promo_codes')
    .select('code, discount_percent, expires_at, is_active')
    .eq('is_active', true)
    .ilike('code', code.trim())
    .maybeSingle()

  if (error) {
    // Distinguish a real backend failure from a user typing an unknown code,
    // so the customer doesn't see "Invalid or expired" when the DB is down.
    console.error('[promo] lookup failed:', error)
    return NextResponse.json(
      { valid: false, error: 'Could not validate promo code right now. Please try again.' },
      { status: 500 },
    )
  }

  if (!data) return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' })

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Promo code has expired' })
  }

  return NextResponse.json({ valid: true, code: data.code, discountPercent: Number(data.discount_percent) })
}
