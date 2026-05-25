// History of admin-initiated broadcasts (email + SMS announcements).
// Composer lives at /dashboard/broadcasts/new.
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mail, MessageCircle, Send, Megaphone } from 'lucide-react'
import { isAdminAuthed } from '@/lib/admin-auth'
import PageHeader from '@/components/dashboard/PageHeader'

export const dynamic = 'force-dynamic'

interface BroadcastRow {
  id: number
  channel: 'email' | 'sms' | 'both'
  audience: 'all' | 'recent_60d' | 'lapsed_60d'
  subject: string | null
  body: string
  total_targeted: number
  email_sent: number
  email_failed: number
  sms_sent: number
  sms_failed: number
  created_at: string
  created_by: string | null
}

const AUDIENCE_LABEL: Record<string, string> = {
  all: 'Everyone',
  recent_60d: 'Recent (60d)',
  lapsed_60d: 'Lapsed (60d+)',
}

export default async function BroadcastsPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('broadcasts')
    .select('id, channel, audience, subject, body, total_targeted, email_sent, email_failed, sms_sent, sms_failed, created_at, created_by')
    .order('created_at', { ascending: false })
    .limit(100)
  const rows = (data || []) as BroadcastRow[]

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <PageHeader
        icon={Megaphone}
        iconTone="amber"
        title="Broadcasts"
        subtitle="Announcements to customers via email and/or SMS"
        actions={
          <Link
            href="/dashboard/broadcasts/new"
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl"
          >
            <Send size={14} aria-hidden="true" /> New broadcast
          </Link>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-gray-600 text-sm">No broadcasts sent yet.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {rows.map(b => (
              <li key={b.id} className="px-5 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {(b.channel === 'email' || b.channel === 'both') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-900/40 border border-blue-800 rounded px-1.5 py-0.5">
                          <Mail size={9} aria-hidden="true" /> Email
                        </span>
                      )}
                      {(b.channel === 'sms' || b.channel === 'both') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/40 border border-rose-800 rounded px-1.5 py-0.5">
                          <MessageCircle size={9} aria-hidden="true" /> SMS
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">{AUDIENCE_LABEL[b.audience]}</span>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className="text-[10px] text-gray-500">{new Date(b.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {b.subject && <p className="text-white font-bold text-sm truncate">{b.subject}</p>}
                    <p className="text-xs text-gray-400 line-clamp-2 whitespace-pre-line">{b.body}</p>
                    {b.created_by && <p className="text-[10px] text-gray-600 mt-1 font-mono">{b.created_by}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white tabular-nums">{b.total_targeted}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">recipients</p>
                    <div className="mt-1 space-y-0.5 text-[10px]">
                      {(b.email_sent + b.email_failed) > 0 && (
                        <p className="text-gray-400">
                          <span className="text-green-400">{b.email_sent}</span>
                          {b.email_failed > 0 && <span className="text-red-400"> / {b.email_failed} failed</span>}
                          {' '}email
                        </p>
                      )}
                      {(b.sms_sent + b.sms_failed) > 0 && (
                        <p className="text-gray-400">
                          <span className="text-green-400">{b.sms_sent}</span>
                          {b.sms_failed > 0 && <span className="text-red-400"> / {b.sms_failed} failed</span>}
                          {' '}SMS
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
