import { NextResponse } from 'next/server'
import { createServerSupabaseAdmin, requireDashboardRole } from '@/lib/dashboard-auth'

export async function PATCH(request: Request) {
  const auth = await requireDashboardRole()
  if (!auth.ok) return auth.response

  const { id, status } = await request.json()
  const supabase = createServerSupabaseAdmin()

  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
