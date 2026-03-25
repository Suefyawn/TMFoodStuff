import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🥦</span>
            <span className="font-black text-white text-xl">TMFoodStuff</span>
          </div>
          <p className="text-sm leading-relaxed mb-5">Fresh fruits & vegetables delivered daily across the UAE. Farm to door.</p>
          <a href="https://wa.me/971500000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
            📱 WhatsApp Us
          </a>
        </div>
        <div>
          <h4 className="font-black text-white mb-5">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            {[['Fruits', '/shop/fruits'], ['Vegetables', '/shop/vegetables'], ['Organic', '/shop/organic'], ['Exotic Fruits', '/shop/exotic'], ['Gift Baskets', '/shop/gifts']].map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-black text-white mb-5">Delivery Areas</h4>
          <ul className="space-y-2.5 text-sm">
            {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'].map(city => (
              <li key={city}>{city}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-black text-white mb-5">Company</h4>
          <ul className="space-y-2.5 text-sm">
            {[['About Us', '#'], ['Delivery Policy', '#'], ['Privacy Policy', '#'], ['Terms & Conditions', '#'], ['Contact Us', '#']].map(([label, href]) => (
              <li key={label}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center text-xs gap-2">
        <span>© 2024 TMFoodStuff. All rights reserved. | VAT Registered UAE</span>
        <span>All prices in AED · 5% VAT included</span>
      </div>
    </footer>
  )
}
