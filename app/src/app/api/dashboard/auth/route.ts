import { NextResponse } from 'next/server'
import crypto from 'crypto'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD!

function sessionToken(): string {
  return crypto.createHash('sha256').update(DASHBOARD_PASSWORD).digest('hex')
}

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password === DASHBOARD_PASSWORD) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('dashboard_auth', sessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('dashboard_auth')
  return response
}
