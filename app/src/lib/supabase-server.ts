import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server Supabase client (auth-aware) — for Server Components and Route
// Handlers. Resolves the signed-in user from the request cookies.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore — middleware refreshes the session cookies.
          }
        },
      },
    },
  )
}
