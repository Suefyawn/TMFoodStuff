// Setup Supabase for TMFoodStuff - create tables and seed products
const SUPABASE_URL = 'https://eoecnybevhxfdyzlodua.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZWNueWJldmh4ZmR5emxvZHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzNjMwNywiZXhwIjoyMDkwODEyMzA3fQ.FSnS3cCLk7gNxKEnQXT4dUvBa-70jD04lE61wFaieTA'

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
}

async function sql(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST', headers,
    body: JSON.stringify({ query })
  })
  if (!r.ok) {
    // Try direct SQL via management API
    const err = await r.text()
    throw new Error(`SQL failed: ${err}`)
  }
  return r.json().catch(() => ({}))
}

async function createTables() {
  console.log('📊 Creating tables via Supabase SQL...')
  
  const MANAGEMENT_TOKEN = 'sbp_b0654af28e0351ab3df7ceab66ca10ab7370f22a'
  const PROJECT_REF = 'eoecnybevhxfdyzlodua'
  
  const ddl = `
    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT UNIQUE NOT NULL,
      emoji TEXT,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT UNIQUE NOT NULL,
      category_id INT REFERENCES categories(id),
      description TEXT,
      price_aed DECIMAL(10,2) NOT NULL,
      compare_at_price_aed DECIMAL(10,2),
      unit TEXT DEFAULT 'kg',
      stock INT DEFAULT 100,
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      is_organic BOOLEAN DEFAULT false,
      origin TEXT,
      emoji TEXT,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT DEFAULT 'pending',
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      delivery_emirate TEXT,
      delivery_area TEXT,
      delivery_building TEXT,
      delivery_makani TEXT,
      delivery_slot TEXT,
      delivery_notes TEXT,
      subtotal DECIMAL(10,2),
      vat DECIMAL(10,2),
      delivery_fee DECIMAL(10,2) DEFAULT 0,
      promo_code TEXT,
      promo_discount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2),
      items JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS but allow service role full access
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

    -- Public read for products/categories (storefront needs it)
    CREATE POLICY IF NOT EXISTS "Public read products" ON products FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "Public read categories" ON categories FOR SELECT USING (true);
    -- Service role bypasses RLS automatically
  `
  
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MANAGEMENT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: ddl })
  })
  const result = await r.json()
  if (r.ok) {
    console.log('✅ Tables created')
  } else {
    console.log('Table creation result:', JSON.stringify(result))
  }
}

