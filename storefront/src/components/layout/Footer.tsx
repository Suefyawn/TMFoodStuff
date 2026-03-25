import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-dark text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🥦</span>
              <span className="font-bold text-xl tracking-tight">TMFoodStuff</span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Fresh fruits & vegetables delivered across UAE. Farm to door, every day.
            </p>
            <a
              href="https://wa.me/971XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 transition-colors px-4 py-2 rounded-lg text-sm font-semibold"
            >
              💬 WhatsApp Us
            </a>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="font-bold text-base mb-4 text-white/90">Shop</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/shop?cat=fruits" className="hover:text-white transition-colors">Fruits</Link></li>
              <li><Link href="/shop?cat=vegetables" className="hover:text-white transition-colors">Vegetables</Link></li>
              <li><Link href="/shop?cat=herbs" className="hover:text-white transition-colors">Herbs & Greens</Link></li>
              <li><Link href="/shop?cat=exotic" className="hover:text-white transition-colors">Exotic Fruits</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-bold text-base mb-4 text-white/90">Company</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/delivery" className="hover:text-white transition-colors">Delivery Info</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Legal & compliance */}
          <div>
            <h3 className="font-bold text-base mb-4 text-white/90">Legal</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns Policy</Link></li>
            </ul>
            <div className="mt-6 p-3 bg-white/10 rounded-lg text-xs text-white/60">
              <p className="font-semibold text-white/80 mb-1">UAE VAT Registered</p>
              <p>TRN: [Your TRN Number]</p>
              <p className="mt-1">5% VAT applied on all orders</p>
            </div>
          </div>
        </div>

        {/* Delivery zones */}
        <div className="border-t border-white/10 mt-10 pt-6">
          <p className="text-white/60 text-xs text-center mb-2">
            🚚 Delivering to: Dubai · Abu Dhabi · Sharjah · Ajman · Ras Al Khaimah
          </p>
          <p className="text-white/40 text-xs text-center">
            © {currentYear} TMFoodStuff. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
