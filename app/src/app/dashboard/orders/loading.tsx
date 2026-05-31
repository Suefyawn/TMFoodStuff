// Dashboard orders skeleton. Renders while the server component fetches the
// orders list — without this, the admin sees a blank screen on slow networks.
export default function OrdersLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-7 w-32 bg-gray-800 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-800 rounded-xl" />
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <div className="h-9 w-64 bg-gray-800 rounded-xl" />
        <div className="h-9 w-32 bg-gray-800 rounded-xl" />
        <div className="h-9 w-56 bg-gray-800 rounded-xl" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-gray-800 last:border-0 p-4 sm:p-5 flex items-center gap-4">
            <div className="h-4 w-24 bg-gray-800 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-36 bg-gray-800 rounded" />
              <div className="h-3 w-24 bg-gray-800 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-800 rounded-full" />
            <div className="h-4 w-16 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
