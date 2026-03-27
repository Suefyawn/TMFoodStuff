import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { products } from '@/data/products'
import { Truck, ShieldCheck, Clock, MessageCircle, Apple, Leaf, Sprout, Sparkles, Droplets, Gift, BadgeCheck, Zap, ChevronRight, MapPin, Star } from 'lucide-react'

const homeCategories = [
  {
    name: 'Fruits',
    nameAr: 'فواكه',
    slug: 'fruits',
    icon: Apple,
    color: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-100',
    iconColor: 'text-red-500',
  },
  {
    name: 'Vegetables',
    nameAr: 'خضروات',
    slug: 'vegetables',
    icon: Leaf,
    color: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-100',
    iconColor: 'text-green-600',
  },
  {
    name: 'Organic',
    nameAr: 'عضوي',
    slug: 'organic',
    icon: Sprout,
    color: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    name: 'Exotic Fruits',
    nameAr: 'فواكه غريبة',
    slug: 'exotic',
    icon: Sparkles,
    color: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-100',
    iconColor: 'text-yellow-500',
  },
  {
    name: 'Fresh Juices',
    nameAr: 'عصائر طازجة',
    slug: 'juices',
    icon: Droplets,
    color: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-100',
    iconColor: 'text-orange-500',
  },
  {
    name: 'Gift Baskets',
    nameAr: 'سلال هدايا',
    slug: 'gifts',
    icon: Gift,
    color: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-100',
    iconColor: 'text-purple-500',
  },
]

const trustItems = [
  { icon: Truck, text: 'Farm Fresh Daily', sub: 'Sourced every morning' },
  { icon: Zap, text: '2-4 Hour Delivery', sub: 'Across all UAE' },
  { icon: ShieldCheck, text: 'Secure Checkout', sub: 'Encrypted & safe' },
  { icon: MessageCircle, text: 'WhatsApp Updates', sub: 'Real-time tracking' },
]

