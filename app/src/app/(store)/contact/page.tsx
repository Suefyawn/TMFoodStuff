import type { Metadata } from 'next'
import { MessageCircle, Mail, Clock, MapPin } from 'lucide-react'
import ContactForm from './ContactForm'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971544408411'
const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL || 'hello@tmfoodstuff.ae'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with TMFoodStuff. WhatsApp is the fastest way to reach our support team — order changes, delivery questions, and feedback welcome.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-4">Contact Us</h1>
      <p className="text-stone-500 mb-12 text-lg">We are here to help. Reach us via WhatsApp for the fastest response.</p>
      <div className="grid md:grid-cols-2 gap-6 text-left">
        <a
          href={`https://wa.me/${WHATSAPP}?text=Hi%20TMFoodStuff%2C%20I%20need%20help`}
          className="flex items-start gap-4 surface-card p-6 hover:border-forest/40 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={20} className="text-forest" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-stone-900 mb-1">WhatsApp</div>
            <div className="text-sm text-stone-500">Fastest response · Available 7AM–10PM</div>
          </div>
        </a>
        <a
          href={`mailto:${STORE_EMAIL}`}
          className="flex items-start gap-4 surface-card p-6 hover:border-forest/40 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Mail size={20} className="text-stone-600" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-stone-900 mb-1">Email</div>
            <div className="text-sm text-stone-500">{STORE_EMAIL}</div>
            <div className="text-xs text-stone-400 mt-1">Response within 24 hours</div>
          </div>
        </a>
        <div className="flex items-start gap-4 surface-card p-6">
          <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-stone-600" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-stone-900 mb-1">Operating Hours</div>
            <div className="text-sm text-stone-500">Daily · 7:00 AM – 10:00 PM</div>
          </div>
        </div>
        <div className="flex items-start gap-4 surface-card p-6">
          <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={20} className="text-stone-600" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-stone-900 mb-1">Delivery Coverage</div>
            <div className="text-sm text-stone-500">All UAE Emirates</div>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-xl mx-auto">
        <ContactForm />
      </div>
    </div>
  )
}
