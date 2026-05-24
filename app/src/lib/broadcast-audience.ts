// Resolves the customer set for a broadcast audience tag. Lives in /lib so
// the preview + send route handlers can both reuse it — Route Handlers in
// Next.js may only export GET/POST/etc., so shared helpers must live
// outside the route file.
import type { SupabaseClient } from '@supabase/supabase-js'

export type BroadcastAudience = 'all' | 'recent_60d' | 'lapsed_60d'

export interface BroadcastTarget {
  name: string | null
  email: string | null
  phone: string | null
}

// Source of truth is the orders table — anyone who's ever ordered. We
// dedupe by lower-cased email (else phone) so repeat buyers don't get
// two messages per broadcast.
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

  const seen = new Set<string>()
  const out: BroadcastTarget[] = []
  for (const r of rows) {
    const emailKey = r.customer_email ? r.customer_email.toLowerCase() : ''
    const phoneKey = r.customer_phone ? r.customer_phone.replace(/\D/g, '') : ''
    const key = emailKey || phoneKey
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({
      name: r.customer_name,
      email: r.customer_email,
      phone: r.customer_phone,
    })
  }
  return out
}
