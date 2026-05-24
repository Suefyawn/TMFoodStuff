export default function CustomersLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div>
        <div className="h-7 w-32 bg-gray-800 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-800 rounded" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-gray-800 last:border-0 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 bg-gray-800 rounded" />
              <div className="h-3 w-28 bg-gray-800 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
