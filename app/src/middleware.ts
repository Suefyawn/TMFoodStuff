import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /dashboard routes (not login/logout)
  if (pathname.startsWith('/dashboard') && 
      !pathname.startsWith('/dashboard/login') && 
      !pathname.startsWith('/dashboard/logout')) {
    
    const auth = request.cookies.get('dashboard_auth')
    
    if (auth?.value !== DASHBOARD_PASSWORD) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
