import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const c of cookiesToSet) {
          cookieStore.set(c.name, c.value, c.options)
        }
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // @supabase/ssr sets the standard Supabase auth cookies via cookieStore.set(...)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  const response = NextResponse.json({ ok: true })

  // Best-effort cleanup for legacy and current cookie names.
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  cookieStore.delete('sb-access-token.0')
  cookieStore.delete('sb-refresh-token.0')

  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  response.cookies.delete('sb-access-token.0')
  response.cookies.delete('sb-refresh-token.0')
  return response
}
