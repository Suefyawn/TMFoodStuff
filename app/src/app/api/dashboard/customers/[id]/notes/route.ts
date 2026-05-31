// Admin-only endpoint to update a customer's internal notes + tier.
// Audit-logged on every change so we can see who promoted whom.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const VALID_TIERS = new Set(['bronze', 'silver', 'gold', 'platinum'])

interface PatchBody { admin_notes?: string; tier?: string }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requirePermission('customers.notes'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = (await request.json()) as PatchBody
  const updates: Record<string, unknown> = {}
  if (typeof body.admin_notes === 'string') {
    updates.admin_notes = body.admin_notes.slice(0, 4000) || null
  }
  if (typeof body.tier === 'string') {
    if (!VALID_TIERS.has(body.tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }
    updates.tier = body.tier
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await supabase.from('customers').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    supabase,
    action: 'customer.notes_or_tier_updated',
    entity: `customer:${id}`,
    after: updates,
  })
  return NextResponse.json({ ok: true })
}
