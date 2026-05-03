import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('promo_codes')
    .select('code, discount_percent, expires_at, is_active')
    .eq('is_active', true)
    .ilike('code', code.trim())
    .maybeSingle()

  if (!data) return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' })

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Promo code has expired' })
  }

  return NextResponse.json({ valid: true, code: data.code, discountPercent: Number(data.discount_percent) })
}
