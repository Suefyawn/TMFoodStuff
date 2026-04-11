/**
 * Cookie storage key must match everywhere we use @supabase/ssr createServerClient
 * (login route, middleware, dashboard-auth, logout). See Supabase Next.js SSR docs.
 */
export function getSupabaseAuthCookieOptions(): { name: string } | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return undefined
  try {
    const host = new URL(url).hostname
    const projectRef = host.split('.')[0]
    if (!projectRef) return undefined
    return { name: `sb-${projectRef}-auth-token` }
  } catch {
    return undefined
  }
}
