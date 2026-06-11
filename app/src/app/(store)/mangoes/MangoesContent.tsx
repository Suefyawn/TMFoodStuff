'use client'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/products-api'
import {
  Sparkles, ChevronRight, Sun, Droplets, BadgeCheck, Truck,
  MessageCircle, Leaf, Clock, MapPin,
} from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface MangoesContentProps {
  mangoes: Product[]
}

const WHATSAPP_NUMBER = '971544408411'

export default function MangoesContent({ mangoes }: MangoesContentProps) {
  const { lang } = useLang()

  const waText = encodeURIComponent(
    lang === 'ar'
      ? 'مرحباً! أود طلب مانجو طازجة 🥭'
      : 'Hi! I would like to order fresh mangoes 🥭'
  )
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  const perks = [
    {
      icon: Sun,
      title: lang === 'ar' ? 'ناضجة تحت الشمس' : 'Sun-Ripened',
      desc: lang === 'ar' ? 'تُقطف في ذروة النضج والحلاوة' : 'Picked at peak sweetness, never force-ripened',
    },
    {
      icon: BadgeCheck,
      title: lang === 'ar' ? 'مفحوصة يدويًا' : 'Hand-Checked',
      desc: lang === 'ar' ? 'كل صندوق يُفحص قبل التغليف' : 'Every box is quality-checked before packing',
    },
    {
      icon: Truck,
      title: lang === 'ar' ? 'توصيل في نفس اليوم' : 'Same-Day Delivery',
      desc: lang === 'ar' ? 'في جميع أنحاء الإمارات' : 'Across Dubai, Abu Dhabi & all emirates',
    },
    {
      icon: Leaf,
      title: lang === 'ar' ? 'من المزرعة مباشرة' : 'Farm Direct',
      desc: lang === 'ar' ? 'بدون وسطاء، نضارة أعلى' : 'No middlemen — fresher fruit, fairer prices',
    },
  ]

  const varieties = [
    {
      name: lang === 'ar' ? 'مانجو باكستاني (تشاونسا)' : 'Pakistani (Chaunsa)',
      flavour: lang === 'ar'
        ? 'حلاوة عالية مع عطر غني — الكلاسيكية المفضلة في الموسم.'
        : 'Honey-sweet with a rich aroma — the classic season favourite.',
      best: lang === 'ar' ? 'للأكل الطازج والعصائر' : 'Eating fresh & juices',
    },
    {
      name: lang === 'ar' ? 'تيمور' : 'Taimoor',
      flavour: lang === 'ar'
        ? 'نكهة مكثفة وقوام كريمي خالٍ من الألياف.'
        : 'Intensely flavoured with a creamy, fibre-free bite.',
      best: lang === 'ar' ? 'للتقديم والضيافة' : 'Fruit platters & desserts',
    },
    {
      name: lang === 'ar' ? 'ألفونسو' : 'Alphonso',
      flavour: lang === 'ar'
        ? '«ملك المانجو» — لب زعفراني كريمي وحلاوة فاخرة.'
        : 'The “king of mangoes” — saffron flesh, luxuriously sweet.',
      best: lang === 'ar' ? 'للمناسبات الخاصة' : 'Special occasions & gifting',
    },
    {
      name: lang === 'ar' ? 'تومي' : 'Tomy',
      flavour: lang === 'ar'
        ? 'كبيرة وعصيرية بسعر يومي مناسب للعائلة.'
        : 'Big, juicy and family-friendly at an everyday price.',
      best: lang === 'ar' ? 'للاستهلاك اليومي' : 'Everyday family fruit',
    },
  ]

  const tips = [
    {
      icon: Clock,
      title: lang === 'ar' ? 'لم تنضج بعد؟' : 'Not ripe yet?',
      desc: lang === 'ar'
        ? 'اتركها في وعاء على المنضدة من يوم إلى ثلاثة أيام حتى تلين قليلًا.'
        : 'Leave them on the counter for 1–3 days until they yield slightly to a gentle squeeze.',
    },
    {
      icon: Droplets,
      title: lang === 'ar' ? 'ناضجة تمامًا؟' : 'Perfectly ripe?',
      desc: lang === 'ar'
        ? 'ضعها في الثلاجة لإبطاء النضج والاستمتاع بها باردة حتى ٥ أيام.'
        : 'Refrigerate to pause ripening and enjoy them chilled for up to 5 days.',
    },
    {
      icon: Sparkles,
      title: lang === 'ar' ? 'نصيحة المحترفين' : 'Pro tip',
      desc: lang === 'ar'
        ? 'الرائحة العطرة عند الساق هي أفضل دليل على النضج — وليس اللون.'
        : 'A sweet aroma at the stem is the best ripeness signal — not the skin colour.',
    },
  ]

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-100 via-orange-50 to-white">
        <Image
          src="/mango-cutout.png"
          alt=""
          aria-hidden="true"
          width={300}
          height={255}
          className="hidden lg:block absolute -top-8 -left-12 w-72 h-auto opacity-80 -rotate-12 pointer-events-none select-none drop-shadow-xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-700 border border-amber-500/20 text-xs md:text-sm font-black px-4 py-2 rounded-full mb-5 uppercase tracking-wide">
                <Sparkles size={13} />
                {lang === 'ar' ? 'موسم محدود · متوفر الآن' : 'Limited Season · In Stock Now'}
              </div>
              <h1 className="font-playfair text-5xl md:text-6xl font-black text-stone-900 mb-5 leading-[1.02]">
                {lang === 'ar' ? (
                  <>موسم <span className="text-amber-500">المانجو</span> وصل</>
                ) : (
                  <>Mango Season <span className="text-amber-500">is Here</span></>
                )}
              </h1>
              <p className="text-stone-600 text-base md:text-xl mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {lang === 'ar'
                  ? 'مانجو باكستانية وهندية حلوة وعصيرية — تُقطف طازجة، تُفحص يدويًا، وتصل إلى بابك في نفس اليوم في جميع أنحاء الإمارات.'
                  : 'Sweet, juicy Pakistani and Indian mangoes — picked fresh, hand-checked, and delivered same-day across the UAE.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="#shop-mangoes"
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-4 rounded-2xl text-base md:text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {lang === 'ar' ? 'تسوق المانجو' : 'Shop Mangoes'}
                  <ChevronRight size={20} />
                </a>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-forest/30 text-forest-dark font-bold px-8 py-4 rounded-2xl text-base md:text-lg hover:bg-forest/5 transition-all"
                >
                  <MessageCircle size={19} />
                  {lang === 'ar' ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}
                </a>
              </div>
              <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-sm text-stone-500">
                <MapPin size={14} className="text-forest flex-shrink-0" />
                {lang === 'ar'
                  ? 'نوصل إلى دبي، أبوظبي، الشارقة وجميع الإمارات'
                  : 'Delivering to Dubai, Abu Dhabi, Sharjah & all emirates'}
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-amber-900/10">
                <Image
                  src="/mango-hero.jpg"
                  alt={lang === 'ar' ? 'مانجو باكستانية طازجة في صندوق' : 'Fresh Pakistani mangoes in a box'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  <Sparkles size={12} />
                  {lang === 'ar' ? 'إنتاج باكستان · في الموسم' : 'Produce of Pakistan · In Season'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks strip */}
      <section className="bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {perks.map(p => (
            <div key={p.title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <p.icon size={19} />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-sm">{p.title}</div>
                <div className="text-xs text-stone-500 mt-0.5 leading-snug">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section id="shop-mangoes" className="bg-stone-50 py-12 md:py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 md:mb-8">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-stone-900 mb-1">
              {lang === 'ar' ? 'تشكيلة الموسم' : 'This Season’s Lineup'}
            </h2>
            <p className="text-stone-500 text-sm md:text-base">
              {lang === 'ar' ? 'كل الأصناف طازجة ومتوفرة اليوم' : 'Every variety fresh and available today'}
            </p>
          </div>
          {mangoes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {mangoes.map(product => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <p className="text-stone-500 py-8 text-center">
              {lang === 'ar'
                ? 'انتهى الموسم مؤقتًا — عُد قريبًا!'
                : 'The season has just wrapped up — check back soon!'}
            </p>
          )}
        </div>
      </section>

      {/* Varieties guide */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-stone-900 mb-1">
          {lang === 'ar' ? 'اعرف أصنافك' : 'Know Your Mangoes'}
        </h2>
        <p className="text-stone-500 text-sm md:text-base mb-6 md:mb-8">
          {lang === 'ar' ? 'دليل سريع لاختيار الصنف المناسب لك' : 'A quick guide to picking the right variety'}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {varieties.map(v => (
            <div key={v.name} className="surface-card p-5 md:p-6">
              <div className="text-2xl mb-3" aria-hidden="true">🥭</div>
              <h3 className="font-bold text-stone-900 mb-2">{v.name}</h3>
              <p className="text-sm text-stone-500 leading-relaxed mb-3">{v.flavour}</p>
              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <BadgeCheck size={11} />
                {v.best}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ripening tips */}
      <section className="bg-forest-dark text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-1 text-center">
            {lang === 'ar' ? 'كيف تستمتع بها في أفضل حالاتها' : 'Enjoy Them at Their Best'}
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-8 md:mb-10 text-center">
            {lang === 'ar' ? 'نصائح بسيطة من فريقنا' : 'Simple tips from our team'}
          </p>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {tips.map(t => (
              <div key={t.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-11 h-11 bg-amber-400/15 text-amber-300 rounded-2xl flex items-center justify-center mb-4">
                  <t.icon size={21} />
                </div>
                <h3 className="font-black mb-2">{t.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 py-14 md:py-20 text-center">
        <div className="text-4xl mb-4" aria-hidden="true">🥭</div>
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-stone-900 mb-3">
          {lang === 'ar' ? 'الموسم قصير — لا تفوّته' : 'The Season is Short — Don’t Miss It'}
        </h2>
        <p className="text-stone-500 mb-8 md:text-lg">
          {lang === 'ar'
            ? 'اطلب اليوم واستلم مانجو طازجة على بابك في نفس اليوم.'
            : 'Order today and get fresh mangoes at your door — same day.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#shop-mangoes"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-4 rounded-2xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            {lang === 'ar' ? 'تسوق المانجو الآن' : 'Shop Mangoes Now'}
            <ChevronRight size={18} />
          </a>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 border-2 border-stone-200 text-stone-700 font-bold px-8 py-4 rounded-2xl text-base hover:bg-stone-50 transition-all"
          >
            {lang === 'ar' ? 'تصفح كل المنتجات' : 'Browse All Products'}
          </Link>
        </div>
      </section>
    </main>
  )
}
