'use client'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-40 w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} className="text-gray-600" />
    </button>
  )
}
