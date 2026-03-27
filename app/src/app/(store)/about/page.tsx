export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-black text-gray-900 mb-6">About TMFoodStuff</h1>
      <p className="text-lg text-gray-600 mb-6 leading-relaxed">
        TMFoodStuff is a premium fresh fruits and vegetables delivery service operating across the UAE.
        We source directly from farms to bring you the freshest produce at fair prices, delivered to your door.
      </p>
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {[
          { icon: '🌱', title: 'Farm Direct', desc: 'We work directly with local and international farms, cutting out middlemen to ensure maximum freshness.' },
          { icon: '⚡', title: 'Fast Delivery', desc: 'Same-day delivery across all UAE emirates. Order before 2PM for morning delivery.' },
          { icon: '✅', title: 'Quality Promise', desc: 'Every item is checked before packing. Not satisfied? We will make it right, guaranteed.' },
        ].map(item => (
          <div key={item.title} className="bg-gray-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
