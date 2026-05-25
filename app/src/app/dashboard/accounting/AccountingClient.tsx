'use client'
import { useState } from 'react'
import { Download, FileSpreadsheet, Receipt, RotateCcw, Calculator } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'

function todayIsoDubai(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())
}

function firstOfMonthDubai(): string {
  const d = new Date()
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date(d.getFullYear(), d.getMonth(), 1))
}

export default function AccountingClient() {
  const [from, setFrom] = useState(firstOfMonthDubai())
  const [to, setTo] = useState(todayIsoDubai())

  function downloadUrl(type: 'orders' | 'refunds' | 'vat'): string {
    return `/api/dashboard/accounting/export?type=${type}&from=${from}&to=${to}`
  }

  // Quick-set buttons cover the most common reporting windows.
  function setPreset(preset: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'ytd') {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const fmt = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(d)
    if (preset === 'thisMonth') {
      setFrom(fmt(new Date(y, m, 1)))
      setTo(fmt(new Date()))
    } else if (preset === 'lastMonth') {
      setFrom(fmt(new Date(y, m - 1, 1)))
      setTo(fmt(new Date(y, m, 0)))
    } else if (preset === 'thisQuarter') {
      const qStart = Math.floor(m / 3) * 3
      setFrom(fmt(new Date(y, qStart, 1)))
      setTo(fmt(new Date()))
    } else if (preset === 'lastQuarter') {
      const qStart = Math.floor(m / 3) * 3 - 3
      const qEnd = qStart + 3
      setFrom(fmt(new Date(y, qStart, 1)))
      setTo(fmt(new Date(y, qEnd, 0)))
    } else if (preset === 'ytd') {
      setFrom(fmt(new Date(y, 0, 1)))
      setTo(fmt(new Date()))
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      <PageHeader
        icon={FileSpreadsheet}
        iconTone="indigo"
        title="Accounting exports"
        subtitle="CSV reports for the accountant. UAE timezone."
      />

      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Period</p>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label htmlFor="from" className="block text-[10px] text-gray-400 mb-1">From</label>
              <input
                id="from"
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="to" className="block text-[10px] text-gray-400 mb-1">To</label>
              <input
                id="to"
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <span className="text-[10px] text-gray-600 self-center">inclusive · Asia/Dubai</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {([['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['thisQuarter', 'This quarter'], ['lastQuarter', 'Last quarter'], ['ytd', 'YTD']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPreset(k)}
                className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md px-2 py-1"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ExportCard
          icon={Receipt}
          color="green"
          title="Orders"
          description="One row per non-cancelled order. Includes customer, address, totals, payment, promo."
          href={downloadUrl('orders')}
        />
        <ExportCard
          icon={RotateCcw}
          color="red"
          title="Refunds"
          description="Every refund event in the period with reason, amount, Stripe id, restock flag, actor."
          href={downloadUrl('refunds')}
        />
        <ExportCard
          icon={Calculator}
          color="amber"
          title="VAT summary"
          description="Per-emirate subtotal + VAT aggregate for the period. Filing-ready."
          href={downloadUrl('vat')}
        />
      </div>
    </div>
  )
}

interface ExportCardProps {
  icon: typeof Receipt
  color: 'green' | 'red' | 'amber'
  title: string
  description: string
  href: string
}

function ExportCard({ icon: Icon, color, title, description, href }: ExportCardProps) {
  const colorMap = {
    green: { bg: 'bg-green-900/40', text: 'text-green-300', border: 'hover:border-green-600/40' },
    red: { bg: 'bg-red-900/40', text: 'text-red-300', border: 'hover:border-red-600/40' },
    amber: { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'hover:border-amber-600/40' },
  }
  const c = colorMap[color]
  return (
    <a
      href={href}
      download
      className={`block bg-gray-900 border border-gray-800 ${c.border} rounded-2xl p-5 transition-colors group`}
    >
      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} className={c.text} aria-hidden="true" />
      </div>
      <h3 className="text-white font-black mb-1.5">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-300 group-hover:text-white">
        <Download size={11} aria-hidden="true" /> Download CSV
      </span>
    </a>
  )
}
