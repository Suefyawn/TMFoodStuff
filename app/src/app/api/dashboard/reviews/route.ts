// Admin moderation: list every review, approve/reject/delete, post an
// admin reply. Audit-logged.
//
// On status change to 'approved', send the customer a notification so
// they know their review is now live. Best-effort.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission, getDashboardSession } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { getResend, FROM_EMAIL } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface PatchBody {
  id?: number | string
  status?: 'approved' | 'rejected' | 'pending'
  admin_reply?: string | null
}
interface DeleteBody { id?: number | string }

export async function PATCH(request: Request) {
  if (!(await requirePermission('reviews.moderate'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await request.json()) as PatchBody
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  const session = await getDashboardSession()
  const actor = session.state === 'ok' ? session.email : 'unknown'

  if (body.status) {
    if (!['approved', 'rejected', 'pending'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    updates.status = body.status
    updates.moderated_at = new Date().toISOString()
    updates.moderator_email = actor
  }
  if (body.admin_reply !== undefined) {
    // Allow clearing the reply by passing empty string / null.
    const trimmed = (body.admin_reply || '').trim().slice(0, 2000)
    updates.admin_reply = trimmed || null
    updates.admin_reply_at = trimmed ? new Date().toISOString() : null
    updates.admin_reply_by = trimmed ? actor : null
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data: before } = await supabase
    .from('product_reviews')
    .select('id, status, customer_id, product_id, title, rating, body, products(name, slug), customers(email, full_name)')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('product_reviews').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Customer notification on first approval transition (pending → approved).
  // Best-effort — never fails the request.
  if (body.status === 'approved' && before && before.status !== 'approved') {
    void notifyCustomerReviewApproved(before as ReviewWithJoins).catch(err => {
      console.error('[reviews] approval email failed:', err)
    })
  }

  await logAdminAction({
    supabase,
    action: 'review.moderate',
    entity: `review:${id}`,
    before: before ? { status: before.status } : undefined,
    after: updates,
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!(await requirePermission('reviews.delete'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await request.json()) as DeleteBody
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = getSupabase()
  const { error } = await supabase.from('product_reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction({ supabase, action: 'review.delete', entity: `review:${id}` })
  return NextResponse.json({ ok: true })
}

interface ReviewWithJoins {
  id: number
  status: string
  rating: number | null
  title: string | null
  body: string | null
  products: { name: string; slug: string } | Array<{ name: string; slug: string }> | null
  customers: { email: string | null; full_name: string | null } | Array<{ email: string | null; full_name: string | null }> | null
}

async function notifyCustomerReviewApproved(review: ReviewWithJoins) {
  const product = Array.isArray(review.products) ? review.products[0] : review.products
  const customer = Array.isArray(review.customers) ? review.customers[0] : review.customers
  if (!product || !customer?.email) return
  const resend = getResend()
  if (!resend) return
  const firstName = (customer.full_name || 'there').split(' ')[0].replace(/[<>&]/g, '')
  const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0))
  await resend.emails.send({
    from: `TM FoodStuff <${FROM_EMAIL}>`,
    to: customer.email,
    subject: 'Your review is live',
    html: `<!DOCTYPE html><html><body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <table width="100%"><tr><td align="center">
        <table width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
          <tr><td style="background:#16a34a;padding:20px 28px;color:#ffffff;font-weight:900;font-size:18px">TM FoodStuff</td></tr>
          <tr><td style="padding:28px;color:#374151;font-size:15px;line-height:1.65">
            <p style="margin:0 0 14px;font-size:16px;color:#111827">Hi ${firstName},</p>
            <p style="margin:0 0 14px">Your review for <strong>${product.name}</strong> is now live. Thanks for sharing!</p>
            <div style="margin:18px 0;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px">
              <p style="margin:0;color:#f59e0b;font-size:18px;letter-spacing:2px">${stars}</p>
              ${review.title ? `<p style="margin:6px 0 0;font-weight:700;color:#111827">${review.title.replace(/[<>&]/g, '')}</p>` : ''}
              ${review.body ? `<p style="margin:6px 0 0;color:#6b7280;font-size:13px;font-style:italic">"${review.body.replace(/[<>&]/g, '').slice(0, 200)}"</p>` : ''}
            </div>
            <p style="margin:18px 0;text-align:center">
              <a href="${SITE_URL}/product/${product.slug}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:800;font-size:14px">See it on the product page →</a>
            </p>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`,
  })
}
