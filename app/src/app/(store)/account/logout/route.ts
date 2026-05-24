import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

// Signs the customer out and redirects to the home page. GET is intentional
// here so a plain anchor (<a href="/account/logout">) works without JS.
export async function GET() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${SITE_URL}/`, { status: 303 })
}
