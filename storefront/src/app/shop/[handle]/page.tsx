interface ProductPageProps {
  params: { handle: string }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span>Shop</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium capitalize">{params.handle}</span>
        </nav>

        {/* Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-gray-100 rounded-2xl h-96 lg:h-[500px] flex items-center justify-center">
            <span className="text-gray-400 text-6xl">🥬</span>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <span className="inline-block bg-green-100 text-brand-green text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit">
              Fresh Today
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 capitalize">
              {params.handle.replace(/-/g, ' ')}
            </h1>
            <p className="text-gray-600 mb-6">
              Premium quality, sourced fresh daily. Delivered to your door anywhere in UAE.
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-brand-green">AED 0.00</span>
              <span className="text-gray-500 text-sm ml-2">/ kg (incl. 5% VAT)</span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <label className="font-semibold text-gray-700">Qty:</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button className="px-4 py-2 hover:bg-gray-100 transition-colors font-bold">−</button>
                <span className="px-6 py-2 border-x">1</span>
                <button className="px-4 py-2 hover:bg-gray-100 transition-colors font-bold">+</button>
              </div>
              <span className="text-gray-500 text-sm">kg</span>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button className="flex-1 btn-primary text-center">
                Add to Cart 🛒
              </button>
              <a
                href="https://wa.me/971XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-green-500 text-green-600 px-5 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                💬 WhatsApp
              </a>
            </div>

            {/* VAT note */}
            <p className="text-xs text-gray-400 mt-4">
              * All prices include 5% UAE VAT as required by the Federal Tax Authority.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
