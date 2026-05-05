import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await request.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Build category slug → id map
  const { data: cats } = await supabase.from('categories').select('id, slug')
  const catMap: Record<string, number> = {}
  for (const c of (cats || [])) catMap[c.slug] = c.id

  // Fetch existing slugs to distinguish insert vs update
  const slugs = rows.map((r: any) => r.slug).filter(Boolean)
  const { data: existing } = await supabase.from('products').select('id, slug').in('slug', slugs)
  const existingMap: Record<string, number> = {}
  for (const p of (existing || [])) existingMap[p.slug] = p.id

  const imported: string[] = []
  const updated: string[] = []
  const errors: string[] = []

  for (const row of rows) {
    if (!row.name || !row.slug) {
      errors.push(`Row "${row.name || '?'}": name and slug are required`)
      continue
    }

    const price = parseFloat(row.price_aed)
    if (isNaN(price) || price < 0) {
      errors.push(`Row "${row.name}": invalid price "${row.price_aed}"`)
      continue
    }

    const payload = {
      name: String(row.name).trim(),
      name_ar: String(row.name_ar || '').trim(),
      slug: String(row.slug).trim(),
      category_id: catMap[String(row.category_slug || '').trim()] ?? null,
      description: String(row.description || '').trim(),
      price_aed: price,
      unit: String(row.unit || 'kg').trim(),
      stock: Math.max(0, parseInt(row.stock ?? '0', 10) || 0),
      is_active: String(row.is_active).toLowerCase() !== 'false',
      is_featured: String(row.is_featured).toLowerCase() === 'true',
      is_organic: String(row.is_organic).toLowerCase() === 'true',
      origin: String(row.origin || '').trim(),
      emoji: String(row.emoji || '').trim(),
      updated_at: new Date().toISOString(),
    }

    const existingId = existingMap[payload.slug]
    if (existingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', existingId)
      if (error) errors.push(`Row "${row.name}": ${error.message}`)
      else updated.push(row.name)
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) errors.push(`Row "${row.name}": ${error.message}`)
      else imported.push(row.name)
    }
  }

  return NextResponse.json({ ok: true, imported: imported.length, updated: updated.length, errors })
}
