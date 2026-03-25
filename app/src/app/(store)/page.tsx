import Link from 'next/link'

const categories = [
  { name: 'Fruits', nameAr: 'فواكه', slug: 'fruits', emoji: '🍎', color: 'bg-red-50 hover:bg-red-100' },
  { name: 'Vegetables', nameAr: 'خضروات', slug: 'vegetables', emoji: '🥦', color: 'bg-green-50 hover:bg-green-100' },
  { name: 'Organic', nameAr: 'عضوي', slug: 'organic', emoji: '🌱', color: 'bg-emerald-50 hover:bg-emerald-100' },
  { name: 'Exotic Fruits', nameAr: 'فواكه غريبة', slug: 'exotic', emoji: '🥭', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { name: 'Fresh Juices', nameAr: 'عصائر طازجة', slug: 'juices', emoji: '🧃', color: 'bg-orange-50 hover:bg-orange-100' },
  { name: 'Gift Baskets', nameAr: 'سلال هدايا', slug: 'gifts', emoji: '🧺', color: 'bg-purple-50 hover:bg-purple-100' },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-10">
          <span className="absolute top-10 left-[5%] text-[120px]">🍎</span>
          <span className="absolute top-[15%] right-[8%] text-[100px]">🥦</span>
          <span className="absolute bottom-[15%] left-[30%] text-[90px]">🥭</span>
          <span className="absolute bottom-[5%] right-[20%] text-[80px]">🍋</span>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center w-full">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-sm font-semibold px-5 py-2 rounded-full mb-8 border border-white/30">
            🚚 Free delivery on orders above AED 150
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tight">
            Fresh From<br />
            <span className="text-yellow-300">Farm to Door</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
            Premium fruits & vegetables sourced daily. Delivered across all UAE emirates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="bg-white text-green-700 font-black px-10 py-4 rounded-2xl text-lg hover:bg-yellow-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              Shop Now →
            </Link>
            <Link href="/shop/fruits" className="border-2 border-white/50 text-white font-bold px-10 py-4 rounded-2xl text-lg hover:bg-white/15 transition-all backdrop-blur-sm">
              Browse Fruits 🍎
            </Link>
          </div>
          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
            {[
              { num: '500+', label: 'Products' },
              { num: '6', label: 'Emirates' },
              { num: 'Daily', label: 'Fresh Delivery' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-yellow-300">{s.num}</div>
                <div className="text-sm text-white/70 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '🌿', text: 'Farm Fresh Daily' },
            { icon: '⚡', text: 'Same Day Delivery' },
            { icon: '🔒', text: 'Secure Checkout' },
            { icon: '📱', text: 'WhatsApp Updates' },
          ].map(item => (
            <div key={item.text} className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 py-2">
              <span className="text-lg">{item.icon}</span> {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-gray-500 text-lg">Everything fresh, delivered to your door</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className={`${cat.color} rounded-2xl p-6 text-center transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer`}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">{cat.emoji}</div>
              <div className="font-bold text-gray-900 text-sm">{cat.name}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{cat.nameAr}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gray-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-4">Why TMFoodStuff?</h2>
          <p className="text-gray-400 mb-14 max-w-xl mx-auto text-lg">We work directly with farms so you get fresher produce at better prices.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌱', title: 'Direct from Farms', desc: 'No middlemen. Fresh produce sourced directly from local and international farms every single day.' },
              { icon: '⚡', title: 'Fast Delivery', desc: 'Same-day delivery across Dubai, Abu Dhabi, Sharjah, Ajman, RAK, and Fujairah.' },
              { icon: '✅', title: 'Quality Guaranteed', desc: "Every item is quality-checked before packing. Not satisfied? We'll make it right, no questions asked." },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-left hover:bg-white/10 transition-colors">
                <div className="text-5xl mb-5">{item.icon}</div>
                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery zones */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-3">Delivering Across UAE 🇦🇪</h2>
        <p className="text-gray-500 mb-8">We cover all major emirates</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'].map(city => (
            <span key={city} className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-green-100 hover:text-green-800 transition-colors cursor-default">
              {city}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
