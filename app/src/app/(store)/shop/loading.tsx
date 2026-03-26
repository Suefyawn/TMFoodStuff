export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-gray-200 rounded-xl w-48 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-100 rounded-xl w-72 animate-pulse" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 mb-3">
            <div className="h-10 bg-gray-200 rounded-full w-64 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-full w-36 animate-pulse" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 rounded-full w-24 flex-shrink-0 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-5 bg-gray-200 rounded w-32 mb-5 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="h-9 bg-gray-200 rounded-xl w-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
