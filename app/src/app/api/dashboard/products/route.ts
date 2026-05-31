import { NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDashboardSession, requirePermission } from '@/lib/admin-auth'
import { sendBackInStockEmail } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'
import { parseJsonBody } from '@/lib/validate-body'
import { ProductCreateSchema, ProductUpdateSchema, ProductDeleteSchema } from '@/lib/schemas/products'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// UPDATE product
export async function PATCH(request: Request) {
  if (!(await requirePermission('products.edit'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = await parseJsonBody(request, ProductUpdateSchema)
  if (!parsed.ok) return parsed.response
  const { id, priceAED, isActive, image_urls, image_url, ...updates } = parsed.data
  const supabase = getSupabase()

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  // Normalise camelCase legacy aliases into snake_case before passing through.
  if (priceAED !== undefined) dbUpdates.price_aed = priceAED
  if (isActive !== undefined) dbUpdates.is_active = isActive
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    dbUpdates[key] = value
  }
  // image_urls is the canonical multi-image column; keep image_url in sync as the primary.
  if (image_urls !== undefined) {
    dbUpdates.image_urls = image_urls
    dbUpdates.image_url = image_urls[0] ?? null
  } else if (image_url !== undefined) {
    dbUpdates.image_url = image_url
  }
  if (dbUpdates.compare_at_price_aed === '' || dbUpdates.compare_at_price_aed === 0) {
    dbUpdates.compare_at_price_aed = null
  }

  // Check current stock before updating (for back-in-stock notifications)
  const stockIsBeingRestored = dbUpdates.stock !== undefined && Number(dbUpdates.stock) > 0
  let previousStock = 1 // assume in-stock unless we find otherwise
  if (stockIsBeingRestored) {
    const { data: current } = await supabase.from('products').select('stock, name, slug').eq('id', id).single()
    previousStock = current?.stock ?? 1
    // Fire back-in-stock emails if stock was 0 before
    if (current && previousStock === 0) {
      const { data: notifications } = await supabase
        .from('low_stock_subscriptions')
        .select('email')
        .eq('product_id', id)
        .is('notified_at', null)
      if (notifications && notifications.length > 0) {
        const now = new Date().toISOString()
        // Run the sends after the response so they aren't dropped by the
        // serverless freeze (we mark notified_at below, so a dropped send would
        // never be retried). after() keeps the function alive until they finish.
        const recipients = notifications.map(n => n.email)
        const pname = current.name, pslug = current.slug
        after(() => Promise.allSettled(
          recipients.map(e => sendBackInStockEmail(e, pname, pslug).catch(console.error)),
        ))
        await supabase.from('low_stock_subscriptions')
          .update({ notified_at: now })
          .eq('product_id', id)
          .is('notified_at', null)
      }
    }
  }

  // Capture the pre-update row so the audit log + stock history can record
  // the exact diff (rather than guessing what the operator changed).
  const { data: snapshot } = await supabase
    .from('products')
    .select('id, name, slug, stock, price_aed, is_active, is_featured, is_organic, compare_at_price_aed')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('products').update(dbUpdates).eq('id', id)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }

  // Stock history — only when the operator actually touched the stock value.
  if (snapshot && dbUpdates.stock !== undefined && Number(dbUpdates.stock) !== Number(snapshot.stock)) {
    const session = await getDashboardSession()
    const actorEmail = session.state === 'ok' ? session.email : null
    const after = Number(dbUpdates.stock)
    const before = Number(snapshot.stock ?? 0)
    await supabase.from('product_stock_history').insert({
      product_id: id,
      before,
      after,
      delta: after - before,
      reason: after > before ? 'admin_restock' : 'admin_set',
      actor_email: actorEmail,
    })
  }

  await logAdminAction({
    supabase,
    action: 'product.update',
    entity: `product:${id}`,
    before: snapshot || undefined,
    after: dbUpdates,
  })

  return NextResponse.json({ ok: true })
}

// CREATE product
export async function POST(request: Request) {
  if (!(await requirePermission('products.edit'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = await parseJsonBody(request, ProductCreateSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const supabase = getSupabase()

  // Pre-check slug uniqueness so we can return a friendly 409 instead of the
  // raw Postgres unique-violation error.
  const { data: existingSlug } = await supabase
    .from('products')
    .select('id')
    .eq('slug', body.slug)
    .maybeSingle()
  if (existingSlug) {
    return NextResponse.json(
      { error: `A product with the slug "${body.slug}" already exists. Pick a different slug.` },
      { status: 409 },
    )
  }

  const imageUrls = body.image_urls ?? (body.image_url ? [body.image_url] : [])
  const { data, error } = await supabase.from('products').insert({
    name: body.name,
    name_ar: body.name_ar,
    slug: body.slug,
    category_id: body.category_id ?? null,
    description: body.description,
    price_aed: body.price_aed,
    unit: body.unit,
    stock: body.stock,
    compare_at_price_aed: body.compare_at_price_aed || null,
    is_organic: body.is_organic,
    is_featured: body.is_featured,
    is_active: body.is_active,
    origin: body.origin,
    emoji: body.emoji,
    image_urls: imageUrls,
    image_url: imageUrls[0] ?? null,
  }).select().single()

  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }

  await logAdminAction({
    supabase,
    action: 'product.create',
    entity: `product:${data?.id}`,
    after: { name: data?.name, slug: data?.slug, price_aed: data?.price_aed, stock: data?.stock },
  })

  // Initial stock history entry so the product's full lifetime is auditable.
  if (data?.id && Number(data?.stock ?? 0) > 0) {
    const session = await getDashboardSession()
    await supabase.from('product_stock_history').insert({
      product_id: data.id,
      before: 0,
      after: Number(data.stock),
      delta: Number(data.stock),
      reason: 'admin_restock',
      actor_email: session.state === 'ok' ? session.email : null,
      note: 'initial stock on create',
    })
  }

  return NextResponse.json({ ok: true, product: data })
}

// DELETE product(s) — admin role only; staff can deactivate via PATCH but
// can't permanently delete a product (and lose its history).
export async function DELETE(request: Request) {
  if (!await requirePermission('products.delete')) {
    return NextResponse.json({ error: 'Only admins can delete products.' }, { status: 403 })
  }
  const parsed = await parseJsonBody(request, ProductDeleteSchema)
  if (!parsed.ok) return parsed.response
  const idList = Array.isArray(parsed.data.ids) ? parsed.data.ids : [parsed.data.ids]
  const supabase = getSupabase()

  const { error } = await supabase.from('products').delete().in('id', idList)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }

  await logAdminAction({
    supabase,
    action: 'product.delete',
    entity: idList.length === 1 ? `product:${idList[0]}` : 'product:bulk',
    metadata: { deleted_ids: idList, count: idList.length },
  })

  return NextResponse.json({ ok: true, deleted: idList.length })
}
