'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, Bell, Download, Trash2, AlertTriangle, Loader2, CreditCard } from 'lucide-react'
import { useLang } from '@/lib/use-lang'
import { useConfirm } from '@/components/ConfirmDialog'

interface Initial { email: boolean; sms: boolean; push: boolean }

export default function PreferencesClient({ initial }: { initial: Initial }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const router = useRouter()
  const confirm = useConfirm()
  const [prefs, setPrefs] = useState(initial)
  const [savingKey, setSavingKey] = useState<keyof Initial | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openingBilling, setOpeningBilling] = useState(false)
  const [billingError, setBillingError] = useState('')

  async function openBillingPortal() {
    setOpeningBilling(true)
    setBillingError('')
    try {
      const res = await fetch('/api/account/billing-portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setBillingError(data.error || (isAr ? 'تعذّر فتح لوحة الفوترة.' : 'Could not open billing portal.'))
        return
      }
      window.location.href = data.url
    } catch {
      setBillingError(isAr ? 'خطأ في الاتصال.' : 'Network error.')
    } finally {
      setOpeningBilling(false)
    }
  }

  async function setPref(key: keyof Initial, value: boolean) {
    setSavingKey(key)
    const prev = prefs[key]
    setPrefs(p => ({ ...p, [key]: value }))
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) setPrefs(p => ({ ...p, [key]: prev }))
    } catch {
      setPrefs(p => ({ ...p, [key]: prev }))
    } finally {
      setSavingKey(null)
    }
  }

  async function deleteAccount() {
    const ok = await confirm({
      title: isAr ? 'حذف حسابك نهائياً؟' : 'Delete your account?',
      message: isAr
        ? 'سنزيل اسمك ورقم هاتفك وعناوينك ولن تتمكن من تسجيل الدخول بعد الآن. سجلات طلباتك تبقى للأغراض المحاسبية.'
        : "We'll remove your name, phone, addresses, and you won't be able to sign in again. Your past orders are kept for accounting purposes.",
      confirmLabel: isAr ? 'حذف الحساب' : 'Delete account',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      destructive: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (res.ok) {
        router.push('/?deleted=1')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-forest-dark mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>

      <header className="mb-7">
        <h1 className="text-2xl md:text-3xl font-playfair font-bold text-stone-900 leading-tight">
          {isAr ? 'التفضيلات' : 'Preferences'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAr ? 'تحكّم في الإشعارات وبياناتك الشخصية.' : 'Control how we contact you and what we hold on you.'}
        </p>
      </header>

      {/* Marketing preferences */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 md:p-6 mb-5">
        <h2 className="font-playfair font-bold text-stone-900 mb-1">{isAr ? 'تواصل التسويق' : 'Marketing communications'}</h2>
        <p className="text-xs text-gray-500 mb-4">
          {isAr
            ? 'العروض والإعلانات. ستبقى إشعارات الطلبات (التأكيد، التسليم) قيد التشغيل دائماً.'
            : "Promotions and announcements. Order updates (confirmations, delivery) always stay on."}
        </p>
        <ul className="space-y-2">
          <Toggle
            icon={Mail}
            label={isAr ? 'البريد الإلكتروني' : 'Email'}
            description={isAr ? 'العروض والأخبار' : 'Offers and announcements'}
            checked={prefs.email}
            saving={savingKey === 'email'}
            onChange={v => setPref('email', v)}
          />
          <Toggle
            icon={MessageCircle}
            label={isAr ? 'رسائل SMS' : 'SMS'}
            description={isAr ? 'تذكيرات قصيرة' : 'Short reminders'}
            checked={prefs.sms}
            saving={savingKey === 'sms'}
            onChange={v => setPref('sms', v)}
          />
          <Toggle
            icon={Bell}
            label={isAr ? 'إشعارات الجوال' : 'Push notifications'}
            description={isAr ? 'تنبيهات فورية في المتصفح' : 'In-browser pings'}
            checked={prefs.push}
            saving={savingKey === 'push'}
            onChange={v => setPref('push', v)}
          />
        </ul>
      </section>

      {/* Billing — opens Stripe Customer Portal where the customer can
          manage saved payment methods + see past charges. The endpoint
          lazy-creates the Stripe Customer the first time it's needed. */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 md:p-6 mb-5">
        <h2 className="font-playfair font-bold text-stone-900 mb-1">{isAr ? 'الفوترة وبطاقات الدفع' : 'Billing & saved cards'}</h2>
        <p className="text-xs text-gray-500 mb-4">
          {isAr
            ? 'إدارة بطاقاتك المحفوظة وعرض الفواتير السابقة في صفحة Stripe الآمنة.'
            : "Manage your saved cards and see past charges on Stripe's secure page. We never touch card data ourselves."}
        </p>
        <button
          type="button"
          onClick={openBillingPortal}
          disabled={openingBilling}
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {openingBilling ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CreditCard size={14} aria-hidden="true" />}
          {openingBilling ? (isAr ? 'جارٍ الفتح…' : 'Opening…') : (isAr ? 'إدارة طرق الدفع' : 'Manage payment methods')}
        </button>
        {billingError && (
          <p role="alert" className="mt-2 text-xs text-red-600">{billingError}</p>
        )}
      </section>

      {/* Privacy + data */}
      <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 md:p-6 mb-5">
        <h2 className="font-playfair font-bold text-stone-900 mb-1">{isAr ? 'بياناتك' : 'Your data'}</h2>
        <p className="text-xs text-gray-500 mb-4">
          {isAr
            ? 'يمكنك تنزيل نسخة من بياناتك في أي وقت.'
            : "Download a copy of everything we know about you at any time."}
        </p>
        <a
          href="/api/account/data-export"
          download
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} aria-hidden="true" />
          {isAr ? 'تنزيل بياناتي (JSON)' : 'Download my data (JSON)'}
        </a>
      </section>

      {/* Delete account */}
      <section className="bg-red-50/30 border border-red-200 rounded-3xl p-5 md:p-6">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-playfair font-bold text-stone-900 mb-1">{isAr ? 'حذف الحساب' : 'Delete account'}</h2>
            <p className="text-xs text-gray-600">
              {isAr
                ? 'يتم حذف اسمك ورقم هاتفك وعناوينك وقائمة المفضلة. تبقى سجلات الطلبات لأغراض محاسبية وضريبية كما يتطلب القانون.'
                : "Removes your name, phone, addresses, and wishlist. Order records are retained for accounting and tax purposes as required by law."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleting}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
          {deleting ? (isAr ? 'جارٍ الحذف…' : 'Deleting…') : (isAr ? 'حذف حسابي نهائياً' : 'Delete my account')}
        </button>
      </section>
    </div>
  )
}

function Toggle({
  icon: Icon, label, description, checked, saving, onChange,
}: {
  icon: typeof Mail
  label: string
  description: string
  checked: boolean
  saving: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
        <Icon size={16} className="text-gray-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={saving}
        className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
          checked ? 'bg-forest' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </li>
  )
}
