import Link from 'next/link'

const categories = [
  { name: 'All', slug: '' },
  { name: 'Fruits 🍎', slug: 'fruits' },
  { name: 'Vegetables 🥦', slug: 'vegetables' },
  { name: 'Organic 🌱', slug: 'organic' },
  { name: 'Exotic 🥭', slug: 'exotic' },
  { name: 'Juices 🧃', slug: 'juices' },
]

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">All Products</h1>
        <p className="text-gray-500">Farm fresh produce delivered to your door</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map(cat => (
          <Link
            key={cat.slug}
            href={cat.slug ? `/shop/${cat.slug}` : '/shop'}
            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div className="col-span-full text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🛒</div>
          <p className="font-bold text-lg text-gray-600">Products load from Payload CMS</p>
          <p className="text-sm mt-2">Go to <span className="font-mono bg-gray-100 px-2 py-1 rounded">/admin</span> to add products</p>
        </div>
      </div>
    </div>
  )
}
