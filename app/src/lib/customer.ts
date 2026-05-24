// Server-side helper to resolve the customers row for the current Supabase
// Auth user. Lazy-creates the row on first call so a fresh signup gets a
// proper customer record automatically. Returns null when no auth session.
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'

export interface CustomerRecord {
  id: number
  authUserId: string
  email: string
  fullName: string | null
}

export async function getCurrentCustomer(): Promise<CustomerRecord | null> {
  const ssr = await createSupabaseServerClient()
  const {
    data: { user },
  } = await ssr.auth.getUser()
  if (!user?.email) return null

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Match on auth_user_id first; fall back to email so a customer who placed
  // an order as guest before signing up still gets that record linked.
  const { data: existing } = await admin
    .from('customers')
    .select('id, auth_user_id, email, full_name')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .order('auth_user_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Backfill auth_user_id if we matched on email only.
    if (!existing.auth_user_id) {
      await admin.from('customers').update({ auth_user_id: user.id }).eq('id', existing.id)
    }
    return {
      id: existing.id,
      authUserId: user.id,
      email: existing.email || user.email,
      fullName: existing.full_name,
    }
  }

  const fullName = ((user.user_metadata?.full_name as string | undefined) || '').trim() || null
  const { data: inserted, error: insertErr } = await admin
    .from('customers')
    .insert({
      auth_user_id: user.id,
      email: user.email.toLowerCase(),
      full_name: fullName,
    })
    .select('id')
    .single()
  if (insertErr || !inserted) {
    console.error('[customer] failed to create customer record', insertErr)
    return null
  }
  return { id: inserted.id, authUserId: user.id, email: user.email, fullName }
}

export function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
