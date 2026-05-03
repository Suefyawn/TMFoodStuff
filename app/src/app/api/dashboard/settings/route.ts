import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const DEFAULTS: Record<string, string> = {
  store_name: 'TMFoodStuff',
  whatsapp_number: '971544408411',
  delivery_fee: '15',
  vat_rate: '5',
  min_order_amount: '0',
  delivery_slots: 'morning,afternoon,evening',
  free_delivery_threshold: '150',
}

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase.from('settings').select('*')

  if (error) return NextResponse.json({ settings: { ...DEFAULTS }, promoCodes: [] })

  const settings: Record<string, string> = { ...DEFAULTS }
  for (const row of (data || [])) settings[row.key] = row.value

  const { data: promos } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ settings, promoCodes: promos || [] })
}

export async function PUT(request: Request) {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { settings, promoCodes } = await request.json()
  const supabase = getSupabase()

  if (settings) {
    // Validate numeric fields before saving
    const vatRate = parseFloat(settings.vat_rate ?? '5')
    if (isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
      return NextResponse.json({ error: 'VAT rate must be between 0 and 100' }, { status: 400 })
    }
    const deliveryFee = parseFloat(settings.delivery_fee ?? '0')
    if (isNaN(deliveryFee) || deliveryFee < 0) {
      return NextResponse.json({ error: 'Delivery fee cannot be negative' }, { status: 400 })
    }

    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
    }
  }

  if (promoCodes) {
    // Validate promo codes before touching the DB
    for (const p of promoCodes) {
      if (!p.code || typeof p.code !== 'string') {
        return NextResponse.json({ error: 'Each promo code must have a code string' }, { status: 400 })
      }
      const pct = parseFloat(p.discount_percent)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json({ error: `Discount for "${p.code}" must be 0–100%` }, { status: 400 })
      }
    }

    // Collect existing IDs to update, new ones to insert
    const toUpdate = promoCodes.filter((p: any) => p.id)
    const toInsert = promoCodes.filter((p: any) => !p.id)

    // Delete codes no longer in the list
    const keepIds = toUpdate.map((p: any) => p.id)
    if (keepIds.length > 0) {
      await supabase.from('promo_codes').delete().not('id', 'in', `(${keepIds.join(',')})`)
    } else {
      await supabase.from('promo_codes').delete().gt('id', 0)
    }

    for (const p of toUpdate) {
      await supabase.from('promo_codes').update({
        code: p.code.toUpperCase().trim(),
        discount_percent: p.discount_percent,
        is_active: p.is_active !== false,
        expires_at: p.expires_at || null,
      }).eq('id', p.id)
    }

    if (toInsert.length > 0) {
      await supabase.from('promo_codes').insert(
        toInsert.map((p: any) => ({
          code: p.code.toUpperCase().trim(),
          discount_percent: p.discount_percent,
          is_active: p.is_active !== false,
          expires_at: p.expires_at || null,
        }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}
