import { createBrowserClient } from '@supabase/ssr'

// Browser Supabase client — used by the dashboard login/logout pages.
// Reads/writes the auth session cookies that the server + middleware consume.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
