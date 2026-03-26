import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { products } from '@/data/products'

const homeCategories = [
  { name: 'Fruits', nameAr: 'فواكه', slug: 'fruits', emoji: '🍎', color: 'bg-red-50 hover:bg-red-100', border: 'border-red-100' },
  { name: 'Vegetables', nameAr: 'خضروات', slug: 'vegetables', emoji: '🥦', color: 'bg-green-50 hover:bg-green-100', border: 'border-green-100' },
  { name: 'Organic', nameAr: 'عضوي', slug: 'organic', emoji: '🌱', color: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-100' },
  { name: 'Exotic Fruits', nameAr: 'فواكه غريبة', slug: 'exotic', emoji: '🥭', color: 'bg-yellow-50 hover:bg-yellow-100', border: 'border-yellow-100' },
  { name: 'Fresh Juices', nameAr: 'عصائر طازجة', slug: 'juices', emoji: '🧃', color: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-100' },
  { name: 'Gift Baskets', nameAr: 'سلال هدايا', slug: 'gifts', emoji: '🧺', color: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-100' },
]

export default function HomePage() {
  const featured = products.filter(p => p.isFeatured).slice(0, 10)

  return (
    <main>
      {/* Promo banner strip */}
      <div className="bg-green-600 text-white text-center py-2.5 px-4 text-sm font-semibold">
        🎉 Free delivery on first order · Use code: <span className="bg-white/20 px-2 py-0.5 rounded font-black ml-1">FRESH10</span>
        <span className="mx-3 opacity-50">·</span>
        <span className="opacity-80">Same-day delivery across UAE</span>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center" style={{background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #16a34a 100%)'}}>
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-300/5 rounded-full blur-2xl" />
        </div>

        {/* Floating emoji (background) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute top-[8%] left-[3%] text-[90px] opacity-20 rotate-[-15deg]">🍎</span>
          <span className="absolute top-[20%] right-[5%] text-[80px] opacity-15 rotate-[10deg]">🥦</span>
          <span className="absolute bottom-[20%] left-[8%] text-[70px] opacity-15 rotate-[5deg]">🍋</span>
          <span className="absolute bottom-[10%] right-[12%] text-[75px] opacity-15 rotate-[-8deg]">🥭</span>
          <span className="absolute top-[45%] right-[20%] text-[60px] opacity-10">🍇</span>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <div className="text-white">
              {/* Delivery badge */}
              <div className="inline-flex items-center gap-2 bg-amber-400/20 backdrop-blur-sm text-amber-300 border border-amber-400/30 text-sm font-bold px-5 py-2.5 rounded-full mb-8">
                <span className="text-amber-400">⚡</span> 2-4 Hour Delivery · All UAE Emirates
              </div>

              <h1 className="text-6xl md:text-7xl font-black mb-6 leading-[0.9] tracking-tight">
                Farm Fresh<br />
                <span className="text-amber-400">To Your Door</span><br />
                <span className="text-white/80 text-5xl md:text-6xl">in Hours</span>
              </h1>

              <p className="text-xl text-white/75 mb-8 max-w-lg leading-relaxed">
                Premium fruits & vegetables sourced daily from the world's best farms. Delivered fresh across all UAE emirates.
              </p>

              {/* Social proof */}
              <div className="flex items-center gap-3 mb-10">
                <div className="flex -space-x-2">
                  {['🧑', '👩', '🧔', '👱'].map((emoji, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                    ★★★★★ <span className="text-white/80 font-normal ml-1">Trusted by</span>
                  </div>
                  <div className="text-white font-black text-sm">10,000+ UAE families</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/shop"
                  className="bg-white text-green-700 font-black px-10 py-4 rounded-2xl text-lg hover:bg-amber-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-center"
                >
                  Shop Now →
                </Link>
                <Link
                  href="/shop"
                  className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-2xl text-lg hover:bg-white/10 transition-all backdrop-blur-sm text-center"
                >
                  Browse All 🛒
                </Link>
              </div>
            </div>

            {/* Right: Large emoji collage (desktop only) */}
            <div className="hidden lg:flex items-center justify-center relative">
              <div className="relative w-96 h-96">
                {/* Central large item */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                  <span className="text-8xl">🥭</span>
                </div>
                {/* Orbiting items */}
                {[
                  { emoji: '🍎', top: '0%', left: '35%', size: 'text-5xl', bg: 'bg-red-500/20' },
                  { emoji: '🫐', top: '15%', right: '0%', size: 'text-4xl', bg: 'bg-purple-500/20' },
                  { emoji: '🥦', top: '60%', right: '5%', size: 'text-5xl', bg: 'bg-green-500/20' },
                  { emoji: '🍋', bottom: '5%', left: '30%', size: 'text-4xl', bg: 'bg-yellow-500/20' },
                  { emoji: '🍇', top: '55%', left: '0%', size: 'text-4xl', bg: 'bg-purple-500/20' },
                  { emoji: '🥝', top: '10%', left: '5%', size: 'text-4xl', bg: 'bg-green-500/20' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`absolute ${item.bg} backdrop-blur-sm border border-white/20 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg`}
                    style={{
                      top: item.top,
                      left: item.left,
                      right: (item as any).right,
                      bottom: (item as any).bottom,
                    }}
                  >
                    <span className={item.size}>{item.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { num: '90+', label: 'Fresh Products' },
              { num: '6', label: 'Emirates' },
              { num: '24/7', label: 'Fresh Restocks' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-black text-amber-400">{s.num}</div>
                <div className="text-sm text-white/60 mt-1 font-medium">{s.label}</div>
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
            { icon: '⚡', text: '2-4 Hour Delivery' },
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
        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-2 md:overflow-x-visible md:grid md:grid-cols-3 lg:grid-cols-6 scrollbar-hide">
          {homeCategories.map(cat => (
            <Link
              key={cat.slug}
              href="/shop"
              className={`${cat.color} ${cat.border} border rounded-2xl p-6 text-center transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer flex-shrink-0 w-36 md:w-auto`}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">{cat.emoji}</div>
              <div className="font-bold text-gray-900 text-sm">{cat.name}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{cat.nameAr}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Picks */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full mb-3">
                ⚡ FRESHLY RESTOCKED TODAY
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-1">Today's Picks</h2>
              <p className="text-gray-500">Handpicked bestsellers · Freshest of the day</p>
            </div>
            <Link href="/shop" className="text-green-600 font-bold hover:underline text-sm hidden sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featured.map(product => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/shop" className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gray-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-4">Why TMFoodStuff?</h2>
          <p className="text-gray-400 mb-14 max-w-xl mx-auto text-lg">
            We work directly with farms so you get fresher produce at better prices.
          </p>
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
