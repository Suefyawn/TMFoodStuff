import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`notify-stock:${getClientIp(request)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 })
    }

    const { product_id, email } = await request.json()
    if (!product_id || !email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid product_id and email are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('low_stock_subscriptions').upsert(
      { product_id: Number(product_id), email: email.trim().toLowerCase() },
      { onConflict: 'product_id,email', ignoreDuplicates: true }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
