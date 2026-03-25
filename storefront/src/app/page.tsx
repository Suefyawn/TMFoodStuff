import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-dark via-brand-green to-brand-light min-h-[85vh] flex items-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-white">
          <span className="inline-block bg-accent-yellow text-brand-dark text-sm font-bold px-4 py-1 rounded-full mb-6 uppercase tracking-wide">
            🌿 100% Fresh • UAE Delivered
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Fresh From Farm <br />
            <span className="text-accent-yellow">to Your Door</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            Premium fruits & vegetables sourced daily and delivered across Dubai, Abu Dhabi, Sharjah and beyond.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="bg-white text-brand-green px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
            >
              Shop Now →
            </Link>
            <Link
              href="#featured"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              See What's Fresh
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80 text-sm">
            <span>✓ Same-day delivery</span>
            <span>✓ Prices in AED</span>
            <span>✓ VAT included</span>
            <span>✓ WhatsApp support</span>
          </div>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section id="featured" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Today's Fresh Picks
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Handpicked daily for quality and freshness.
            </p>
          </div>
          {/* Product grid will be populated from Medusa */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-gray-200 h-48 w-full" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/shop" className="btn-primary inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {['🍎 Fruits', '🥦 Vegetables', '🌿 Herbs & Greens', '🥭 Exotic Fruits', '🧅 Root Vegetables', '🍋 Citrus'].map((cat) => (
              <div key={cat} className="card p-6 text-center hover:shadow-md transition-shadow cursor-pointer group">
                <span className="text-4xl mb-3 block">{cat.split(' ')[0]}</span>
                <span className="font-semibold text-gray-800 group-hover:text-brand-green transition-colors">
                  {cat.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UAE Trust Signals */}
      <section className="py-16 bg-brand-green text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl mb-3">🚚</div>
              <div className="font-bold text-lg">Fast Delivery</div>
              <div className="text-white/80 text-sm">Dubai, AUH, SHJ & more</div>
            </div>
            <div>
              <div className="text-4xl mb-3">💬</div>
              <div className="font-bold text-lg">WhatsApp Support</div>
              <div className="text-white/80 text-sm">Quick order updates</div>
            </div>
            <div>
              <div className="text-4xl mb-3">✅</div>
              <div className="font-bold text-lg">VAT Compliant</div>
              <div className="text-white/80 text-sm">5% UAE VAT included</div>
            </div>
            <div>
              <div className="text-4xl mb-3">🌱</div>
              <div className="font-bold text-lg">Farm Fresh</div>
              <div className="text-white/80 text-sm">Daily sourced produce</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
