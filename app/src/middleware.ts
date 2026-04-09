import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /dashboard routes (not login/logout)
  if (pathname.startsWith('/dashboard') && 
      !pathname.startsWith('/dashboard/login') && 
      !pathname.startsWith('/dashboard/logout')) {

    const hasSbToken =
      request.cookies.has('sb-access-token') ||
      request.cookies.has('sb-refresh-token') ||
      request.cookies.has('sb_dashboard_access_token') ||
      request.cookies.has('sb_dashboard_refresh_token') ||
      // Back-compat: old static password cookie
      request.cookies.has('dashboard_auth')

    if (!hasSbToken) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
