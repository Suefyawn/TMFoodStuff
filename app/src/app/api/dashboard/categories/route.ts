import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireDashboardStaff } from '@/lib/dashboard-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('categories').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const supabase = getSupabase()

  const { data, error } = await supabase.from('categories').insert({
    name: body.name,
    name_ar: body.name_ar || '',
    slug: body.slug,
    emoji: body.emoji || '',
    description: body.description || '',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, category: data })
}

export async function PUT(request: Request) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response
  const { id, ...updates } = await request.json()
  const supabase = getSupabase()

  const { error } = await supabase.from('categories').update(updates).eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response
  const { id } = await request.json()
  const supabase = getSupabase()

  const { error } = await supabase.from('categories').delete().eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
