import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase-ssr-cookies'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const cookieOpts = getSupabaseAuthCookieOptions()

  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  return response
}

export async function DELETE() {
  const cookieStore = await cookies()
  const cookieOpts = getSupabaseAuthCookieOptions()

  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
