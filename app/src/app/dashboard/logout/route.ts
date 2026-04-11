import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase-ssr-cookies'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const cookieOpts = getSupabaseAuthCookieOptions()
  const loginUrl = new URL('/dashboard/login', request.url)

  const response = NextResponse.redirect(loginUrl)

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    ...(cookieOpts ? { cookieOptions: cookieOpts } : {}),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.signOut()
  response.cookies.delete('dashboard_auth')
  return response
}
