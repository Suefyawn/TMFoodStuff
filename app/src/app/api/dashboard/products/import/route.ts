import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDashboardSession, isAdminAuthed } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const MAX_ROWS = 5000

export async function POST(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await request.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (${rows.length}). Split the file into batches of ${MAX_ROWS} or fewer.` },
      { status: 413 },
    )
  }

  const supabase = getSupabase()

  // Build category slug → id map
  const { data: cats } = await supabase.from('categories').select('id, slug')
  const catMap: Record<string, number> = {}
  for (const c of (cats || [])) catMap[c.slug] = c.id

  // Fetch existing slugs + stock so we can both distinguish insert vs update
  // and write the stock-history delta for each change.
  const slugs = rows.map((r: any) => r.slug).filter(Boolean)
  const { data: existing } = await supabase
    .from('products')
    .select('id, slug, stock')
    .in('slug', slugs)
  const existingMap: Record<string, { id: number; stock: number }> = {}
  for (const p of (existing || [])) existingMap[p.slug] = { id: p.id, stock: Number(p.stock ?? 0) }

  const session = await getDashboardSession()
  const actorEmail = session.state === 'ok' ? session.email : null
  const stockHistoryRows: Array<{
    product_id: number
    before: number
    after: number
    delta: number
    reason: 'admin_set' | 'admin_restock'
    actor_email: string | null
    note: string
  }> = []

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

    const existingEntry = existingMap[payload.slug]
    if (existingEntry) {
      const { error } = await supabase.from('products').update(payload).eq('id', existingEntry.id)
      if (error) {
        errors.push(`Row "${row.name}": ${error.message}`)
      } else {
        updated.push(row.name)
        if (payload.stock !== existingEntry.stock) {
          stockHistoryRows.push({
            product_id: existingEntry.id,
            before: existingEntry.stock,
            after: payload.stock,
            delta: payload.stock - existingEntry.stock,
            reason: payload.stock > existingEntry.stock ? 'admin_restock' : 'admin_set',
            actor_email: actorEmail,
            note: 'CSV import',
          })
        }
      }
    } else {
      const { data: insertedRow, error } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single()
      if (error) {
        errors.push(`Row "${row.name}": ${error.message}`)
      } else {
        imported.push(row.name)
        if (insertedRow && payload.stock > 0) {
          stockHistoryRows.push({
            product_id: insertedRow.id,
            before: 0,
            after: payload.stock,
            delta: payload.stock,
            reason: 'admin_restock',
            actor_email: actorEmail,
            note: 'CSV import — initial stock',
          })
        }
      }
    }
  }

  // Write the stock history in one batched insert. Best-effort: failure
  // doesn't roll back the import (which already succeeded).
  if (stockHistoryRows.length > 0) {
    await supabase.from('product_stock_history').insert(stockHistoryRows)
  }

  await logAdminAction({
    supabase,
    action: 'product.csv_import',
    metadata: {
      rows: rows.length,
      imported: imported.length,
      updated: updated.length,
      errors: errors.length,
      stock_changes: stockHistoryRows.length,
    },
  })

  return NextResponse.json({ ok: true, imported: imported.length, updated: updated.length, errors })
}
