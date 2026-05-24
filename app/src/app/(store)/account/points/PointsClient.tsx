'use client'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Gift, ShoppingBag, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

interface LedgerRow {
  id: number
  delta: number
  reason: string
  description: string | null
  order_id: number | null
  expires_at: string | null
  created_at: string
}

interface PointsClientProps {
  balance: number
  history: LedgerRow[]
  rules: {
    earnPerAed: number
    redeemPointsPerAed: number
    minRedeem: number
    aedAtMinRedeem: number
  }
}

function reasonLabel(reason: string, isAr: boolean): string {
  const en: Record<string, string> = {
    order_earned: 'Earned from order',
    order_redeemed: 'Redeemed on order',
    order_refunded_earn_reversal: 'Earn reversal — refund',
    order_refunded_redeem_restore: 'Points returned — refund',
    signup_bonus: 'Sign-up bonus',
    admin_adjust: 'Adjustment',
    expired: 'Expired',
  }
  const ar: Record<string, string> = {
    order_earned: 'مكسب من طلب',
    order_redeemed: 'استبدلت في طلب',
    order_refunded_earn_reversal: 'إلغاء المكسب — استرداد',
    order_refunded_redeem_restore: 'استعادة النقاط — استرداد',
    signup_bonus: 'مكافأة تسجيل',
    admin_adjust: 'تعديل إداري',
    expired: 'منتهية الصلاحية',
  }
  return (isAr ? ar : en)[reason] ?? reason
}

export default function PointsClient({ balance, history, rules }: PointsClientProps) {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-700 mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>

      {/* Balance hero */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl p-7 md:p-9 shadow-lg mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-100 mb-1">{isAr ? 'رصيد النقاط' : 'Points balance'}</p>
            <p className="text-5xl md:text-6xl font-black flex items-baseline gap-2">
              {balance.toLocaleString()}
              <span className="text-base font-bold text-green-100">{isAr ? 'نقطة' : 'pts'}</span>
            </p>
            <p className="text-sm text-green-100 mt-2">
              {balance >= rules.minRedeem
                ? (isAr
                    ? `يمكنك استبدالها بحتى AED ${Math.floor(balance / rules.redeemPointsPerAed)} في الخطوة التالية`
                    : `Redeem up to AED ${Math.floor(balance / rules.redeemPointsPerAed)} on your next order`)
                : (isAr
                    ? `${rules.minRedeem - balance} نقطة لبدء الاستبدال`
                    : `${rules.minRedeem - balance} more points to start redeeming`)}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles size={26} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="font-black text-gray-900 mb-4 inline-flex items-center gap-2">
          <Gift size={16} className="text-gray-400" aria-hidden="true" />
          {isAr ? 'كيف يعمل' : 'How it works'}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <li className="bg-gray-50 rounded-2xl p-4">
            <p className="font-black text-gray-900 text-base mb-1">{rules.earnPerAed} {isAr ? 'نقطة' : 'pt'}</p>
            <p className="text-gray-500">{isAr ? 'لكل درهم على المجموع الفرعي' : 'for every AED you spend on subtotal'}</p>
          </li>
          <li className="bg-gray-50 rounded-2xl p-4">
            <p className="font-black text-gray-900 text-base mb-1">{rules.minRedeem} {isAr ? 'نقطة' : 'pts'}</p>
            <p className="text-gray-500">
              {isAr ? `الحد الأدنى للاستبدال (AED ${rules.aedAtMinRedeem})` : `minimum to redeem (AED ${rules.aedAtMinRedeem})`}
            </p>
          </li>
          <li className="bg-gray-50 rounded-2xl p-4">
            <p className="font-black text-gray-900 text-base mb-1">12 {isAr ? 'شهر' : 'mo'}</p>
            <p className="text-gray-500">{isAr ? 'تنتهي صلاحية النقاط بعدها' : 'before earned points expire'}</p>
          </li>
        </ul>
      </div>

      {/* History */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="font-black text-gray-900 mb-4 inline-flex items-center gap-2">
          <Clock size={16} className="text-gray-400" aria-hidden="true" />
          {isAr ? 'السجل' : 'History'}
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={20} className="text-gray-300" aria-hidden="true" />
            </div>
            <p className="text-sm text-gray-500 mb-4">{isAr ? 'لا توجد سجلات بعد. اطلب أول طلب لتكسب نقاط!' : 'No history yet. Place an order to start earning.'}</p>
            <Link href="/shop" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
              {isAr ? 'تصفّح المنتجات' : 'Browse products'}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map(r => {
              const isPositive = r.delta > 0
              const expired = !!(r.expires_at && r.expires_at <= new Date().toISOString())
              return (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isPositive ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {isPositive ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowDownRight size={16} aria-hidden="true" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{reasonLabel(r.reason, isAr)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {r.description || ''}
                      {r.description ? ' · ' : ''}
                      {new Date(r.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${expired ? 'line-through text-gray-400' : isPositive ? 'text-green-700' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{r.delta}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
