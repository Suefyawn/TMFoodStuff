'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, MapPin, Star, ArrowLeft } from 'lucide-react'
import { useLang } from '@/lib/use-lang'
import { useConfirm } from '@/components/ConfirmDialog'

interface Address {
  id: number
  label: string | null
  building: string | null
  street: string | null
  area: string | null
  emirate: string | null
  makani: string | null
  is_default: boolean
}

const EMIRATES_EN = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']
const EMIRATES_AR = ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين']

const emptyAddress: Omit<Address, 'id'> = {
  label: '', building: '', street: '', area: '', emirate: '', makani: '', is_default: false,
}

export default function AddressesClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<Omit<Address, 'id'>>(emptyAddress)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirm = useConfirm()

  const emirates = isAr ? EMIRATES_AR : EMIRATES_EN

  function startNew() {
    setForm(emptyAddress)
    setEditingId('new')
    setError('')
  }

  function startEdit(a: Address) {
    setForm({
      label: a.label || '', building: a.building || '', street: a.street || '',
      area: a.area || '', emirate: a.emirate || '', makani: a.makani || '',
      is_default: a.is_default,
    })
    setEditingId(a.id)
    setError('')
  }

  async function save() {
    if (!form.emirate || !form.area) {
      setError(isAr ? 'الإمارة والمنطقة مطلوبتان.' : 'Emirate and area are required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const isNew = editingId === 'new'
      const res = await fetch('/api/account/addresses', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? form : { ...form, id: editingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || (isAr ? 'تعذّر الحفظ.' : 'Could not save the address.'))
        return
      }
      // Re-fetch to keep is_default state in sync.
      const refresh = await fetch('/api/account/addresses')
      const refreshData = await refresh.json()
      setAddresses(refreshData.addresses || [])
      setEditingId(null)
    } catch {
      setError(isAr ? 'خطأ في الاتصال.' : 'Network error.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: isAr ? 'حذف هذا العنوان؟' : 'Delete this address?',
      message: isAr ? 'لن نستطيع استرجاعه لاحقاً.' : "We won't be able to bring it back.",
      confirmLabel: isAr ? 'حذف' : 'Delete',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setAddresses(addresses.filter(a => a.id !== id))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-forest-dark mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> {isAr ? 'العودة إلى الحساب' : 'Back to account'}
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-playfair font-bold text-stone-900">{isAr ? 'العناوين المحفوظة' : 'Saved addresses'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAr ? 'يتم استخدامها لتعبئة بيانات التوصيل تلقائياً عند الدفع.' : 'Used to auto-fill delivery details at checkout.'}
          </p>
        </div>
        {editingId === null && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-white font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} aria-hidden="true" /> {isAr ? 'إضافة عنوان' : 'Add address'}
          </button>
        )}
      </div>

      {editingId !== null && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-5">
          <h2 className="font-playfair font-bold text-stone-900 mb-4">
            {editingId === 'new' ? (isAr ? 'عنوان جديد' : 'New address') : (isAr ? 'تعديل العنوان' : 'Edit address')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{isAr ? 'تسمية (اختياري)' : 'Label (optional)'}</label>
              <input value={form.label || ''} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder={isAr ? 'المنزل، المكتب…' : 'Home, Office…'}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{isAr ? 'الإمارة' : 'Emirate'} *</label>
              <select value={form.emirate || ''} onChange={e => setForm(f => ({ ...f, emirate: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-forest-light" required>
                <option value="">{isAr ? 'اختر الإمارة' : 'Select emirate'}</option>
                {emirates.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{isAr ? 'المنطقة' : 'Area'} *</label>
              <input value={form.area || ''} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                placeholder={isAr ? 'جميرا، المرسى…' : 'JLT, Marina, Khalidiyah…'}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{isAr ? 'المبنى / الفيلا' : 'Building / Villa'}</label>
              <input value={form.building || ''} onChange={e => setForm(f => ({ ...f, building: e.target.value }))}
                placeholder={isAr ? 'اسم البرج أو رقم الفيلا' : 'Tower name or villa number'}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{isAr ? 'مكاني (اختياري)' : 'Makani (optional)'}</label>
              <input value={form.makani || ''} onChange={e => setForm(f => ({ ...f, makani: e.target.value }))}
                placeholder={isAr ? 'كود عنوان دبي' : 'Dubai address code'}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-forest-light" />
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="w-4 h-4 accent-forest" />
                {isAr ? 'استخدم كعنوان افتراضي' : 'Set as default address'}
              </label>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex items-center gap-2 mt-5">
            <button onClick={save} disabled={busy} className="bg-forest hover:bg-forest-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {busy ? (isAr ? 'جاري الحفظ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save')}
            </button>
            <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 font-semibold px-3 py-2.5 text-sm">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 && editingId === null ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MapPin size={22} className="text-gray-300" aria-hidden="true" />
          </div>
          <p className="text-gray-700 font-bold mb-1">{isAr ? 'لا توجد عناوين بعد' : 'No saved addresses yet'}</p>
          <p className="text-sm text-gray-500 mb-5">{isAr ? 'احفظ عنواناً لتوفير الوقت في كل عملية شراء.' : 'Save an address to speed up future checkouts.'}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map(a => (
            <li key={a.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-900">{a.label || (isAr ? 'العنوان' : 'Address')}</h3>
                  {a.is_default && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-forest-dark bg-green-50 px-2 py-0.5 rounded-full">
                      <Star size={10} className="fill-current" aria-hidden="true" />
                      {isAr ? 'افتراضي' : 'Default'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  {a.building ? `${a.building}, ` : ''}{a.area}, {a.emirate}
                </p>
                {a.makani && <p className="text-xs text-gray-500 mt-0.5">Makani: {a.makani}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(a)} aria-label={isAr ? 'تعديل' : 'Edit'} className="p-2 text-gray-500 hover:text-forest-dark transition-colors">
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button onClick={() => remove(a.id)} aria-label={isAr ? 'حذف' : 'Delete'} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
