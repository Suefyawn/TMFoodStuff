import { NextResponse } from 'next/server'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

export async function POST(request: Request) {
  const { password } = await request.json()
  
  if (password === DASHBOARD_PASSWORD) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('dashboard_auth', DASHBOARD_PASSWORD, {
      httpOnly: true,
      secure: true,
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
