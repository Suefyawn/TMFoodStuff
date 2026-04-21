import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

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

  if (
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/login') &&
    !pathname.startsWith('/dashboard/logout')
  ) {
    const auth = request.cookies.get('dashboard_auth')?.value
    const expected = await expectedSessionToken()

    // Also accept the legacy cookie value (raw password) so existing sessions
    // from before the hashed-token change stay signed in without a forced logout.
    if (auth !== expected && auth !== DASHBOARD_PASSWORD) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
