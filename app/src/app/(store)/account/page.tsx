export default function AccountPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">👤</span>
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Account</h1>
      <p className="text-gray-500 text-lg mb-2">Coming Soon</p>
      <p className="text-gray-400 text-sm mb-8">
        Customer accounts are on their way. In the meantime, reach us via WhatsApp for order tracking and support.
      </p>
      {/* TODO: Replace with real WhatsApp number */}
      <a
        href="https://wa.me/971000000000?text=Hi%20TMFoodStuff%2C%20I%20need%20help%20with%20my%20order"
        className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
      >
        📱 WhatsApp Support
      </a>
    </div>
  )
}
