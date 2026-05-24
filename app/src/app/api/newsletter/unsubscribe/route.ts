// Newsletter unsubscribe endpoint. GET so the link in marketing emails is a
// plain anchor — no form, no JS required. Accepts ?email= and removes the
// row (idempotent: returns ok even if the email wasn't subscribed).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { SITE_URL } from '@/lib/site'
import { isValidEmail } from '@/lib/validators'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!rateLimit(`unsubscribe:${getClientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  const url = new URL(request.url)
  const email = url.searchParams.get('email') || ''
  if (!isValidEmail(email)) {
    return NextResponse.redirect(`${SITE_URL}/unsubscribe?status=invalid`, 303)
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  await supabase.from('email_subscribers').delete().eq('email', email.toLowerCase().trim())
  return NextResponse.redirect(`${SITE_URL}/unsubscribe?status=ok&email=${encodeURIComponent(email)}`, 303)
}

// POST for the future React form on /unsubscribe if we ever add a "I'm
// already unsubscribed but want to make sure" UI.
export async function POST(request: Request) {
  if (!rateLimit(`unsubscribe-post:${getClientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  const { email } = await request.json()
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  await supabase.from('email_subscribers').delete().eq('email', email.toLowerCase().trim())
  return NextResponse.json({ ok: true })
}
