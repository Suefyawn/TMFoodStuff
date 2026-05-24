// Customer-facing subscription CRUD. All endpoints scoped to the signed-in
// customer's own rows.
import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { isValidUAEPhone, normaliseUAEPhone } from '@/lib/validators'

export const dynamic = 'force-dynamic'

const ALLOWED_SLOTS = new Set(['morning', 'afternoon', 'evening'])
const ALLOWED_FREQ = new Set([7, 14, 30])

interface ItemBody { product_id?: number; quantity?: number }

interface CreateBody {
  name?: string
  items: ItemBody[]
  frequency_days: number
  delivery_slot: string
  delivery_emirate: string
  delivery_area: string
  delivery_building?: string
  delivery_makani?: string
  delivery_notes?: string
  customer_name: string
  customer_phone: string
  start_date?: string  // ISO YYYY-MM-DD — defaults to 7 days from today
}

export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('id, name, items, frequency_days, delivery_slot, delivery_emirate, delivery_area, delivery_building, delivery_notes, status, next_delivery_date, pause_until, last_delivery_date, total_orders, created_at, customer_name, customer_phone')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ subscriptions: data || [] })
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as CreateBody

  // Validation
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Pick at least one item.' }, { status: 400 })
  }
  if (!ALLOWED_FREQ.has(Number(body.frequency_days))) {
    return NextResponse.json({ error: 'Frequency must be 7, 14, or 30 days.' }, { status: 400 })
  }
  if (!ALLOWED_SLOTS.has(body.delivery_slot)) {
    return NextResponse.json({ error: 'Invalid delivery slot.' }, { status: 400 })
  }
  if (!body.delivery_emirate?.trim() || !body.delivery_area?.trim()) {
    return NextResponse.json({ error: 'Delivery emirate and area are required.' }, { status: 400 })
  }
  if (!body.customer_name?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!isValidUAEPhone(body.customer_phone)) {
    return NextResponse.json({ error: 'Valid UAE phone is required.' }, { status: 400 })
  }

  const supabase = getServiceRoleClient()

  // Resolve product snapshots from the catalog so we store a price that's
  // accurate at create-time — subsequent price changes don't retroactively
  // affect existing subscriptions until the customer edits them.
  const productIds = body.items.map(i => Number(i.product_id)).filter(Number.isFinite)
  const { data: products } = await supabase
    .from('products')
    .select('id, name_en, name_ar, unit, price_aed, emoji, is_active')
    .in('id', productIds)
  if (!products || products.length === 0) {
    return NextResponse.json({ error: 'None of the selected items are available.' }, { status: 400 })
  }
  const productMap = new Map(products.map(p => [Number(p.id), p]))
  const itemSnapshots = body.items
    .map(it => {
      const p = productMap.get(Number(it.product_id))
      const qty = Math.max(1, Math.min(50, Number(it.quantity) || 1))
      if (!p || !p.is_active) return null
      return {
        product_id: Number(p.id),
        name: p.name_en || p.name_ar || `#${p.id}`,
        unit: p.unit || 'unit',
        price_aed: Number(p.price_aed) || 0,
        quantity: qty,
        emoji: p.emoji || undefined,
      }
    })
    .filter(Boolean)
  if (itemSnapshots.length === 0) {
    return NextResponse.json({ error: 'No valid items.' }, { status: 400 })
  }

  // First delivery defaults to one frequency window from now (so the cron
  // doesn't immediately dispatch a same-day order the customer wasn't
  // expecting). Customer may override via start_date.
  let nextDate: string
  if (body.start_date && /^\d{4}-\d{2}-\d{2}$/.test(body.start_date)) {
    nextDate = body.start_date
  } else {
    const d = new Date()
    d.setDate(d.getDate() + Number(body.frequency_days))
    nextDate = d.toISOString().slice(0, 10)
  }

  const { data: inserted, error } = await supabase
    .from('subscriptions')
    .insert({
      customer_id: customer.id,
      name: body.name?.trim().slice(0, 80) || null,
      items: itemSnapshots,
      frequency_days: Number(body.frequency_days),
      delivery_slot: body.delivery_slot,
      delivery_emirate: body.delivery_emirate.trim(),
      delivery_area: body.delivery_area.trim(),
      delivery_building: body.delivery_building?.trim() || null,
      delivery_makani: body.delivery_makani?.trim() || null,
      delivery_notes: body.delivery_notes?.trim() || null,
      customer_name: body.customer_name.trim().slice(0, 120),
      customer_phone: normaliseUAEPhone(body.customer_phone) || body.customer_phone.trim(),
      status: 'active',
      next_delivery_date: nextDate,
    })
    .select('id')
    .single()
  if (error || !inserted) {
    return NextResponse.json({ error: error?.message || 'Failed to create subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: inserted.id })
}
