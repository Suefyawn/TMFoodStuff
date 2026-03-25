export default function ShopPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-green text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Shop Fresh Produce</h1>
          <p className="text-white/90 text-lg max-w-xl mx-auto">
            Browse our daily selection of fruits and vegetables — all prices in AED.
          </p>
        </div>
      </section>

      {/* Shop Layout */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Filter</h2>
                {/* Category filter */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Category</h3>
                  <ul className="space-y-2">
                    {['All', 'Fruits', 'Vegetables', 'Herbs', 'Exotic', 'Citrus'].map((cat) => (
                      <li key={cat}>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-brand-green">
                          <input type="checkbox" className="accent-brand-green" />
                          <span className="text-gray-700">{cat}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Price range */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Price (AED)</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600 text-sm">Showing all products</p>
                <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option>Sort: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
              {/* Placeholder grid — will be populated from Medusa */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                    <div className="bg-gray-200 h-44 w-full" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-8 bg-gray-100 rounded mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
