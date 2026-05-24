// Web push helpers. VAPID keys live in the `settings` table so they're
// generated once at runtime — no env config required from the operator.
//
// First call to `getVapidKeys()` lazily generates a pair via web-push and
// inserts them. Subsequent calls return the cached row. Both keys are
// stable for the life of the install; rotating them would orphan every
// existing browser subscription.
//
// `sendPushToCustomer` fans out to every subscription belonging to a
// customer. Subscriptions that come back 404/410 (gone) are deleted;
// transient failures are scored up so a perpetually-broken endpoint
// eventually stops being retried.
import 'server-only'
import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceRoleClient } from './customer'
import { SITE_URL } from './site'

export interface VapidKeys {
  publicKey: string
  privateKey: string
  subject: string
}

let cachedKeys: VapidKeys | null = null

export async function getVapidKeys(): Promise<VapidKeys> {
  if (cachedKeys) return cachedKeys
  const supabase = getServiceRoleClient()
  const { data: existing } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['vapid_public_key', 'vapid_private_key', 'vapid_subject'])
  const map: Record<string, string> = {}
  for (const row of existing || []) map[row.key] = row.value

  if (map.vapid_public_key && map.vapid_private_key) {
    cachedKeys = {
      publicKey: map.vapid_public_key,
      privateKey: map.vapid_private_key,
      subject: map.vapid_subject || `mailto:hello@tmfoodstuff.ae`,
    }
    return cachedKeys
  }

  // First-time setup — generate and persist.
  const generated = webpush.generateVAPIDKeys()
  const subject = `mailto:hello@tmfoodstuff.ae`
  await supabase.from('settings').upsert([
    { key: 'vapid_public_key', value: generated.publicKey },
    { key: 'vapid_private_key', value: generated.privateKey },
    { key: 'vapid_subject', value: subject },
  ], { onConflict: 'key' })

  cachedKeys = { publicKey: generated.publicKey, privateKey: generated.privateKey, subject }
  return cachedKeys
}

export async function getVapidPublicKey(): Promise<string> {
  const { publicKey } = await getVapidKeys()
  return publicKey
}

export interface PushPayload {
  title: string
  body: string
  url?: string  // Default: SITE_URL — what /sw.js opens on click.
  tag?: string  // Groups notifications so a new one replaces the old.
  icon?: string
}

interface SubscriptionRow {
  id: number
  endpoint: string
  p256dh: string
  auth: string
  failure_count: number
}

// Returns { sent, failed, removed }. Best-effort — never throws.
export async function sendPushToCustomer(
  supabase: SupabaseClient,
  customerId: number,
  payload: PushPayload,
): Promise<{ sent: number; failed: number; removed: number }> {
  try {
    const keys = await getVapidKeys()
    webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey)

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, failure_count')
      .eq('customer_id', customerId)
      .lt('failure_count', 5)  // Skip endpoints that keep failing.
    const rows = (subs || []) as SubscriptionRow[]
    if (rows.length === 0) return { sent: 0, failed: 0, removed: 0 }

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || SITE_URL,
      tag: payload.tag,
      icon: payload.icon || '/icons/icon-192.png',
    })

    let sent = 0, failed = 0, removed = 0
    for (const r of rows) {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          body,
        )
        sent++
        await supabase
          .from('push_subscriptions')
          .update({ last_seen_at: new Date().toISOString(), failure_count: 0 })
          .eq('id', r.id)
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Browser unsubscribed permanently — drop the row.
          await supabase.from('push_subscriptions').delete().eq('id', r.id)
          removed++
        } else {
          failed++
          await supabase
            .from('push_subscriptions')
            .update({
              failure_count: r.failure_count + 1,
              last_failure_at: new Date().toISOString(),
            })
            .eq('id', r.id)
        }
      }
    }
    return { sent, failed, removed }
  } catch (err) {
    console.error('[push] sendPushToCustomer failed:', err)
    return { sent: 0, failed: 0, removed: 0 }
  }
}

// Fan out to a list of customer ids. Used by the broadcast composer.
export async function sendPushToCustomers(
  supabase: SupabaseClient,
  customerIds: number[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number; removed: number }> {
  let totals = { sent: 0, failed: 0, removed: 0 }
  for (const id of customerIds) {
    const r = await sendPushToCustomer(supabase, id, payload)
    totals.sent += r.sent
    totals.failed += r.failed
    totals.removed += r.removed
  }
  return totals
}
