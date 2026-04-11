import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase-ssr-cookies'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Request-scoped Supabase client with user session from cookies (RLS applies). */
export async function createDashboardSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const cookieOptions = getSupabaseAuthCookieOptions()

  return createServerClient(url, anon, {
    ...(cookieOptions ? { cookieOptions } : {}),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}
