'use client'
import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, X, Store, Truck, Ticket, CheckCircle2, Receipt } from 'lucide-react'
import SubNav, { SETTINGS_SUBNAV } from '@/components/dashboard/SubNav'

// Settings sections become tabs so admins aren't scrolling through a
// 200-line single page. Tab state is local-only — switching tabs doesn't
// touch the data, only what's visible.
type Tab = 'store' | 'delivery' | 'invoice' | 'promos'
const TABS: Array<{ key: Tab; label: string; icon: typeof Store }> = [
  { key: 'store', label: 'Store', icon: Store },
  { key: 'delivery', label: 'Delivery & pricing', icon: Truck },
  { key: 'invoice', label: 'Tax invoice', icon: Receipt },
  { key: 'promos', label: 'Promo codes', icon: Ticket },
]

interface PromoCode {
  id?: number
  code: string
  discount_percent: number
  is_active: boolean
  expires_at: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPromo, setNewPromo] = useState({ code: '', discount_percent: 10, expires_at: '' })
  const [tab, setTab] = useState<Tab>('store')

  useEffect(() => {
    fetch('/api/dashboard/settings').then(r => r.json()).then(data => {
      if (data.settings) setSettings(data.settings)
      else setSettings(data) // fallback if no wrapper
      if (data.promoCodes) setPromoCodes(data.promoCodes)
      setLoading(false)
    })
  }, [])

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/dashboard/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, promoCodes }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addPromo() {
    if (!newPromo.code) return
    setPromoCodes(prev => [...prev, { ...newPromo, is_active: true, expires_at: newPromo.expires_at || null }])
    setNewPromo({ code: '', discount_percent: 10, expires_at: '' })
  }

  function removePromo(idx: number) {
    setPromoCodes(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="p-6 text-gray-500">Loading settings...</div>

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-3xl">
      <SubNav items={SETTINGS_SUBNAV} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-gray-500 text-sm">Store configuration</p>
        </div>
        <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
          {saved ? <CheckCircle2 size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-800 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-green-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              <t.icon size={14} aria-hidden="true" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Store Info */}
      {tab === 'store' && (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black inline-flex items-center gap-2"><Store size={16} className="text-gray-400" aria-hidden="true" /> Store Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingInput label="Store Name" value={settings.store_name || ''} onChange={v => setSettings({...settings, store_name: v})} />
          <SettingInput label="WhatsApp Number" value={settings.whatsapp_number || ''} onChange={v => setSettings({...settings, whatsapp_number: v})} />
        </div>
      </div>
      )}

      {/* Delivery & Pricing */}
      {tab === 'delivery' && (<>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black inline-flex items-center gap-2"><Truck size={16} className="text-gray-400" aria-hidden="true" /> Delivery & Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingInput label="Delivery Fee (AED)" value={settings.delivery_fee || '0'} onChange={v => setSettings({...settings, delivery_fee: v})} type="number" />
          <SettingInput label="VAT Rate (%)" value={settings.vat_rate || '5'} onChange={v => setSettings({...settings, vat_rate: v})} type="number" />
          <SettingInput label="Min Order Amount (AED)" value={settings.min_order_amount || '0'} onChange={v => setSettings({...settings, min_order_amount: v})} type="number" />
          <div className="flex items-center gap-3">
            <button onClick={() => setSettings({...settings, free_delivery: settings.free_delivery === 'true' ? 'false' : 'true'})} className={`w-10 h-6 rounded-full transition-colors flex items-center ${settings.free_delivery === 'true' ? 'bg-green-600 justify-end' : 'bg-gray-700 justify-start'}`}>
              <div className="w-4 h-4 bg-white rounded-full mx-1 shadow" />
            </button>
            <span className="text-sm text-gray-300">Free Delivery</span>
          </div>
        </div>
      </div>

      </>)}

      {/* Tax invoice settings */}
      {tab === 'invoice' && (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black inline-flex items-center gap-2"><Receipt size={16} className="text-gray-400" aria-hidden="true" /> Tax Invoice</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingInput label="VAT TRN" value={settings.vat_trn || ''} onChange={v => setSettings({...settings, vat_trn: v})} />
          <SettingInput label="Company name" value={settings.company_name || ''} onChange={v => setSettings({...settings, company_name: v})} />
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Company address</label>
            <textarea
              rows={2}
              value={settings.company_address || ''}
              onChange={e => setSettings({...settings, company_address: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Invoice footer note</label>
            <textarea
              rows={2}
              value={settings.invoice_footer_note || ''}
              onChange={e => setSettings({...settings, invoice_footer_note: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>
      )}

      {/* Promo Codes */}
      {tab === 'promos' && (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black inline-flex items-center gap-2"><Ticket size={16} className="text-gray-400" aria-hidden="true" /> Promo Codes</h3>

        {promoCodes.length > 0 && (
          <div className="space-y-2">
            {promoCodes.map((promo, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-800 rounded-xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-3 gap-y-1">
                  <span className="font-mono font-bold text-white text-sm">{promo.code}</span>
                  <span className="text-green-400 text-sm font-bold">{promo.discount_percent}% off</span>
                  <span className={`text-xs ${promo.is_active ? 'text-green-500' : 'text-red-400'}`}>
                    {promo.is_active ? '● Active' : '○ Inactive'}
                  </span>
                  {promo.expires_at && (
                    <span className="text-gray-500 text-xs">Expires: {new Date(promo.expires_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => {
                    const updated = [...promoCodes]
                    updated[i] = { ...updated[i], is_active: !updated[i].is_active }
                    setPromoCodes(updated)
                  }} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 hover:bg-gray-600">
                    {promo.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => removePromo(i)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Code</label>
            <input value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} placeholder="SUMMER25" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 font-mono" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[6rem_10rem] gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
              <input type="number" value={newPromo.discount_percent} onChange={e => setNewPromo({...newPromo, discount_percent: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Expires</label>
              <input type="date" value={newPromo.expires_at} onChange={e => setNewPromo({...newPromo, expires_at: e.target.value})} style={{ colorScheme: 'dark' }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
            </div>
          </div>
          <button onClick={addPromo} disabled={!newPromo.code} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 disabled:opacity-50 sm:self-end">
            <Plus size={16} />
          </button>
        </div>
      </div>
      )}
    </div>
  )
}

function SettingInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
    </div>
  )
}
