import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase-ssr-cookies'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const cookieOpts = getSupabaseAuthCookieOptions()

  const supabase = createServerClient(url, anon, {
    ...(cookieOpts ? { cookieOptions: cookieOpts } : {}),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboardPage =
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/login') &&
    !pathname.startsWith('/dashboard/logout')

  if (isDashboardPage) {
    const hasLegacy = request.cookies.has('dashboard_auth')
    if (!user && !hasLegacy) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  // Session refresh is handled by getUser() above (do not use getSession() here — it does not
  // revalidate the JWT and can leave cookies stale vs server expectations).

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*'],
}
