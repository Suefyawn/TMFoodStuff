// Pre-flight cart validation.
//
// Storefront calls this with the current local cart so we can warn the
// shopper about stale items BEFORE they fill out the whole checkout form.
// /api/orders also re-validates server-side at submit time — this endpoint
// just moves the same checks earlier in the flow for better UX.
//
// Returns one entry per cart line with a status of:
//   ok            — nothing wrong, ship it
//   price_changed — DB price differs from client price (non-blocking)
//   low_stock     — stock <= 5 and enough for the requested qty (informational)
//   oversold      — stock < requested qty (blocking)
//   unavailable   — product is_active = false (blocking)
//   removed       — product row is gone (blocking)
//
// Plus an aggregate `blocking` flag so the checkout button can be disabled
// in one check.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { round2 } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

interface CartInput {
  id: string | number
  quantity: number
  priceAED?: number
}

interface ProductSnapshot {
  id: number
  name: string
  slug: string
  priceAED: number
  stock: number
  isActive: boolean
  emoji: string | null
}

export interface ValidatedCartItem {
  id: string
  status: 'ok' | 'price_changed' | 'low_stock' | 'oversold' | 'unavailable' | 'removed'
  product: ProductSnapshot | null
  // What the client thought, when relevant for the action ("update price from X to Y").
  was?: { priceAED?: number }
  // Convenience: max units the customer can keep — set for oversold/low_stock.
  maxAvailable?: number
}

export async function POST(request: Request) {
  let body: { items?: CartInput[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const inputs = Array.isArray(body.items) ? body.items : []
  if (inputs.length === 0) {
    return NextResponse.json({ items: [], blocking: false })
  }

  // Aggregate quantities by id — defensive against a duplicated cart line.
  const cleaned = new Map<string, { quantity: number; priceAED?: number }>()
  for (const it of inputs) {
    const id = String(it?.id ?? '').trim()
    const qty = Math.floor(Number(it?.quantity))
    if (!id || !Number.isFinite(qty) || qty <= 0) continue
    const prev = cleaned.get(id)
    cleaned.set(id, {
      quantity: (prev?.quantity || 0) + qty,
      priceAED: it.priceAED ?? prev?.priceAED,
    })
  }
  const productIds = Array.from(cleaned.keys())
  if (productIds.length === 0) {
    return NextResponse.json({ items: [], blocking: false })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, price_aed, stock, is_active, emoji')
    .in('id', productIds)
  if (error) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  const productById = new Map<string, ProductSnapshot>()
  for (const p of products || []) {
    productById.set(String(p.id), {
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceAED: round2(Number(p.price_aed)),
      stock: Number(p.stock ?? 0),
      isActive: p.is_active !== false,
      emoji: p.emoji,
    })
  }

  const validated: ValidatedCartItem[] = []
  let blocking = false

  for (const id of productIds) {
    const input = cleaned.get(id)!
    const product = productById.get(id)

    if (!product) {
      validated.push({ id, status: 'removed', product: null })
      blocking = true
      continue
    }

    if (!product.isActive) {
      validated.push({ id, status: 'unavailable', product })
      blocking = true
      continue
    }

    if (product.stock < input.quantity) {
      validated.push({
        id,
        status: 'oversold',
        product,
        maxAvailable: Math.max(0, product.stock),
      })
      blocking = true
      continue
    }

    if (input.priceAED != null && Math.abs(input.priceAED - product.priceAED) > 0.005) {
      validated.push({
        id,
        status: 'price_changed',
        product,
        was: { priceAED: round2(input.priceAED) },
      })
      continue
    }

    if (product.stock <= 5) {
      validated.push({
        id,
        status: 'low_stock',
        product,
        maxAvailable: product.stock,
      })
      continue
    }

    validated.push({ id, status: 'ok', product })
  }

  return NextResponse.json({ items: validated, blocking })
}
