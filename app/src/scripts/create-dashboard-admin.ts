/**
 * One-off: create Supabase Auth user + public.profiles row for dashboard login.
 *
 * Usage (from app/ with .env containing service role):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-secure-password' npx tsx src/scripts/create-dashboard-admin.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL?.trim()
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_NAME?.trim() || 'Admin'
const role = (process.env.ADMIN_ROLE || 'owner').toLowerCase() as 'owner' | 'manager' | 'staff'

async function main() {
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars')
    process.exit(1)
  }
  if (!['owner', 'manager', 'staff'].includes(role)) {
    console.error('ADMIN_ROLE must be owner, manager, or staff')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createErr) {
    console.error('auth.admin.createUser:', createErr.message)
    process.exit(1)
  }

  const userId = created.user?.id
  if (!userId) {
    console.error('No user id returned')
    process.exit(1)
  }

  const { error: profileErr } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      role,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (profileErr) {
    console.error('profiles upsert:', profileErr.message)
    process.exit(1)
  }

  console.log(`OK — dashboard user ready`)
  console.log(`  Email: ${email}`)
  console.log(`  Role:  ${role} (profiles)`)
  console.log(`  Id:    ${userId}`)
  console.log(`Sign in at /dashboard/login`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
