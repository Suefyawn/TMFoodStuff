'use client'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/products-api'
import { Sparkles, ChevronRight, Sun, Droplets, BadgeCheck } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface MangoSeasonProps {
  mangoes: Product[]
}

// Seasonal hero + product showcase for mango season. Rendered on the home page.
// Hidden entirely when there are no mango products so the page degrades cleanly.
export default function MangoSeason({ mangoes }: MangoSeasonProps) {
  const { lang } = useLang()
  if (!mangoes || mangoes.length === 0) return null

  const perks = [
    {
      icon: Sun,
      title: lang === 'ar' ? 'ناضجة تحت الشمس' : 'Sun-Ripened',
      desc: lang === 'ar' ? 'تُقطف في ذروة النضج' : 'Picked at peak sweetness',
    },
    {
      icon: Droplets,
      title: lang === 'ar' ? 'حلوة وعصيرية' : 'Sweet & Juicy',
      desc: lang === 'ar' ? 'نكهة استوائية غنية' : 'Rich tropical flavour',
    },
    {
      icon: BadgeCheck,
      title: lang === 'ar' ? 'مختارة يدويًا' : 'Hand-Picked',
      desc: lang === 'ar' ? 'كل صندوق مفحوص' : 'Every box quality-checked',
    },
  ]

  return (
    <section
      id="mango-season"
      className="relative overflow-hidden scroll-mt-20 py-12 md:py-20 bg-gradient-to-b from-amber-50 via-orange-50/50 to-white"
    >
      {/* Decorative floating mango — top right, desktop only */}
      <Image
        src="/mango-cutout.png"
        alt=""
        aria-hidden="true"
        width={300}
        height={255}
        className="hidden lg:block absolute -top-6 -right-10 w-64 h-auto opacity-90 rotate-12 pointer-events-none select-none drop-shadow-xl"
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-10 md:mb-14">
          {/* Image side */}
          <div className="relative order-1 lg:order-none">
            <div className="relative aspect-[16/11] rounded-3xl overflow-hidden shadow-xl ring-1 ring-amber-900/5">
              <Image
                src="/mango-hero.jpg"
                alt={lang === 'ar' ? 'مانجو باكستانية طازجة في صندوق' : 'Fresh Pakistani mangoes in a box'}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                <Sparkles size={12} />
                {lang === 'ar' ? 'إنتاج باكستان · في الموسم' : 'Produce of Pakistan · In Season'}
              </div>
            </div>
          </div>

          {/* Text side */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              <Sparkles size={11} /> {lang === 'ar' ? 'متوفر الآن في الموسم' : 'In Season Now'}
            </div>
            <h2 className="font-playfair text-4xl md:text-5xl font-black text-stone-900 mb-4 leading-tight">
              {lang === 'ar' ? (
                <>موسم المانجو <span className="text-amber-500">هنا</span></>
              ) : (
                <>Mango Season <span className="text-amber-500">is Here</span></>
              )}
            </h2>
            <p className="text-stone-600 text-base md:text-lg mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {lang === 'ar'
                ? 'من تومي إلى تيمور والألفونسو — أحلى أنواع المانجو في الموسم، تُجلب طازجة وتصل إلى بابك في جميع أنحاء الإمارات.'
                : 'From Tomy to Taimoor and Alphonso — the season’s sweetest mangoes, sourced fresh and delivered to your door across the UAE.'}
            </p>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-3 mb-8 max-w-md mx-auto lg:mx-0">
              {perks.map(p => (
                <div key={p.title} className="text-center lg:text-left">
                  <div className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-2">
                    <p.icon size={17} />
                  </div>
                  <div className="font-bold text-stone-800 text-sm leading-tight">{p.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/shop?category=fruits"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-3.5 rounded-2xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {lang === 'ar' ? 'تسوق المانجو' : 'Shop Mangoes'}
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mango product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {mangoes.slice(0, 5).map(product => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </div>
    </section>
  )
}
