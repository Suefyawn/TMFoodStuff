'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, MessageCircle, Gift, Users, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface ReferralRow {
  id: number
  status: string
  reward_points: number
  created_at: string
  rewarded_at: string | null
  referred: { full_name: string | null; email: string } | null
}

interface Props {
  code: string
  shareUrl: string
  referrals: ReferralRow[]
  rewardedCount: number
  pendingCount: number
  totalEarned: number
}

export default function ReferralsClient({ code, shareUrl, referrals, rewardedCount, pendingCount, totalEarned }: Props) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  async function copy(value: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // Older browsers fall back silently — the input remains selectable.
    }
  }

  const shareText = isAr
    ? `جرّب TM FoodStuff للحصول على فواكه وخضروات طازجة! استخدم رابطي للحصول على 50 نقطة عند طلبك الأول: ${shareUrl}`
    : `I'm loving TM FoodStuff — fresh fruits & veg delivered across the UAE. Use my link to get 50 points (~AED 2.50) off your first order: ${shareUrl}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-forest-dark mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>

      <header className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-green-100 text-forest-dark flex items-center justify-center">
            <Gift size={22} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-playfair font-bold text-stone-900 leading-tight">
              {isAr ? 'ادعُ صديقاً، اكسبا معاً' : 'Refer a friend, you both win'}
            </h1>
            <p className="text-sm text-stone-500">
              {isAr ? '50 نقطة لك و50 لصديقك على طلبهم الأول.' : '50 points for you and 50 for your friend on their first order.'}
            </p>
          </div>
        </div>
      </header>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Stat label={isAr ? 'أصدقاء انضموا' : 'Friends joined'} value={String(rewardedCount)} accent="text-forest-dark" />
        <Stat label={isAr ? 'بانتظار التوصيل' : 'Pending delivery'} value={String(pendingCount)} accent="text-amber-700" />
        <Stat label={isAr ? 'نقاط مكتسبة' : 'Points earned'} value={String(totalEarned)} accent="text-forest-dark" />
      </div>

      {/* Share card */}
      <div className="bg-white border border-stone-100 rounded-3xl shadow-sm p-6 md:p-7 mb-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2">
          {isAr ? 'رمزك' : 'Your code'}
        </p>
        <div className="flex items-center justify-between gap-3 mb-5 bg-green-50 border-2 border-dashed border-green-300 rounded-2xl px-4 py-3">
          <span className="font-mono font-black text-2xl md:text-3xl tracking-widest text-forest-dark">{code}</span>
          <button
            type="button"
            onClick={() => copy(code, 'code')}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {copied === 'code'
              ? <><Check size={12} aria-hidden="true" /> {isAr ? 'تم' : 'Copied'}</>
              : <><Copy size={12} aria-hidden="true" /> {isAr ? 'انسخ' : 'Copy'}</>}
          </button>
        </div>

        <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2">
          {isAr ? 'رابط المشاركة' : 'Share link'}
        </p>
        <div className="flex items-center justify-between gap-2 mb-5 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2.5">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={e => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-transparent text-sm font-mono text-stone-700 outline-none"
          />
          <button
            type="button"
            onClick={() => copy(shareUrl, 'link')}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0"
          >
            {copied === 'link'
              ? <><Check size={12} aria-hidden="true" /> {isAr ? 'تم' : 'Copied'}</>
              : <><Copy size={12} aria-hidden="true" /> {isAr ? 'انسخ' : 'Copy'}</>}
          </button>
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-2xl transition-colors"
        >
          <MessageCircle size={16} aria-hidden="true" />
          {isAr ? 'شارك عبر واتساب' : 'Share on WhatsApp'}
        </a>
      </div>

      {/* How it works */}
      <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5 mb-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-3">
          {isAr ? 'كيف يعمل' : 'How it works'}
        </p>
        <ol className="space-y-2 text-sm text-stone-700">
          <Step n={1} text={isAr ? 'شارك رمزك أو الرابط مع صديق.' : 'Share your code or link with a friend.'} />
          <Step n={2} text={isAr ? 'يطلب صديقك أول طلب على TM FoodStuff.' : 'Your friend places their first order on TM FoodStuff.'} />
          <Step n={3} text={isAr ? 'عند تسليم طلبهم، نضيف 50 نقطة لكليكما (تعادل تقريباً 2.5 درهم لكل واحد).' : 'When their order is delivered, we credit 50 points to each of you (~AED 2.50 each).'} />
        </ol>
      </div>

      {/* Referrals list */}
      <section>
        <h2 className="font-playfair font-bold text-stone-900 text-lg mb-3 flex items-center gap-2">
          <Users size={16} className="text-stone-400" aria-hidden="true" />
          {isAr ? 'إحالاتك' : 'Your referrals'}
          <span className="text-xs font-bold text-stone-400">({referrals.length})</span>
        </h2>
        {referrals.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl p-7 text-center">
            <Sparkles size={24} className="mx-auto mb-2 text-stone-300" aria-hidden="true" />
            <p className="text-sm text-stone-500">
              {isAr ? 'لا توجد إحالات بعد. شارك رمزك للبدء!' : "No referrals yet. Share your code to get started!"}
            </p>
          </div>
        ) : (
          <ul className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-100">
            {referrals.map(r => (
              <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {r.referred?.full_name || maskEmail(r.referred?.email)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(r.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {r.status === 'rewarded' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-forest-dark bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                    <Check size={11} aria-hidden="true" /> +{r.reward_points} {isAr ? 'نقطة' : 'pts'}
                  </span>
                ) : r.status === 'pending' ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                    {isAr ? 'بانتظار التوصيل' : 'Pending delivery'}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-stone-500 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg">
                    {isAr ? 'ملغى' : 'Cancelled'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-3 sm:p-4 text-center">
      <p className={`text-2xl sm:text-3xl font-black ${accent} tabular-nums leading-none`}>{value}</p>
      <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="shrink-0 w-5 h-5 rounded-full bg-forest text-white text-[10px] font-black flex items-center justify-center mt-0.5">{n}</span>
      <span className="leading-relaxed">{text}</span>
    </li>
  )
}

// Email anonymisation for the list — show first 2 chars + domain so the
// referrer recognises who it is without leaking the full address. Falls
// back gracefully when only an email is on file (no full_name yet).
function maskEmail(email?: string | null): string {
  if (!email) return '—'
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}
