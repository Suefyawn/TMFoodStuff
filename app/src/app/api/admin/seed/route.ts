import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { seedCatalogToSupabase } from '@/lib/seed-catalog'

const SEED_SECRET = process.env.SEED_SECRET || 'tmfood-seed-2024-secure'

export const maxDuration = 60

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-seed-secret')
  if (authHeader !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Server missing Supabase env' }, { status: 500 })
  }

  try {
    const supabase = createClient(url, key)
    const r = await seedCatalogToSupabase(supabase)
    return NextResponse.json({
      success: true,
      message: `Seeded: ${r.categoriesCreated} categories, ${r.productsCreated} products (${r.categoriesSkipped} cat / ${r.productsSkipped} prod skipped)`,
      ...r,
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
