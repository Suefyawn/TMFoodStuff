import { NextResponse } from 'next/server'
import { requireDashboardAuth } from '@/lib/dashboard-auth'
import { getDashboardDb } from '@/lib/dashboard-db'

// Default settings
const DEFAULTS: Record<string, string> = {
  store_name: 'TMFoodStuff',
  whatsapp_number: '971544408411',
  delivery_fee: '0',
  vat_rate: '5',
  min_order_amount: '0',
  delivery_slots: 'morning,afternoon,evening',
  free_delivery: 'true',
}

export async function GET() {
  const auth = await requireDashboardAuth()
  if (!auth.ok) return auth.response
  const supabase = getDashboardDb()

  // Try to read from settings table; fall back to defaults
  const { data, error } = await supabase.from('settings').select('*')

  if (error) {
    // Table might not exist — return defaults
    return NextResponse.json(DEFAULTS)
  }

  const settings: Record<string, string> = { ...DEFAULTS }
  for (const row of (data || [])) {
    settings[row.key] = row.value
  }

  // Also get promo codes
  const { data: promos } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })

  return NextResponse.json({ settings, promoCodes: promos || [] })
}

export async function PUT(request: Request) {
  const auth = await requireDashboardAuth()
  if (!auth.ok) return auth.response

  const { settings, promoCodes } = await request.json()
  const supabase = getDashboardDb()

  // Upsert settings
  if (settings) {
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
    }
  }

  // Upsert promo codes
  if (promoCodes) {
    // Delete all then re-insert
    await supabase.from('promo_codes').delete().neq('id', 0)
    if (promoCodes.length > 0) {
      await supabase.from('promo_codes').insert(
        promoCodes.map((p: any) => ({
          code: p.code,
          discount_percent: p.discount_percent,
          is_active: p.is_active !== false,
          expires_at: p.expires_at || null,
        }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}
