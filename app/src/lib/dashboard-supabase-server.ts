import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase-ssr-cookies'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cookie-backed Supabase client for dashboard server code.
 * setAll must not throw in Server Components (Next throws when setting cookies outside Route Handlers).
 */
export async function createDashboardSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const cookieOptions = getSupabaseAuthCookieOptions()

  return createServerClient(url, anon, {
    ...(cookieOptions ? { cookieOptions } : {}),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          /* Server Component / read-only context — middleware refreshes session */
        }
      },
    },
  })
}
