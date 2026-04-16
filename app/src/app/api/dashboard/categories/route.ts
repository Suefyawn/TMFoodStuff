import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  const { data, error } = await supabase.from('categories').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await request.json()
  const supabase = getSupabase()

  // Whitelist mutable columns. Including foreign-generated columns (like created_at)
  // or relations (categories(...)) would cause the REST PATCH to 400.
  const allowed: Record<string, unknown> = {}
  for (const key of ['name', 'name_ar', 'slug', 'emoji', 'description']) {
    if (key in updates) allowed[key] = (updates as any)[key]
  }

  const { error } = await supabase.from('categories').update(allowed).eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  const supabase = getSupabase()

  const { error } = await supabase.from('categories').delete().eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
