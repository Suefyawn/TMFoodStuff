// Direct MongoDB seed - runs locally, pushes to production Atlas
import { MongoClient } from 'mongodb'

const MONGODB_URI = 'mongodb+srv://Sooviaan:Bh!mb3r1996@cluster0.bg96apw.mongodb.net/tmfoodstuff?appName=Cluster0'

// Categories
const categories = [
  { name: 'Fruits', nameAr: 'فواكه', slug: 'fruits', emoji: '🍎', description: 'Fresh fruits sourced from local farms and international orchards' },
  { name: 'Vegetables', nameAr: 'خضروات', slug: 'vegetables', emoji: '🥦', description: 'Farm fresh vegetables delivered daily' },
  { name: 'Organic', nameAr: 'عضوي', slug: 'organic', emoji: '🌿', description: 'Certified organic produce, free from pesticides' },
  { name: 'Exotic Fruits', nameAr: 'فواكه غريبة', slug: 'exotic', emoji: '🌴', description: 'Rare and exotic fruits from around the world' },
]

// Products data (subset of all 150 from products.ts)
const productsByCat = {
  fruits: [
    { name: 'Apple Red', nameAr: 'تفاح أحمر', slug: 'apple-red', priceAED: 9.50, unit: 'kg', stock: 120, isFeatured: true, isOrganic: false, origin: 'USA', emoji: '🍎' },
    { name: 'Apple Green (Granny Smith)', nameAr: 'تفاح أخضر', slug: 'apple-green-granny-smith', priceAED: 10.00, unit: 'kg', stock: 90, isFeatured: false, isOrganic: false, origin: 'South Africa', emoji: '🍏' },
    { name: 'Apple Fuji', nameAr: 'تفاح فوجي', slug: 'apple-fuji', priceAED: 12.00, unit: 'kg', stock: 80, isFeatured: true, isOrganic: false, origin: 'China', emoji: '🍎' },
    { name: 'Banana', nameAr: 'موز', slug: 'banana', priceAED: 5.50, unit: 'kg', stock: 200, isFeatured: true, isOrganic: false, origin: 'Ecuador', emoji: '🍌' },
    { name: 'Banana Organic', nameAr: 'موز عضوي', slug: 'banana-organic', priceAED: 8.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: true, origin: 'Ecuador', emoji: '🍌' },
    { name: 'Mango Alphonso', nameAr: 'مانجو الفونسو', slug: 'mango-alphonso', priceAED: 28.00, unit: 'kg', stock: 50, isFeatured: true, isOrganic: false, origin: 'India', emoji: '🥭' },
    { name: 'Mango Kesar', nameAr: 'مانجو كيسار', slug: 'mango-kesar', priceAED: 22.00, unit: 'kg', stock: 60, isFeatured: true, isOrganic: false, origin: 'India', emoji: '🥭' },
    { name: 'Mango Pakistani', nameAr: 'مانجو باكستاني', slug: 'mango-pakistani', priceAED: 18.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'Pakistan', emoji: '🥭' },
    { name: 'Orange Navel', nameAr: 'برتقال ناول', slug: 'orange-navel', priceAED: 8.00, unit: 'kg', stock: 150, isFeatured: true, isOrganic: false, origin: 'Egypt', emoji: '🍊' },
    { name: 'Orange Valencia', nameAr: 'برتقال فالنسيا', slug: 'orange-valencia', priceAED: 7.50, unit: 'kg', stock: 120, isFeatured: false, isOrganic: false, origin: 'South Africa', emoji: '🍊' },
    { name: 'Grapes Red', nameAr: 'عنب أحمر', slug: 'grapes-red', priceAED: 15.00, unit: 'kg', stock: 80, isFeatured: true, isOrganic: false, origin: 'Egypt', emoji: '🍇' },
    { name: 'Grapes Green', nameAr: 'عنب أخضر', slug: 'grapes-green', priceAED: 14.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'Egypt', emoji: '🍇' },
    { name: 'Strawberry', nameAr: 'فراولة', slug: 'strawberry', priceAED: 18.00, unit: 'pack', stock: 100, isFeatured: true, isOrganic: false, origin: 'Egypt', emoji: '🍓' },
    { name: 'Watermelon', nameAr: 'بطيخ', slug: 'watermelon', priceAED: 12.00, unit: 'piece', stock: 60, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🍉' },
    { name: 'Pomegranate', nameAr: 'رمان', slug: 'pomegranate', priceAED: 16.00, unit: 'kg', stock: 70, isFeatured: false, isOrganic: false, origin: 'Iran', emoji: '🍎' },
    { name: 'Lemon', nameAr: 'ليمون', slug: 'lemon', priceAED: 6.00, unit: 'kg', stock: 150, isFeatured: false, isOrganic: false, origin: 'Egypt', emoji: '🍋' },
    { name: 'Lime', nameAr: 'ليمون أخضر', slug: 'lime', priceAED: 7.00, unit: 'kg', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🍋' },
    { name: 'Pear Williams', nameAr: 'كمثرى ويليامز', slug: 'pear-williams', priceAED: 13.00, unit: 'kg', stock: 70, isFeatured: false, isOrganic: false, origin: 'South Africa', emoji: '🍐' },
    { name: 'Peach', nameAr: 'خوخ', slug: 'peach', priceAED: 18.00, unit: 'kg', stock: 50, isFeatured: false, isOrganic: false, origin: 'USA', emoji: '🍑' },
    { name: 'Kiwi', nameAr: 'كيوي', slug: 'kiwi', priceAED: 20.00, unit: 'kg', stock: 60, isFeatured: true, isOrganic: false, origin: 'New Zealand', emoji: '🥝' },
    { name: 'Pineapple', nameAr: 'أناناس', slug: 'pineapple', priceAED: 14.00, unit: 'piece', stock: 50, isFeatured: true, isOrganic: false, origin: 'Philippines', emoji: '🍍' },
    { name: 'Papaya', nameAr: 'بابايا', slug: 'papaya', priceAED: 10.00, unit: 'piece', stock: 60, isFeatured: false, isOrganic: false, origin: 'India', emoji: '🍈' },
    { name: 'Guava', nameAr: 'جوافة', slug: 'guava', priceAED: 9.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'Egypt', emoji: '🍐' },
    { name: 'Dates Medjool', nameAr: 'تمر مجدول', slug: 'dates-medjool', priceAED: 65.00, unit: 'kg', stock: 50, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🫐' },
    { name: 'Dates Ajwa', nameAr: 'تمر عجوة', slug: 'dates-ajwa', priceAED: 85.00, unit: 'kg', stock: 30, isFeatured: true, isOrganic: false, origin: 'Saudi Arabia', emoji: '🫐' },
    { name: 'Fig Fresh', nameAr: 'تين طازج', slug: 'fig-fresh', priceAED: 22.00, unit: 'kg', stock: 30, isFeatured: false, isOrganic: false, origin: 'Turkey', emoji: '🍈' },
    { name: 'Coconut', nameAr: 'جوز الهند', slug: 'coconut', priceAED: 8.00, unit: 'piece', stock: 80, isFeatured: false, isOrganic: false, origin: 'Sri Lanka', emoji: '🥥' },
    { name: 'Avocado', nameAr: 'أفوكادو', slug: 'avocado', priceAED: 22.00, unit: 'piece', stock: 60, isFeatured: true, isOrganic: false, origin: 'Kenya', emoji: '🥑' },
    { name: 'Blueberry', nameAr: 'توت أزرق', slug: 'blueberry', priceAED: 32.00, unit: 'pack', stock: 40, isFeatured: true, isOrganic: false, origin: 'Chile', emoji: '🫐' },
    { name: 'Raspberry', nameAr: 'توت العليق', slug: 'raspberry', priceAED: 35.00, unit: 'pack', stock: 30, isFeatured: false, isOrganic: false, origin: 'Morocco', emoji: '🍓' },
  ],
  vegetables: [
    { name: 'Tomato', nameAr: 'طماطم', slug: 'tomato', priceAED: 5.00, unit: 'kg', stock: 200, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🍅' },
    { name: 'Tomato Cherry', nameAr: 'طماطم كرزية', slug: 'tomato-cherry', priceAED: 12.00, unit: 'pack', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🍅' },
    { name: 'Potato', nameAr: 'بطاطا', slug: 'potato', priceAED: 4.00, unit: 'kg', stock: 300, isFeatured: true, isOrganic: false, origin: 'Egypt', emoji: '🥔' },
    { name: 'Onion', nameAr: 'بصل', slug: 'onion', priceAED: 3.50, unit: 'kg', stock: 250, isFeatured: false, isOrganic: false, origin: 'India', emoji: '🧅' },
    { name: 'Garlic', nameAr: 'ثوم', slug: 'garlic', priceAED: 18.00, unit: 'kg', stock: 100, isFeatured: false, isOrganic: false, origin: 'China', emoji: '🧄' },
    { name: 'Cucumber', nameAr: 'خيار', slug: 'cucumber', priceAED: 4.50, unit: 'kg', stock: 150, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🥒' },
    { name: 'Carrot', nameAr: 'جزر', slug: 'carrot', priceAED: 4.00, unit: 'kg', stock: 200, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🥕' },
    { name: 'Bell Pepper Red', nameAr: 'فلفل أحمر', slug: 'bell-pepper-red', priceAED: 10.00, unit: 'kg', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🫑' },
    { name: 'Bell Pepper Green', nameAr: 'فلفل أخضر', slug: 'bell-pepper-green', priceAED: 8.00, unit: 'kg', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🫑' },
    { name: 'Broccoli', nameAr: 'بروكلي', slug: 'broccoli', priceAED: 12.00, unit: 'piece', stock: 80, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🥦' },
    { name: 'Cauliflower', nameAr: 'قرنبيط', slug: 'cauliflower', priceAED: 10.00, unit: 'piece', stock: 80, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🥦' },
    { name: 'Spinach', nameAr: 'سبانخ', slug: 'spinach', priceAED: 6.00, unit: 'bunch', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🥬' },
    { name: 'Lettuce Iceberg', nameAr: 'خس', slug: 'lettuce-iceberg', priceAED: 5.00, unit: 'piece', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🥬' },
    { name: 'Cabbage', nameAr: 'كرنب', slug: 'cabbage', priceAED: 6.00, unit: 'piece', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🥬' },
    { name: 'Eggplant', nameAr: 'باذنجان', slug: 'eggplant', priceAED: 7.00, unit: 'kg', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🍆' },
    { name: 'Zucchini', nameAr: 'كوسا', slug: 'zucchini', priceAED: 7.00, unit: 'kg', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🥒' },
    { name: 'Mushroom Button', nameAr: 'فطر', slug: 'mushroom-button', priceAED: 14.00, unit: 'pack', stock: 80, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🍄' },
    { name: 'Ginger', nameAr: 'زنجبيل', slug: 'ginger', priceAED: 20.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: false, origin: 'India', emoji: '🫚' },
    { name: 'Green Chilli', nameAr: 'فلفل أخضر حار', slug: 'green-chilli', priceAED: 8.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🌶️' },
    { name: 'Peas', nameAr: 'بازلاء', slug: 'peas', priceAED: 9.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🫛' },
    { name: 'Corn', nameAr: 'ذرة', slug: 'corn', priceAED: 3.00, unit: 'piece', stock: 150, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🌽' },
    { name: 'Beetroot', nameAr: 'شمندر', slug: 'beetroot', priceAED: 8.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🟣' },
    { name: 'Sweet Potato', nameAr: 'بطاطا حلوة', slug: 'sweet-potato', priceAED: 9.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'Egypt', emoji: '🍠' },
    { name: 'Celery', nameAr: 'كرفس', slug: 'celery', priceAED: 8.00, unit: 'bunch', stock: 60, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🥬' },
    { name: 'Parsley', nameAr: 'بقدونس', slug: 'parsley', priceAED: 4.00, unit: 'bunch', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🌿' },
    { name: 'Mint', nameAr: 'نعناع', slug: 'mint', priceAED: 3.00, unit: 'bunch', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🌿' },
    { name: 'Coriander', nameAr: 'كزبرة', slug: 'coriander', priceAED: 3.00, unit: 'bunch', stock: 100, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🌿' },
    { name: 'Pumpkin', nameAr: 'قرع', slug: 'pumpkin', priceAED: 6.00, unit: 'kg', stock: 80, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🎃' },
    { name: 'Leek', nameAr: 'كراث', slug: 'leek', priceAED: 8.00, unit: 'bunch', stock: 60, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🧅' },
    { name: 'Radish', nameAr: 'فجل', slug: 'radish', priceAED: 5.00, unit: 'bunch', stock: 80, isFeatured: false, isOrganic: false, origin: 'UAE', emoji: '🌰' },
  ],
  organic: [
    { name: 'Organic Tomato', nameAr: 'طماطم عضوية', slug: 'organic-tomato', priceAED: 12.00, unit: 'kg', stock: 60, isFeatured: true, isOrganic: true, origin: 'UAE', emoji: '🍅' },
    { name: 'Organic Spinach', nameAr: 'سبانخ عضوية', slug: 'organic-spinach', priceAED: 14.00, unit: 'bunch', stock: 50, isFeatured: false, isOrganic: true, origin: 'UAE', emoji: '🥬' },
    { name: 'Organic Cucumber', nameAr: 'خيار عضوي', slug: 'organic-cucumber', priceAED: 10.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: true, origin: 'UAE', emoji: '🥒' },
    { name: 'Organic Carrot', nameAr: 'جزر عضوي', slug: 'organic-carrot', priceAED: 10.00, unit: 'kg', stock: 60, isFeatured: true, isOrganic: true, origin: 'UAE', emoji: '🥕' },
    { name: 'Organic Apple', nameAr: 'تفاح عضوي', slug: 'organic-apple', priceAED: 18.00, unit: 'kg', stock: 50, isFeatured: true, isOrganic: true, origin: 'USA', emoji: '🍎' },
    { name: 'Organic Lemon', nameAr: 'ليمون عضوي', slug: 'organic-lemon', priceAED: 12.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: true, origin: 'Egypt', emoji: '🍋' },
    { name: 'Organic Ginger', nameAr: 'زنجبيل عضوي', slug: 'organic-ginger', priceAED: 35.00, unit: 'kg', stock: 30, isFeatured: false, isOrganic: true, origin: 'India', emoji: '🫚' },
    { name: 'Organic Broccoli', nameAr: 'بروكلي عضوي', slug: 'organic-broccoli', priceAED: 18.00, unit: 'piece', stock: 40, isFeatured: false, isOrganic: true, origin: 'UAE', emoji: '🥦' },
    { name: 'Organic Avocado', nameAr: 'أفوكادو عضوي', slug: 'organic-avocado', priceAED: 30.00, unit: 'piece', stock: 30, isFeatured: true, isOrganic: true, origin: 'Kenya', emoji: '🥑' },
    { name: 'Organic Kiwi', nameAr: 'كيوي عضوي', slug: 'organic-kiwi', priceAED: 28.00, unit: 'kg', stock: 30, isFeatured: false, isOrganic: true, origin: 'New Zealand', emoji: '🥝' },
    { name: 'Organic Mixed Salad', nameAr: 'سلطة مشكلة عضوية', slug: 'organic-mixed-salad', priceAED: 16.00, unit: 'pack', stock: 50, isFeatured: true, isOrganic: true, origin: 'UAE', emoji: '🥗' },
    { name: 'Organic Onion', nameAr: 'بصل عضوي', slug: 'organic-onion', priceAED: 8.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: true, origin: 'UAE', emoji: '🧅' },
    { name: 'Organic Potato', nameAr: 'بطاطا عضوية', slug: 'organic-potato', priceAED: 9.00, unit: 'kg', stock: 60, isFeatured: false, isOrganic: true, origin: 'UAE', emoji: '🥔' },
    { name: 'Organic Garlic', nameAr: 'ثوم عضوي', slug: 'organic-garlic', priceAED: 30.00, unit: 'kg', stock: 30, isFeatured: false, isOrganic: true, origin: 'UAE', emoji: '🧄' },
    { name: 'Organic Blueberry', nameAr: 'توت أزرق عضوي', slug: 'organic-blueberry', priceAED: 45.00, unit: 'pack', stock: 20, isFeatured: true, isOrganic: true, origin: 'Chile', emoji: '🫐' },
  ],
  exotic: [
    { name: 'Dragon Fruit', nameAr: 'فاكهة التنين', slug: 'dragon-fruit', priceAED: 35.00, unit: 'piece', stock: 30, isFeatured: true, isOrganic: false, origin: 'Vietnam', emoji: '🐉' },
    { name: 'Passion Fruit', nameAr: 'فاكهة الشغف', slug: 'passion-fruit', priceAED: 30.00, unit: 'kg', stock: 30, isFeatured: true, isOrganic: false, origin: 'Kenya', emoji: '🌺' },
    { name: 'Jackfruit', nameAr: 'جاكفروت', slug: 'jackfruit', priceAED: 40.00, unit: 'kg', stock: 20, isFeatured: false, isOrganic: false, origin: 'India', emoji: '🍈' },
    { name: 'Lychee', nameAr: 'ليتشي', slug: 'lychee', priceAED: 38.00, unit: 'kg', stock: 25, isFeatured: true, isOrganic: false, origin: 'Thailand', emoji: '🍒' },
    { name: 'Longan', nameAr: 'لونجان', slug: 'longan', priceAED: 32.00, unit: 'kg', stock: 25, isFeatured: false, isOrganic: false, origin: 'Thailand', emoji: '🍈' },
    { name: 'Rambutan', nameAr: 'رامبوتان', slug: 'rambutan', priceAED: 35.00, unit: 'kg', stock: 20, isFeatured: false, isOrganic: false, origin: 'Thailand', emoji: '🌺' },
    { name: 'Star Fruit', nameAr: 'فاكهة النجمة', slug: 'star-fruit', priceAED: 28.00, unit: 'kg', stock: 20, isFeatured: false, isOrganic: false, origin: 'Malaysia', emoji: '⭐' },
    { name: 'Mangosteen', nameAr: 'مانجوستين', slug: 'mangosteen', priceAED: 65.00, unit: 'kg', stock: 15, isFeatured: true, isOrganic: false, origin: 'Thailand', emoji: '🟣' },
    { name: 'Durian', nameAr: 'دوريان', slug: 'durian', priceAED: 85.00, unit: 'piece', stock: 10, isFeatured: false, isOrganic: false, origin: 'Thailand', emoji: '🟡' },
    { name: 'Persimmon', nameAr: 'كاكي', slug: 'persimmon', priceAED: 22.00, unit: 'kg', stock: 25, isFeatured: false, isOrganic: false, origin: 'China', emoji: '🟠' },
    { name: 'Tamarind', nameAr: 'تمر هندي', slug: 'tamarind', priceAED: 15.00, unit: 'kg', stock: 30, isFeatured: false, isOrganic: false, origin: 'India', emoji: '🍂' },
    { name: 'Sapodilla', nameAr: 'سبوتة', slug: 'sapodilla', priceAED: 18.00, unit: 'kg', stock: 25, isFeatured: false, isOrganic: false, origin: 'India', emoji: '🟤' },
    { name: 'Custard Apple', nameAr: 'قشطة', slug: 'custard-apple', priceAED: 25.00, unit: 'kg', stock: 20, isFeatured: false, isOrganic: false, origin: 'India', emoji: '💚' },
    { name: 'Breadfruit', nameAr: 'خبز الشجرة', slug: 'breadfruit', priceAED: 18.00, unit: 'piece', stock: 15, isFeatured: false, isOrganic: false, origin: 'Sri Lanka', emoji: '🟢' },
    { name: 'Yellow Watermelon', nameAr: 'بطيخ أصفر', slug: 'yellow-watermelon', priceAED: 18.00, unit: 'piece', stock: 20, isFeatured: true, isOrganic: false, origin: 'UAE', emoji: '🍉' },
  ]
}

async function seed() {
  console.log('🌱 Connecting to MongoDB...')
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('tmfoodstuff')
  console.log('✅ Connected\n')

  // Seed categories
  console.log('📂 Seeding categories...')
  const catCollection = db.collection('categories')
  const catIdMap = {}

  for (const cat of categories) {
    const existing = await catCollection.findOne({ slug: cat.slug })
    if (existing) {
      catIdMap[cat.slug] = existing._id
      console.log(`  ↩ Exists: ${cat.name}`)
      continue
    }
    const now = new Date()
    const result = await catCollection.insertOne({
      ...cat,
      createdAt: now,
      updatedAt: now,
    })
    catIdMap[cat.slug] = result.insertedId
    console.log(`  ✓ Created: ${cat.name}`)
  }

  // Seed products
  console.log('\n📦 Seeding products...')
  const prodCollection = db.collection('products')
  let created = 0, skipped = 0

  for (const [catSlug, prods] of Object.entries(productsByCat)) {
    const categoryId = catIdMap[catSlug]
    for (const product of prods) {
      const existing = await prodCollection.findOne({ slug: product.slug })
      if (existing) { skipped++; continue }
      const now = new Date()
      await prodCollection.insertOne({
        ...product,
        category: categoryId,
        isActive: true,
        description: `Fresh ${product.name} delivered to your door across UAE.`,
        createdAt: now,
        updatedAt: now,
      })
      created++
    }
  }

  console.log(`\n✅ Done! ${created} products created, ${skipped} skipped`)
  await client.close()
  process.exit(0)
}

seed().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
