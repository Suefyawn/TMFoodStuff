export default function DeliveryPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-black text-gray-900 mb-8">Delivery Policy</h1>
      <div className="space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Areas</h2>
          <p>We deliver across all UAE emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Times</h2>
          <p>We offer three delivery slots daily: Morning (8AM–12PM), Afternoon (12PM–5PM), and Evening (5PM–10PM). Same-day delivery is available for orders placed before 2PM.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Fees</h2>
          <p>During our launch period, delivery is free on all orders. Standard delivery fee after the launch period will be AED 10 for orders under AED 150. Orders above AED 150 always qualify for free delivery.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cash on Delivery</h2>
          <p>For COD orders, a valid card is required as a security guarantee. Your card will only be charged if you are unavailable at the time of delivery.</p>
        </section>
      </div>
    </div>
  )
}
