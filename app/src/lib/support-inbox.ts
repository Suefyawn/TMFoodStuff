// Helpers for the support-ticket inbox. Resend inbound posts here, the
// admin UI writes replies through here.
import type { SupabaseClient } from '@supabase/supabase-js'

export interface IncomingMessage {
  from_email: string
  from_name?: string | null
  to_email?: string | null
  subject?: string | null
  body_text?: string | null
  body_html?: string | null
  message_id?: string | null   // RFC-5322 Message-ID of the incoming email
  in_reply_to?: string | null  // Header from the customer's reply
}

// Find an existing thread the customer's email belongs to, or create a
// new one. Threading rules, simplest-first:
//
//   1. If in_reply_to matches a previous outbound message_id we've sent,
//      use that thread (most accurate — the customer is replying to a
//      specific email we sent).
//   2. Else if there's an open thread for this email, reuse it (likely
//      the customer is writing a new email but on the same topic).
//   3. Else create a new thread.
//
// This mirrors what Help Scout / Front / Intercom do behind the scenes.
export async function findOrCreateThread(
  supabase: SupabaseClient,
  msg: IncomingMessage,
): Promise<{ id: number; created: boolean }> {
  // Step 1 — in-reply-to match.
  if (msg.in_reply_to) {
    const { data: parent } = await supabase
      .from('support_messages')
      .select('thread_id')
      .eq('message_id', msg.in_reply_to)
      .maybeSingle()
    if (parent?.thread_id) return { id: parent.thread_id, created: false }
  }

  const email = msg.from_email.toLowerCase()

  // Step 2 — recent open thread for the same customer.
  const { data: open } = await supabase
    .from('support_threads')
    .select('id')
    .eq('customer_email', email)
    .in('status', ['open', 'pending_customer'])
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (open?.id) return { id: open.id, created: false }

  // Step 3 — new thread. Try to resolve a customer row by email so the
  // admin UI can link straight to /dashboard/customers/[id].
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name')
    .eq('email', email)
    .maybeSingle()

  const { data: created, error } = await supabase
    .from('support_threads')
    .insert({
      customer_email: email,
      customer_name: msg.from_name || customer?.full_name || null,
      customer_id: customer?.id ?? null,
      subject: msg.subject?.trim().slice(0, 200) || '(no subject)',
      status: 'open',
    })
    .select('id')
    .single()
  if (error || !created) throw error ?? new Error('Thread create failed')
  return { id: created.id, created: true }
}

// Record an inbound message under the right thread. Idempotent on
// (message_id) so a Resend retry doesn't duplicate.
export async function recordInboundMessage(
  supabase: SupabaseClient,
  msg: IncomingMessage,
): Promise<{ thread_id: number; message_id: number; created: boolean }> {
  if (msg.message_id) {
    const { data: existing } = await supabase
      .from('support_messages')
      .select('id, thread_id')
      .eq('message_id', msg.message_id)
      .maybeSingle()
    if (existing) {
      return { thread_id: existing.thread_id, message_id: existing.id, created: false }
    }
  }

  const thread = await findOrCreateThread(supabase, msg)

  const { data: inserted, error } = await supabase
    .from('support_messages')
    .insert({
      thread_id: thread.id,
      direction: 'in',
      from_email: msg.from_email,
      from_name: msg.from_name,
      to_email: msg.to_email,
      subject: msg.subject?.trim().slice(0, 200),
      body_text: msg.body_text?.slice(0, 100_000),
      body_html: msg.body_html?.slice(0, 200_000),
      message_id: msg.message_id,
      in_reply_to: msg.in_reply_to,
    })
    .select('id')
    .single()
  if (error || !inserted) throw error ?? new Error('Inbound insert failed')
  return { thread_id: thread.id, message_id: inserted.id, created: true }
}
