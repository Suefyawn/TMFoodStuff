const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971544408411'
const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL || 'hello@tmfoodstuff.ae'

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-black text-gray-900 mb-4">Contact Us</h1>
      <p className="text-gray-500 mb-12 text-lg">We are here to help. Reach us via WhatsApp for the fastest response.</p>
      <div className="grid md:grid-cols-2 gap-6 text-left">
        <a
          href={`https://wa.me/${WHATSAPP}?text=Hi%20TMFoodStuff%2C%20I%20need%20help`}
          className="flex items-start gap-4 bg-green-50 border border-green-100 rounded-2xl p-6 hover:bg-green-100 transition-colors"
        >
          <span className="text-3xl">📱</span>
          <div>
            <div className="font-bold text-gray-900 mb-1">WhatsApp</div>
            <div className="text-sm text-gray-500">Fastest response · Available 7AM–10PM</div>
          </div>
        </a>
        <a
          href={`mailto:${STORE_EMAIL}`}
          className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:bg-gray-100 transition-colors"
        >
          <span className="text-3xl">📧</span>
          <div>
            <div className="font-bold text-gray-900 mb-1">Email</div>
            <div className="text-sm text-gray-500">{STORE_EMAIL}</div>
            <div className="text-xs text-gray-400 mt-1">Response within 24 hours</div>
          </div>
        </a>
        <div className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <span className="text-3xl">🕐</span>
          <div>
            <div className="font-bold text-gray-900 mb-1">Operating Hours</div>
            <div className="text-sm text-gray-500">Daily · 7:00 AM – 10:00 PM</div>
          </div>
        </div>
        <div className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <span className="text-3xl">🇦🇪</span>
          <div>
            <div className="font-bold text-gray-900 mb-1">Delivery Coverage</div>
            <div className="text-sm text-gray-500">All UAE Emirates</div>
          </div>
        </div>
      </div>
    </div>
  )
}
