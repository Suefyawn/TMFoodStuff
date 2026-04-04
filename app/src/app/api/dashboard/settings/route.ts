import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

async function checkAuth() {
  const cookieStore = await cookies()
  return cookieStore.get('dashboard_auth')?.value === DASHBOARD_PASSWORD
}

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

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
  const supabase = getSupabase()

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
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { settings, promoCodes } = await request.json()
  const supabase = getSupabase()

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
