import { Suspense } from 'react'
import ShopContent from './ShopContent'
import ShopLoading from './loading'

export const metadata = {
  title: 'Shop Fresh Produce',
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopContent />
    </Suspense>
  )
}
