import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eoecnybevhxfdyzlodua.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZWNueWJldmh4ZmR5emxvZHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzNjMwNywiZXhwIjoyMDkwODEyMzA3fQ.FSnS3cCLk7gNxKEnQXT4dUvBa-70jD04lE61wFaieTA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Test if settings table exists by trying to read
async function run() {
  // Try settings table
  const { error: settingsErr } = await supabase.from('settings').select('key').limit(1)
  if (settingsErr && settingsErr.message.includes('does not exist')) {
    console.log('Settings table does not exist - need to create via SQL editor')
    console.log('Please run this SQL in Supabase dashboard:')
    console.log(`
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public read promos" ON promo_codes FOR SELECT USING (true);
    `)
  } else {
    console.log('✅ Settings table exists')
    // Seed default settings
    const defaults = [
      { key: 'store_name', value: 'TMFoodStuff' },
      { key: 'whatsapp_number', value: '971544408411' },
      { key: 'delivery_fee', value: '0' },
      { key: 'vat_rate', value: '5' },
      { key: 'min_order_amount', value: '0' },
      { key: 'free_delivery', value: 'true' },
    ]
    for (const s of defaults) {
      await supabase.from('settings').upsert(s, { onConflict: 'key' })
    }
    console.log('✅ Default settings seeded')
  }

  // Try promo_codes table
  const { error: promoErr } = await supabase.from('promo_codes').select('id').limit(1)
  if (promoErr && promoErr.message.includes('does not exist')) {
    console.log('Promo codes table does not exist')
  } else {
    console.log('✅ Promo codes table exists')
    await supabase.from('promo_codes').upsert({ code: 'FRESH10', discount_percent: 10, is_active: true }, { onConflict: 'code' })
    console.log('✅ FRESH10 promo code seeded')
  }
}

run().catch(e => console.error(e))
