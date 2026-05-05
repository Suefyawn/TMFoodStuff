import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { product_id, email } = await request.json()
    if (!product_id || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid product_id and email are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.from('stock_notifications').upsert(
      { product_id: Number(product_id), email: email.trim().toLowerCase() },
      { onConflict: 'product_id,email', ignoreDuplicates: true }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
