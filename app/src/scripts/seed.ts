import { createClient } from '@supabase/supabase-js'
import { seedCatalogToSupabase } from '../lib/seed-catalog'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  console.log('🌱 Seeding Supabase catalog from static data...')
  const r = await seedCatalogToSupabase(supabase)
  console.log(
    `✅ Categories: +${r.categoriesCreated} (skipped ${r.categoriesSkipped}) · Products: +${r.productsCreated} (skipped ${r.productsSkipped})`
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