const whyUs = [
  {
    icon: Sprout,
    title: 'Direct from Farms',
    desc: 'No middlemen. Fresh produce sourced directly from local and international farms every single day.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: Zap,
    title: 'Fast Delivery',
    desc: 'Same-day delivery across Dubai, Abu Dhabi, Sharjah, Ajman, RAK, and Fujairah.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Guaranteed',
    desc: "Every item is quality-checked before packing. Not satisfied? We'll make it right, no questions asked.",
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
]

export default function HomePage() {
  const featured = products.filter(p => p.isFeatured).slice(0, 10)

  return (
    <main className="scroll-mt-20">
      {/* Promo banner strip */}
      <div className="bg-green-600 text-white text-center py-2.5 px-4 text-sm font-semibold">
        <span className="md:hidden">
          Free delivery · Code: <span className="bg-white/20 px-2 py-0.5 rounded font-black">FRESH10</span>
        </span>
        <span className="hidden md:inline">
          Free delivery on first order · Use code:{' '}
          <span className="bg-white/20 px-2 py-0.5 rounded font-black ml-1">FRESH10</span>
          <span className="mx-3 opacity-50">·</span>
          <span className="opacity-80">Same-day delivery across UAE</span>
        </span>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #16a34a 100%)' }}
      >
        {/* SVG geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text content — centered on mobile */}
            <div className="text-white text-center lg:text-left">
              {/* Delivery badge */}
              <div className="inline-flex items-center gap-2 bg-amber-400/20 backdrop-blur-sm text-amber-300 border border-amber-400/30 text-xs md:text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full mb-6 md:mb-8">
                <Zap size={12} className="text-amber-400" />
                2-4 Hour Delivery · All UAE Emirates
              </div>

              <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-black mb-5 md:mb-6 leading-[0.95] tracking-tight">
                Farm Fresh<br />
                <span className="text-amber-400">To Your Door</span><br />
                <span className="text-white/80 text-4xl md:text-5xl lg:text-6xl">in Hours</span>
              </h1>

              <p className="text-base md:text-xl text-white/75 mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Premium fruits &amp; vegetables sourced daily from the world&apos;s best farms. Delivered fresh across all UAE emirates.
              </p>

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8 md:mb-10">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <span className="text-white/60 text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                    {[0,1,2,3,4].map(i => <Star key={i} size={12} fill="currentColor" />)}
                    <span className="text-white/80 font-normal ml-1">Trusted by</span>
                  </div>
                  <div className="text-white font-black text-sm">10,000+ UAE families</div>
                </div>
              </div>

              {/* CTA Buttons — full width stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/shop"
                  className="bg-white text-green-700 font-black px-8 md:px-10 py-4 rounded-2xl text-base md:text-lg hover:bg-amber-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-center inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Shop Now
                  <ChevronRight size={20} />
                </Link>
                <Link
                  href="/shop"
                  className="border-2 border-white/40 text-white font-bold px-8 md:px-10 py-4 rounded-2xl text-base md:text-lg hover:bg-white/10 transition-all backdrop-blur-sm text-center w-full sm:w-auto"
                >
                  Browse All
                </Link>
              </div>
            </div>

            {/* Right: Hero visual (desktop only) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative aspect-square w-96 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                <Leaf size={120} className="text-white/30" />
                <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white/40" />
                <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-emerald-400/50" />
                <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-amber-300/40" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-green-700 text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Apple size={12} /> Fresh Fruits
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Truck size={12} /> Same Day Delivery
                </div>
              </div>
            </div>
          </div>

          {/* Stats row — 3 columns on mobile with smaller text */}
          <div className="mt-12 md:mt-16 grid grid-cols-3 gap-3 md:gap-6 max-w-xs md:max-w-lg mx-auto lg:mx-0">
            {[
              { num: '90+', label: 'Fresh Products' },
              { num: '6', label: 'Emirates' },
              { num: '24/7', label: 'Fresh Restocks' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-4xl font-black text-amber-400">{s.num}</div>
                <div className="text-xs md:text-sm text-white/60 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {trustItems.map(item => (
            <div key={item.text} className="flex items-center justify-center gap-2 md:gap-2.5 py-2">
              <item.icon size={16} className="text-green-600 flex-shrink-0" />
              <div>
                <div className="text-xs md:text-sm font-semibold text-gray-800">{item.text}</div>
                <div className="text-xs text-gray-400 hidden sm:block">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20 scroll-mt-20">
        <div className="mb-6 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-gray-500 text-base md:text-lg">Everything fresh, delivered to your door</p>
        </div>
        {/* Grid on mobile (2 cols), 3 on sm, 6 on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {homeCategories.map(cat => {
            const IconComp = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className={`${cat.color} ${cat.border} border rounded-2xl p-4 md:p-6 text-center transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer active:scale-95`}
              >
                <div className={`flex justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-200 ${cat.iconColor}`}>
                  <IconComp size={32} className="md:hidden" />
                  <IconComp size={40} className="hidden md:block" />
                </div>
                <div className="font-bold text-gray-900 text-sm">{cat.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium">{cat.nameAr}</div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Today's Picks */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full mb-3">
                <Zap size={11} /> FRESHLY RESTOCKED TODAY
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">Today&apos;s Picks</h2>
              <p className="text-gray-500 text-sm md:text-base">Handpicked bestsellers · Freshest of the day</p>
            </div>
            <Link href="/shop" className="text-green-600 font-bold hover:underline text-sm hidden sm:flex items-center gap-1">
              View all <ChevronRight size={16} className="inline" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {featured.map(product => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/shop" className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gray-950 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Why TMFoodStuff?</h2>
          <p className="text-gray-400 mb-10 md:mb-14 max-w-xl mx-auto text-base md:text-lg">
            We work directly with farms so you get fresher produce at better prices.
          </p>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {whyUs.map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-left hover:bg-white/10 transition-colors">
                <div className={`w-12 h-12 md:w-14 md:h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-4 md:mb-5`}>
                  <item.icon size={24} className={item.color} />
                </div>
                <h3 className="text-lg md:text-xl font-black mb-2 md:mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery zones */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin size={20} className="text-green-600" />
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Delivering Across UAE</h2>
        </div>
        <p className="text-gray-500 mb-6 md:mb-8">We cover all major emirates</p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'].map(city => (
            <span
              key={city}
              className="bg-gray-100 text-gray-800 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-semibold text-sm hover:bg-green-100 hover:text-green-800 transition-colors cursor-default"
            >
              {city}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
