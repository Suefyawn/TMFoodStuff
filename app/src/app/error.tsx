'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6">🥦</div>
      <h1 className="text-4xl font-black text-gray-900 mb-3">Something went wrong</h1>
      <p className="text-gray-500 text-lg mb-8 max-w-sm">
        We hit a snag loading this page. Please try again in a moment.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-colors text-base"
        >
          Try Again
        </button>
        {/* Full reload (not next/link) so navigation recovers from the broken state */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-gray-700 transition-colors text-base"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}
