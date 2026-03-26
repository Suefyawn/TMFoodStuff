import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/971500000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
        title="WhatsApp Us"
      >
        📱
      </a>

      <footer className="bg-gray-950 text-gray-400 mt-20">
        {/* Newsletter strip */}
        <div className="border-b border-white/10 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl mb-1">Get freshness in your inbox 🌿</h3>
              <p className="text-gray-400 text-sm">Weekly deals, new arrivals, and exclusive offers.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-64 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">TM</span>
              </div>
              <span className="font-black text-white text-xl">
                TM<span className="text-green-500">Food</span>Stuff
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-gray-500">
              Premium fresh fruits & vegetables delivered daily across the UAE. Farm to door, always fresh.
            </p>

            {/* App download badges */}
            <div className="flex flex-col gap-2 mb-5">
              <button className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors w-full">
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Download on the</div>
                  <div className="font-black text-sm">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors w-full">
                <span className="text-2xl">▶️</span>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="font-black text-sm">Google Play</div>
                </div>
              </button>
            </div>

            <a
              href="https://wa.me/971500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
            >
              📱 WhatsApp Us
            </a>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-black text-white mb-5">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['🍎 Fruits', '/shop'],
                ['🥦 Vegetables', '/shop'],
                ['🌱 Organic', '/shop'],
                ['🥭 Exotic Fruits', '/shop'],
                ['🧺 Gift Baskets', '/shop'],
                ['🛍️ All Products', '/shop'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Areas */}
          <div>
            <h4 className="font-black text-white mb-5">Delivery Areas 🇦🇪</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                'Dubai',
                'Abu Dhabi',
                'Sharjah',
                'Ajman',
                'Ras Al Khaimah',
                'Fujairah',
                'Umm Al Quwain',
              ].map(city => (
                <li key={city} className="hover:text-white transition-colors cursor-default">
                  {city}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-black text-white mb-5">Company</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['About Us', '#'],
                ['Delivery Policy', '#'],
                ['Privacy Policy', '#'],
                ['Terms & Conditions', '#'],
                ['Contact Us', '#'],
                ['Careers', '#'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Payment methods */}
            <div className="mt-6">
              <h5 className="text-white font-bold text-sm mb-3">We Accept</h5>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">VISA</span>
                <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">MC</span>
                <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">💵 COD</span>
                <span className="bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">📱 Pay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center text-xs gap-2">
          <span className="text-gray-500">© 2024 TMFoodStuff. All rights reserved. | VAT Registered UAE</span>
          <span className="text-gray-500">All prices in AED · 5% VAT included</span>
        </div>
      </footer>
    </>
  )
}
