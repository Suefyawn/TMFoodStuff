export default function StockHistoryLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-gray-800 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-800 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 bg-gray-800 rounded-xl" />
        <div className="h-9 w-32 bg-gray-800 rounded-xl" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-gray-800 last:border-0 px-5 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-800 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 bg-gray-800 rounded" />
              <div className="h-3 w-56 bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-12 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
