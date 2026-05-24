export default function CategoriesLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-7 w-32 bg-gray-800 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-800 rounded" />
                <div className="h-3 w-16 bg-gray-800 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-gray-800 rounded" />
            <div className="h-3 w-3/4 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
