import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin → /dashboard redirect kept for any old bookmarks
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url, 308)
  }

  // Forward the current pathname into the request so server components
  // (notably the dashboard layout, which gates drivers by path) can read it.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refreshes the session if needed and tells us whether the visitor is signed in.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboardProtected =
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/login') &&
    !pathname.startsWith('/dashboard/logout') &&
    // Invite / set-password lands here as a guest; the session arrives in the
    // URL and is applied client-side, so it must not be redirected to login.
    !pathname.startsWith('/dashboard/set-password')

  if (isDashboardProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Customer-facing /account. Sub-pages /login, /signup, /logout are public so
  // an unauthenticated visitor can actually get to the sign-in form.
  const isAccountProtected =
    pathname === '/account' ||
    (pathname.startsWith('/account/') &&
      !pathname.startsWith('/account/login') &&
      !pathname.startsWith('/account/signup') &&
      !pathname.startsWith('/account/logout'))

  if (isAccountProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/account/login'
    url.searchParams.set('next', pathname + (request.nextUrl.search || ''))
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/admin', '/account/:path*', '/account'],
}
