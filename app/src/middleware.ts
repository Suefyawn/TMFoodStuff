import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD!

async function expectedSessionToken(): Promise<string> {
  const data = new TextEncoder().encode(DASHBOARD_PASSWORD)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin → /dashboard redirect kept for any bookmarks
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url, 308)
  }

  if (
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/login') &&
    !pathname.startsWith('/dashboard/logout')
  ) {
    const auth = request.cookies.get('dashboard_auth')?.value
    if (!DASHBOARD_PASSWORD) return NextResponse.next()
    const expected = await expectedSessionToken()
    if (auth !== expected) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/admin'],
}
