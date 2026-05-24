// Resolves the customer set for a broadcast audience tag. Lives in /lib so
// the preview + send route handlers can both reuse it — Route Handlers in
// Next.js may only export GET/POST/etc., so shared helpers must live
// outside the route file.
import type { SupabaseClient } from '@supabase/supabase-js'

export type BroadcastAudience = 'all' | 'recent_60d' | 'lapsed_60d'

export interface BroadcastTarget {
  name: string | null
  email: string | null  // null means this customer opted out of marketing email
  phone: string | null  // null means this customer opted out of marketing SMS
}

// Source of truth is the orders table — anyone who's ever ordered. We
// dedupe by lower-cased email (else phone) so repeat buyers don't get
// two messages per broadcast.
//
// Marketing preferences are honoured: a customer who set marketing_email=false
// has their `email` field nulled out here (likewise SMS). Transactional sends
// don't go through this function so order confirmations etc. still reach them.
export async function resolveAudience(
  supabase: SupabaseClient,
  audience: BroadcastAudience,
): Promise<BroadcastTarget[]> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  let query = supabase
    .from('orders')
    .select('customer_name, customer_email, customer_phone, created_at')
    .neq('status', 'cancelled')

  if (audience === 'recent_60d') {
    query = query.gte('created_at', since)
  } else if (audience === 'lapsed_60d') {
    query = query.lt('created_at', since)
  }

  const { data } = await query.order('created_at', { ascending: false }).limit(5000)
  const rows = (data || []) as Array<{ customer_name: string | null; customer_email: string | null; customer_phone: string | null }>

  // Look up marketing prefs + deletion state for every email we see, in
  // one round trip. Customers without a customers row (guests) get the
  // defaults (opted in to everything).
  const emails = Array.from(new Set(rows.map(r => (r.customer_email || '').toLowerCase()).filter(Boolean)))
  const prefsByEmail = new Map<string, { email: boolean; sms: boolean; deleted: boolean }>()
  if (emails.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('email, marketing_email, marketing_sms, deleted_at')
      .in('email', emails)
    for (const c of customers || []) {
      prefsByEmail.set((c.email || '').toLowerCase(), {
        email: !!c.marketing_email,
        sms: !!c.marketing_sms,
        deleted: !!c.deleted_at,
      })
    }
  }

  const seen = new Set<string>()
  const out: BroadcastTarget[] = []
  for (const r of rows) {
    const emailKey = r.customer_email ? r.customer_email.toLowerCase() : ''
    const phoneKey = r.customer_phone ? r.customer_phone.replace(/\D/g, '') : ''
    const key = emailKey || phoneKey
    if (!key || seen.has(key)) continue
    seen.add(key)
    const prefs = emailKey ? prefsByEmail.get(emailKey) : undefined
    // Skip soft-deleted customers entirely.
    if (prefs?.deleted) continue
    out.push({
      name: r.customer_name,
      // Null out the channels the customer opted out of so the
      // downstream send loop naturally skips them.
      email: (prefs && prefs.email === false) ? null : r.customer_email,
      phone: (prefs && prefs.sms === false) ? null : r.customer_phone,
    })
  }
  return out
}
