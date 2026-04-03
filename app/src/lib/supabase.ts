import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client (for storefront - reads only)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Service client (for server-side writes - bypasses RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
