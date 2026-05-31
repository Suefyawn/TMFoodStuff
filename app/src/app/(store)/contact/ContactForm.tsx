'use client'
import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { useLang } from '@/lib/use-lang'

export default function ContactForm() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.')
      return
    }
    if (form.message.trim().length < 2) {
      setError(isAr ? 'يرجى كتابة رسالتك.' : 'Please enter a message.')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || (isAr ? 'تعذّر الإرسال.' : 'Could not send.')); setStatus('idle'); return }
      setStatus('sent')
    } catch {
      setError(isAr ? 'خطأ في الشبكة. حاول مرة أخرى.' : 'Network error. Please try again.')
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div className="surface-card p-8 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-forest/10 flex items-center justify-center">
          <CheckCircle size={28} className="text-forest" />
        </div>
        <h3 className="font-playfair text-xl font-bold text-stone-900 mb-1">{isAr ? 'تم إرسال رسالتك' : 'Message sent'}</h3>
        <p className="text-sm text-stone-500">{isAr ? 'شكراً لتواصلك — سيرد عليك فريقنا قريباً.' : "Thanks for reaching out — our team will get back to you soon."}</p>
      </div>
    )
  }

  const field = `w-full bg-white border border-sand rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-forest transition-colors`
  return (
    <form onSubmit={submit} className="surface-card p-6 space-y-3" dir={isAr ? 'rtl' : 'ltr'}>
      <h3 className="font-playfair text-lg font-bold text-stone-900">{isAr ? 'أرسل لنا رسالة' : 'Send us a message'}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={field} placeholder={isAr ? 'الاسم' : 'Name'} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoComplete="name" />
        <input className={field} type="email" required placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoComplete="email" />
      </div>
      <input className={field} placeholder={isAr ? 'الموضوع (اختياري)' : 'Subject (optional)'} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
      <textarea className={`${field} min-h-[120px] resize-y`} required placeholder={isAr ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
      >
        {status === 'sending' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {isAr ? 'إرسال' : 'Send message'}
      </button>
    </form>
  )
}