async function seedCategories() {
  console.log('\n📂 Seeding categories...')
  const cats = [
    { name: 'Fruits', name_ar: 'فواكه', slug: 'fruits', emoji: '🍎', description: 'Fresh fruits sourced from farms' },
    { name: 'Vegetables', name_ar: 'خضروات', slug: 'vegetables', emoji: '🥦', description: 'Farm fresh vegetables' },
    { name: 'Organic', name_ar: 'عضوي', slug: 'organic', emoji: '🌿', description: 'Certified organic produce' },
    { name: 'Exotic Fruits', name_ar: 'فواكه غريبة', slug: 'exotic', emoji: '🌴', description: 'Rare and exotic fruits' },
  ]
  
  const r = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation,resolution=ignore-duplicates' },
    body: JSON.stringify(cats)
  })
  const result = await r.json()
  console.log(`✅ ${Array.isArray(result) ? result.length : 0} categories seeded`)
  
  // Get category IDs
  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug`, { headers })
  return await catRes.json()
}

async function seedProducts(categories) {
  const catMap = {}
  for (const c of categories) catMap[c.slug] = c.id

  const allProducts = [
    // FRUITS
    { name: 'Apple Red', name_ar: 'تفاح أحمر', slug: 'apple-red', category: 'fruits', price_aed: 9.50, unit: 'kg', stock: 120, is_featured: true, origin: 'USA', emoji: '🍎' },
    { name: 'Apple Green', name_ar: 'تفاح أخضر', slug: 'apple-green', category: 'fruits', price_aed: 10.00, unit: 'kg', stock: 90, origin: 'South Africa', emoji: '🍏' },
    { name: 'Banana', name_ar: 'موز', slug: 'banana', category: 'fruits', price_aed: 5.50, unit: 'kg', stock: 200, is_featured: true, origin: 'Ecuador', emoji: '🍌' },
    { name: 'Mango Alphonso', name_ar: 'مانجو الفونسو', slug: 'mango-alphonso', category: 'fruits', price_aed: 28.00, unit: 'kg', stock: 50, is_featured: true, origin: 'India', emoji: '🥭' },
    { name: 'Mango Pakistani', name_ar: 'مانجو باكستاني', slug: 'mango-pakistani', category: 'fruits', price_aed: 18.00, unit: 'kg', stock: 80, origin: 'Pakistan', emoji: '🥭' },
    { name: 'Orange Navel', name_ar: 'برتقال ناول', slug: 'orange-navel', category: 'fruits', price_aed: 8.00, unit: 'kg', stock: 150, is_featured: true, origin: 'Egypt', emoji: '🍊' },
    { name: 'Grapes Red', name_ar: 'عنب أحمر', slug: 'grapes-red', category: 'fruits', price_aed: 15.00, unit: 'kg', stock: 80, is_featured: true, origin: 'Egypt', emoji: '🍇' },
    { name: 'Grapes Green', name_ar: 'عنب أخضر', slug: 'grapes-green', category: 'fruits', price_aed: 14.00, unit: 'kg', stock: 80, origin: 'Egypt', emoji: '🍇' },
    { name: 'Strawberry', name_ar: 'فراولة', slug: 'strawberry', category: 'fruits', price_aed: 18.00, unit: 'pack', stock: 100, is_featured: true, origin: 'Egypt', emoji: '🍓' },
    { name: 'Watermelon', name_ar: 'بطيخ', slug: 'watermelon', category: 'fruits', price_aed: 12.00, unit: 'piece', stock: 60, is_featured: true, origin: 'UAE', emoji: '🍉' },
    { name: 'Pomegranate', name_ar: 'رمان', slug: 'pomegranate', category: 'fruits', price_aed: 16.00, unit: 'kg', stock: 70, origin: 'Iran', emoji: '🍎' },
    { name: 'Lemon', name_ar: 'ليمون', slug: 'lemon', category: 'fruits', price_aed: 6.00, unit: 'kg', stock: 150, origin: 'Egypt', emoji: '🍋' },
    { name: 'Pear', name_ar: 'كمثرى', slug: 'pear', category: 'fruits', price_aed: 13.00, unit: 'kg', stock: 70, origin: 'South Africa', emoji: '🍐' },
    { name: 'Kiwi', name_ar: 'كيوي', slug: 'kiwi', category: 'fruits', price_aed: 20.00, unit: 'kg', stock: 60, is_featured: true, origin: 'New Zealand', emoji: '🥝' },
    { name: 'Pineapple', name_ar: 'أناناس', slug: 'pineapple', category: 'fruits', price_aed: 14.00, unit: 'piece', stock: 50, is_featured: true, origin: 'Philippines', emoji: '🍍' },
    { name: 'Papaya', name_ar: 'بابايا', slug: 'papaya', category: 'fruits', price_aed: 10.00, unit: 'piece', stock: 60, origin: 'India', emoji: '🍈' },
    { name: 'Guava', name_ar: 'جوافة', slug: 'guava', category: 'fruits', price_aed: 9.00, unit: 'kg', stock: 80, origin: 'Egypt', emoji: '🍐' },
    { name: 'Dates Medjool', name_ar: 'تمر مجدول', slug: 'dates-medjool', category: 'fruits', price_aed: 65.00, unit: 'kg', stock: 50, is_featured: true, origin: 'UAE', emoji: '🫐' },
    { name: 'Dates Ajwa', name_ar: 'تمر عجوة', slug: 'dates-ajwa', category: 'fruits', price_aed: 85.00, unit: 'kg', stock: 30, is_featured: true, origin: 'Saudi Arabia', emoji: '🫐' },
    { name: 'Coconut', name_ar: 'جوز الهند', slug: 'coconut', category: 'fruits', price_aed: 8.00, unit: 'piece', stock: 80, origin: 'Sri Lanka', emoji: '🥥' },
    { name: 'Avocado', name_ar: 'أفوكادو', slug: 'avocado', category: 'fruits', price_aed: 22.00, unit: 'piece', stock: 60, is_featured: true, origin: 'Kenya', emoji: '🥑' },
    { name: 'Blueberry', name_ar: 'توت أزرق', slug: 'blueberry', category: 'fruits', price_aed: 32.00, unit: 'pack', stock: 40, is_featured: true, origin: 'Chile', emoji: '🫐' },
    { name: 'Fig Fresh', name_ar: 'تين طازج', slug: 'fig-fresh', category: 'fruits', price_aed: 22.00, unit: 'kg', stock: 30, origin: 'Turkey', emoji: '🍈' },
    { name: 'Peach', name_ar: 'خوخ', slug: 'peach', category: 'fruits', price_aed: 18.00, unit: 'kg', stock: 50, origin: 'USA', emoji: '🍑' },
    { name: 'Plum', name_ar: 'برقوق', slug: 'plum', category: 'fruits', price_aed: 16.00, unit: 'kg', stock: 50, origin: 'Chile', emoji: '🟣' },
    // VEGETABLES
    { name: 'Tomato', name_ar: 'طماطم', slug: 'tomato', category: 'vegetables', price_aed: 5.00, unit: 'kg', stock: 200, is_featured: true, origin: 'UAE', emoji: '🍅' },
    { name: 'Tomato Cherry', name_ar: 'طماطم كرزية', slug: 'tomato-cherry', category: 'vegetables', price_aed: 12.00, unit: 'pack', stock: 100, origin: 'UAE', emoji: '🍅' },
    { name: 'Potato', name_ar: 'بطاطا', slug: 'potato', category: 'vegetables', price_aed: 4.00, unit: 'kg', stock: 300, is_featured: true, origin: 'Egypt', emoji: '🥔' },
    { name: 'Onion', name_ar: 'بصل', slug: 'onion', category: 'vegetables', price_aed: 3.50, unit: 'kg', stock: 250, origin: 'India', emoji: '🧅' },
    { name: 'Garlic', name_ar: 'ثوم', slug: 'garlic', category: 'vegetables', price_aed: 18.00, unit: 'kg', stock: 100, origin: 'China', emoji: '🧄' },
    { name: 'Cucumber', name_ar: 'خيار', slug: 'cucumber', category: 'vegetables', price_aed: 4.50, unit: 'kg', stock: 150, is_featured: true, origin: 'UAE', emoji: '🥒' },
    { name: 'Carrot', name_ar: 'جزر', slug: 'carrot', category: 'vegetables', price_aed: 4.00, unit: 'kg', stock: 200, is_featured: true, origin: 'UAE', emoji: '🥕' },
    { name: 'Bell Pepper Red', name_ar: 'فلفل أحمر', slug: 'bell-pepper-red', category: 'vegetables', price_aed: 10.00, unit: 'kg', stock: 100, origin: 'UAE', emoji: '🫑' },
    { name: 'Bell Pepper Green', name_ar: 'فلفل أخضر', slug: 'bell-pepper-green', category: 'vegetables', price_aed: 8.00, unit: 'kg', stock: 100, origin: 'UAE', emoji: '🫑' },
    { name: 'Broccoli', name_ar: 'بروكلي', slug: 'broccoli', category: 'vegetables', price_aed: 12.00, unit: 'piece', stock: 80, is_featured: true, origin: 'UAE', emoji: '🥦' },
    { name: 'Cauliflower', name_ar: 'قرنبيط', slug: 'cauliflower', category: 'vegetables', price_aed: 10.00, unit: 'piece', stock: 80, origin: 'UAE', emoji: '🥦' },
    { name: 'Spinach', name_ar: 'سبانخ', slug: 'spinach', category: 'vegetables', price_aed: 6.00, unit: 'bunch', stock: 100, origin: 'UAE', emoji: '🥬' },
    { name: 'Lettuce', name_ar: 'خس', slug: 'lettuce', category: 'vegetables', price_aed: 5.00, unit: 'piece', stock: 100, origin: 'UAE', emoji: '🥬' },
    { name: 'Eggplant', name_ar: 'باذنجان', slug: 'eggplant', category: 'vegetables', price_aed: 7.00, unit: 'kg', stock: 100, origin: 'UAE', emoji: '🍆' },
    { name: 'Zucchini', name_ar: 'كوسا', slug: 'zucchini', category: 'vegetables', price_aed: 7.00, unit: 'kg', stock: 100, origin: 'UAE', emoji: '🥒' },
    { name: 'Mushroom', name_ar: 'فطر', slug: 'mushroom', category: 'vegetables', price_aed: 14.00, unit: 'pack', stock: 80, is_featured: true, origin: 'UAE', emoji: '🍄' },
    { name: 'Ginger', name_ar: 'زنجبيل', slug: 'ginger', category: 'vegetables', price_aed: 20.00, unit: 'kg', stock: 60, origin: 'India', emoji: '🫚' },
    { name: 'Green Chilli', name_ar: 'فلفل حار', slug: 'green-chilli', category: 'vegetables', price_aed: 8.00, unit: 'kg', stock: 80, origin: 'UAE', emoji: '🌶️' },
    { name: 'Corn', name_ar: 'ذرة', slug: 'corn', category: 'vegetables', price_aed: 3.00, unit: 'piece', stock: 150, is_featured: true, origin: 'UAE', emoji: '🌽' },
    { name: 'Sweet Potato', name_ar: 'بطاطا حلوة', slug: 'sweet-potato', category: 'vegetables', price_aed: 9.00, unit: 'kg', stock: 80, origin: 'Egypt', emoji: '🍠' },
    { name: 'Beetroot', name_ar: 'شمندر', slug: 'beetroot', category: 'vegetables', price_aed: 8.00, unit: 'kg', stock: 60, origin: 'UAE', emoji: '🟣' },
    { name: 'Celery', name_ar: 'كرفس', slug: 'celery', category: 'vegetables', price_aed: 8.00, unit: 'bunch', stock: 60, origin: 'UAE', emoji: '🥬' },
    { name: 'Parsley', name_ar: 'بقدونس', slug: 'parsley', category: 'vegetables', price_aed: 4.00, unit: 'bunch', stock: 100, origin: 'UAE', emoji: '🌿' },
    { name: 'Mint', name_ar: 'نعناع', slug: 'mint', category: 'vegetables', price_aed: 3.00, unit: 'bunch', stock: 100, origin: 'UAE', emoji: '🌿' },
    { name: 'Coriander', name_ar: 'كزبرة', slug: 'coriander', category: 'vegetables', price_aed: 3.00, unit: 'bunch', stock: 100, origin: 'UAE', emoji: '🌿' },
    { name: 'Pumpkin', name_ar: 'قرع', slug: 'pumpkin', category: 'vegetables', price_aed: 6.00, unit: 'kg', stock: 80, origin: 'UAE', emoji: '🎃' },
    // ORGANIC
    { name: 'Organic Tomato', name_ar: 'طماطم عضوية', slug: 'organic-tomato', category: 'organic', price_aed: 12.00, unit: 'kg', stock: 60, is_organic: true, is_featured: true, origin: 'UAE', emoji: '🍅' },
    { name: 'Organic Spinach', name_ar: 'سبانخ عضوية', slug: 'organic-spinach', category: 'organic', price_aed: 14.00, unit: 'bunch', stock: 50, is_organic: true, origin: 'UAE', emoji: '🥬' },
    { name: 'Organic Carrot', name_ar: 'جزر عضوي', slug: 'organic-carrot', category: 'organic', price_aed: 10.00, unit: 'kg', stock: 60, is_organic: true, is_featured: true, origin: 'UAE', emoji: '🥕' },
    { name: 'Organic Apple', name_ar: 'تفاح عضوي', slug: 'organic-apple', category: 'organic', price_aed: 18.00, unit: 'kg', stock: 50, is_organic: true, is_featured: true, origin: 'USA', emoji: '🍎' },
    { name: 'Organic Avocado', name_ar: 'أفوكادو عضوي', slug: 'organic-avocado', category: 'organic', price_aed: 30.00, unit: 'piece', stock: 30, is_organic: true, is_featured: true, origin: 'Kenya', emoji: '🥑' },
    { name: 'Organic Blueberry', name_ar: 'توت أزرق عضوي', slug: 'organic-blueberry', category: 'organic', price_aed: 45.00, unit: 'pack', stock: 20, is_organic: true, is_featured: true, origin: 'Chile', emoji: '🫐' },
    { name: 'Organic Banana', name_ar: 'موز عضوي', slug: 'organic-banana', category: 'organic', price_aed: 8.00, unit: 'kg', stock: 60, is_organic: true, origin: 'Ecuador', emoji: '🍌' },
    { name: 'Organic Lemon', name_ar: 'ليمون عضوي', slug: 'organic-lemon', category: 'organic', price_aed: 12.00, unit: 'kg', stock: 60, is_organic: true, origin: 'Egypt', emoji: '🍋' },
    { name: 'Organic Ginger', name_ar: 'زنجبيل عضوي', slug: 'organic-ginger', category: 'organic', price_aed: 35.00, unit: 'kg', stock: 30, is_organic: true, origin: 'India', emoji: '🫚' },
    { name: 'Organic Mixed Salad', name_ar: 'سلطة مشكلة عضوية', slug: 'organic-mixed-salad', category: 'organic', price_aed: 16.00, unit: 'pack', stock: 50, is_organic: true, is_featured: true, origin: 'UAE', emoji: '🥗' },
    // EXOTIC
    { name: 'Dragon Fruit', name_ar: 'فاكهة التنين', slug: 'dragon-fruit', category: 'exotic', price_aed: 35.00, unit: 'piece', stock: 30, is_featured: true, origin: 'Vietnam', emoji: '🐉' },
    { name: 'Passion Fruit', name_ar: 'فاكهة الشغف', slug: 'passion-fruit', category: 'exotic', price_aed: 30.00, unit: 'kg', stock: 30, is_featured: true, origin: 'Kenya', emoji: '🌺' },
    { name: 'Lychee', name_ar: 'ليتشي', slug: 'lychee', category: 'exotic', price_aed: 38.00, unit: 'kg', stock: 25, is_featured: true, origin: 'Thailand', emoji: '🍒' },
    { name: 'Mangosteen', name_ar: 'مانجوستين', slug: 'mangosteen', category: 'exotic', price_aed: 65.00, unit: 'kg', stock: 15, is_featured: true, origin: 'Thailand', emoji: '🟣' },
    { name: 'Jackfruit', name_ar: 'جاكفروت', slug: 'jackfruit', category: 'exotic', price_aed: 40.00, unit: 'kg', stock: 20, origin: 'India', emoji: '🍈' },
    { name: 'Rambutan', name_ar: 'رامبوتان', slug: 'rambutan', category: 'exotic', price_aed: 35.00, unit: 'kg', stock: 20, origin: 'Thailand', emoji: '🌺' },
    { name: 'Star Fruit', name_ar: 'فاكهة النجمة', slug: 'star-fruit', category: 'exotic', price_aed: 28.00, unit: 'kg', stock: 20, origin: 'Malaysia', emoji: '⭐' },
    { name: 'Persimmon', name_ar: 'كاكي', slug: 'persimmon', category: 'exotic', price_aed: 22.00, unit: 'kg', stock: 25, origin: 'China', emoji: '🟠' },
    { name: 'Yellow Watermelon', name_ar: 'بطيخ أصفر', slug: 'yellow-watermelon', category: 'exotic', price_aed: 18.00, unit: 'piece', stock: 20, is_featured: true, origin: 'UAE', emoji: '🍉' },
    { name: 'Durian', name_ar: 'دوريان', slug: 'durian', category: 'exotic', price_aed: 85.00, unit: 'piece', stock: 10, origin: 'Thailand', emoji: '🟡' },
  ]

  // Map to DB format with category IDs
  const dbProducts = allProducts.map(p => ({
    name: p.name,
    name_ar: p.name_ar,
    slug: p.slug,
    category_id: catMap[p.category],
    description: `Fresh ${p.name} delivered to your door across UAE.`,
    price_aed: p.price_aed,
    unit: p.unit,
    stock: p.stock,
    is_active: true,
    is_featured: p.is_featured || false,
    is_organic: p.is_organic || false,
    origin: p.origin,
    emoji: p.emoji,
  }))

  console.log(`\n📦 Inserting ${dbProducts.length} products...`)
  
  // Insert in batches of 20
  let created = 0
  for (let i = 0; i < dbProducts.length; i += 20) {
    const batch = dbProducts.slice(i, i + 20)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(batch)
    })
    if (r.ok || r.status === 201) {
      created += batch.length
      process.stdout.write(`  ${created}/${dbProducts.length} products...\r`)
    } else {
      const err = await r.text()
      console.log(`\n  Batch error: ${err}`)
    }
  }
  console.log(`\n✅ ${created} products seeded`)
}

async function main() {
  console.log('🚀 Setting up Supabase for TMFoodStuff\n')
  
  await createTables()
  const cats = await seedCategories()
  console.log('Categories:', cats.map(c => `${c.slug}:${c.id}`).join(', '))
  await seedProducts(cats)
  
  console.log('\n✅ Done! Supabase ready.')
  console.log(`URL: ${SUPABASE_URL}`)
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
