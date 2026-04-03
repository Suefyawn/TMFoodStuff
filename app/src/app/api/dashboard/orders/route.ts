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
  
  const { id, status } = await request.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', parseInt(id))
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
