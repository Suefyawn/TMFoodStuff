'use client'
import { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import { dashboardFetch } from '@/lib/dashboard-fetch'

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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(null)
    dashboardFetch<{
      settings?: Record<string, string>
      promoCodes?: PromoCode[]
      error?: string
    }>('/api/dashboard/settings').then(r => {
      if (r.ok === false) {
        setLoadError(r.error)
        setSettings({})
        setPromoCodes([])
        setLoading(false)
        return
      }
      const data = r.data
      if (data?.error) {
        setLoadError(String(data.error))
        setSettings({})
        setPromoCodes([])
      } else if (data?.settings) {
        setSettings(data.settings)
        setPromoCodes(Array.isArray(data.promoCodes) ? data.promoCodes : [])
      } else {
        setSettings(typeof data === 'object' && data && !Array.isArray(data) ? (data as Record<string, string>) : {})
        setPromoCodes([])
      }
      setLoading(false)
    })
  }, [])

  async function saveSettings() {
    setSaving(true)
    setSaveError(null)
    const r = await dashboardFetch<{ ok?: boolean; error?: string }>('/api/dashboard/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, promoCodes }),
    })
    setSaving(false)
    if (r.ok === true) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(r.error)
    }
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
    <div className="p-6 space-y-6 max-w-3xl">
      {loadError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Could not load settings: {loadError}
        </div>
      )}
      {saveError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Save failed: {saveError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-gray-500 text-sm">Store configuration</p>
        </div>
        <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Store Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black">🏪 Store Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <SettingInput label="Store Name" value={settings.store_name || ''} onChange={v => setSettings({...settings, store_name: v})} />
          <SettingInput label="WhatsApp Number" value={settings.whatsapp_number || ''} onChange={v => setSettings({...settings, whatsapp_number: v})} />
        </div>
      </div>

      {/* Delivery & Pricing */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black">🚚 Delivery & Pricing</h3>
        <div className="grid grid-cols-2 gap-3">
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

      {/* Delivery Slots */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black">🕐 Delivery Slots</h3>
        <p className="text-xs text-gray-500">Comma-separated slot names</p>
        <input value={settings.delivery_slots || 'morning,afternoon,evening'} onChange={e => setSettings({...settings, delivery_slots: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
      </div>

      {/* Promo Codes */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-black">🎟️ Promo Codes</h3>

        {promoCodes.length > 0 && (
          <div className="space-y-2">
            {promoCodes.map((promo, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-white text-sm">{promo.code}</span>
                  <span className="text-green-400 text-sm font-bold">{promo.discount_percent}% off</span>
                  <span className={`text-xs ${promo.is_active ? 'text-green-500' : 'text-red-400'}`}>
                    {promo.is_active ? '● Active' : '○ Inactive'}
                  </span>
                  {promo.expires_at && (
                    <span className="text-gray-500 text-xs">Expires: {new Date(promo.expires_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
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

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Code</label>
            <input value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} placeholder="SUMMER25" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 font-mono" />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
            <input type="number" value={newPromo.discount_percent} onChange={e => setNewPromo({...newPromo, discount_percent: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
          </div>
          <div className="w-36">
            <label className="text-xs text-gray-500 mb-1 block">Expires</label>
            <input type="date" value={newPromo.expires_at} onChange={e => setNewPromo({...newPromo, expires_at: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
          </div>
          <button onClick={addPromo} disabled={!newPromo.code} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 disabled:opacity-50">
            <Plus size={16} />
          </button>
        </div>
      </div>
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
