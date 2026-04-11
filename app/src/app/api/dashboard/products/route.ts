import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireDashboardStaff } from '@/lib/dashboard-auth'

async function syncPrimaryProductImage(supabase: SupabaseClient, productId: number, imageUrl: string | null | undefined) {
  if (!imageUrl) return
  await supabase.from('product_images').delete().eq('product_id', productId).eq('sort_order', 0)
  await supabase.from('product_images').insert({ product_id: productId, image_url: imageUrl, sort_order: 0 })
}

// UPDATE product
export async function PATCH(request: Request) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response
  const { id, ...updates } = await request.json()
  const supabase = auth.session.supabase

  const dbUpdates: any = { updated_at: new Date().toISOString() }
  if (updates.priceAED !== undefined) dbUpdates.price_aed = updates.priceAED
  if (updates.price_aed !== undefined) dbUpdates.price_aed = updates.price_aed
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.name_ar !== undefined) dbUpdates.name_ar = updates.name_ar
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug
  if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit
  if (updates.origin !== undefined) dbUpdates.origin = updates.origin
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji
  if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url
  if (updates.is_organic !== undefined) dbUpdates.is_organic = updates.is_organic
  if (updates.is_featured !== undefined) dbUpdates.is_featured = updates.is_featured

  const { error } = await supabase.from('products').update(dbUpdates).eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep normalized image table in sync for the primary image.
  if (updates.image_url !== undefined) {
    await syncPrimaryProductImage(supabase, parseInt(id), updates.image_url)
  }
  return NextResponse.json({ ok: true })
}

// CREATE product
export async function POST(request: Request) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const supabase = auth.session.supabase

  const { data, error } = await supabase.from('products').insert({
    name: body.name,
    name_ar: body.name_ar || '',
    slug: body.slug,
    category_id: body.category_id,
    description: body.description || '',
    price_aed: body.price_aed,
    unit: body.unit || 'kg',
    stock: body.stock || 0,
    is_organic: body.is_organic || false,
    is_featured: body.is_featured || false,
    is_active: body.is_active !== false,
    origin: body.origin || '',
    emoji: body.emoji || '',
    image_url: body.image_url || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncPrimaryProductImage(supabase, data.id, data.image_url)
  return NextResponse.json({ ok: true, product: data })
}

// DELETE product(s)
export async function DELETE(request: Request) {
  const auth = await requireDashboardStaff()
  if (!auth.ok) return auth.response
  const { ids } = await request.json()
  const supabase = auth.session.supabase

  const idList = Array.isArray(ids) ? ids : [ids]
  const { error } = await supabase.from('products').delete().in('id', idList.map(Number))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, deleted: idList.length })
}
