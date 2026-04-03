import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

async function checkAuth() {
  const cookieStore = await cookies()
  return cookieStore.get('dashboard_auth')?.value === DASHBOARD_PASSWORD
}

export async function PATCH(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Map frontend field names to DB column names
  const dbUpdates: any = { updated_at: new Date().toISOString() }
  if (updates.priceAED !== undefined) dbUpdates.price_aed = updates.priceAED
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  if (updates.price_aed !== undefined) dbUpdates.price_aed = updates.price_aed
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active

  const { error } = await supabase.from('products').update(dbUpdates).eq('id', parseInt(id))
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
