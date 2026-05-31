import type { Metadata } from 'next'
import { Sprout, Zap, BadgeCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'TMFoodStuff is a UAE-based fresh produce delivery service sourcing direct from farms. Same-day delivery, fair prices, premium quality across all emirates.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  const values = [
    { icon: Sprout, title: 'Farm Direct', desc: 'We work directly with local and international farms, cutting out middlemen to ensure maximum freshness.' },
    { icon: Zap, title: 'Fast Delivery', desc: 'Same-day delivery across all UAE emirates. Order before 2PM for morning delivery.' },
    { icon: BadgeCheck, title: 'Quality Promise', desc: 'Every item is checked before packing. Not satisfied? We will make it right, guaranteed.' },
  ]
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-6">About TMFoodStuff</h1>
      <p className="text-lg text-stone-600 mb-6 leading-relaxed">
        TMFoodStuff is a premium fresh fruits and vegetables delivery service operating across the UAE.
        We source directly from farms to bring you the freshest produce at fair prices, delivered to your door.
      </p>
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {values.map(item => (
          <div key={item.title} className="surface-card p-6">
            <div className="w-11 h-11 rounded-xl bg-forest/10 flex items-center justify-center mb-4">
              <item.icon size={22} className="text-forest" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
            <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
