'use client'
import { useState } from 'react'
import { X, Truck } from 'lucide-react'

export default function LaunchBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="bg-green-700 text-white py-2.5 px-4 text-center text-sm font-semibold relative">
      <div className="flex items-center justify-center gap-2">
        <Truck size={15} />
        <span>🎉 Grand Launch Offer — <strong>FREE DELIVERY</strong> on all orders! Use code <span className="bg-white/20 px-2 py-0.5 rounded font-mono font-black">FRESH10</span> for 10% off too</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded p-1 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
