export default function ProductsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-7 w-32 bg-gray-800 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-800 rounded" />
        </div>
        <div className="h-9 w-36 bg-gray-800 rounded-xl" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="h-9 w-64 bg-gray-800 rounded-xl" />
        <div className="h-9 w-40 bg-gray-800 rounded-xl" />
        <div className="h-9 w-32 bg-gray-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="aspect-square bg-gray-800 rounded-xl" />
            <div className="h-4 w-3/4 bg-gray-800 rounded" />
            <div className="h-3 w-1/2 bg-gray-800 rounded" />
            <div className="flex justify-between">
              <div className="h-4 w-12 bg-gray-800 rounded" />
              <div className="h-4 w-16 bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
