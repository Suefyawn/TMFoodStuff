import Link from 'next/link'
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'

export const metadata = {
  title: 'Unsubscribed',
  robots: { index: false, follow: false },
}

interface Params { searchParams: Promise<{ status?: string; email?: string }> }

export default async function UnsubscribePage({ searchParams }: Params) {
  const { status, email } = await searchParams
  const ok = status === 'ok'
  const invalid = status === 'invalid'

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${ok ? 'bg-green-100' : invalid ? 'bg-amber-100' : 'bg-gray-100'}`}>
        {ok
          ? <CheckCircle size={32} className="text-forest" aria-hidden="true" />
          : invalid
            ? <AlertCircle size={32} className="text-amber-600" aria-hidden="true" />
            : <Mail size={32} className="text-gray-400" aria-hidden="true" />}
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">
        {ok ? "You're unsubscribed" : invalid ? 'Invalid request' : 'Email preferences'}
      </h1>
      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
        {ok
          ? <>We won&apos;t send marketing emails to <strong className="text-gray-700">{email}</strong> anymore. You&apos;ll still receive transactional emails about orders you place.</>
          : invalid
            ? 'The unsubscribe link looks malformed. Reply to any of our emails and we\'ll remove you manually.'
            : 'To unsubscribe, click the "Unsubscribe" link in any TM FoodStuff marketing email.'}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
      >
        Back to shop
      </Link>
    </div>
  )
}
