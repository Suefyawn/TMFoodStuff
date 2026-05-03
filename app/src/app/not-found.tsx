import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6">🥦</div>
      <h1 className="text-4xl font-black text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-500 text-lg mb-8 max-w-sm">
        Looks like this page went out of stock. Let&apos;s get you back to the fresh stuff.
      </p>
      <Link
        href="/"
        className="bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-colors text-base"
      >
        Back to Home
      </Link>
    </div>
  )
}
