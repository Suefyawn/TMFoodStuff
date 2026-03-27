export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-black text-gray-900 mb-8">Terms &amp; Conditions</h1>
      <div className="space-y-6 text-gray-600 leading-relaxed">
        <p>Last updated: March 2025</p>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Orders &amp; Payment</h2>
          <p>All orders are subject to product availability. Prices are in UAE Dirhams (AED) and include 5% VAT. For Cash on Delivery orders, a card is required as guarantee and will only be charged if delivery fails due to customer unavailability.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Returns &amp; Refunds</h2>
          <p>If you receive damaged or incorrect items, contact us via WhatsApp within 24 hours of delivery. We will arrange a replacement or refund at no cost to you.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Governing Law</h2>
          <p>These terms are governed by the laws of the United Arab Emirates.</p>
        </section>
      </div>
    </div>
  )
}
