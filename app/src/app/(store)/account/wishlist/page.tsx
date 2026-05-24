import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import WishlistClient from './WishlistClient'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/wishlist')

  const supabase = getServiceRoleClient()
  const { data } = await supabase
    .from('customer_wishlists')
    .select('product_id, created_at, products(id, slug, name, name_ar, price_aed, compare_at_price_aed, unit, stock, emoji, image_url, is_organic, is_featured, origin, is_active)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  type Row = {
    product_id: number
    products: {
      id: number
      slug: string
      name: string
      name_ar: string | null
      price_aed: number
      compare_at_price_aed: number | null
      unit: string | null
      stock: number | null
      emoji: string | null
      image_url: string | null
      is_organic: boolean | null
      is_featured: boolean | null
      origin: string | null
      is_active: boolean | null
    } | null
  }

  const items = ((data || []) as unknown as Row[])
    .filter(r => r.products?.is_active !== false && r.products !== null)
    .map(r => {
      const p = r.products!
      return {
        id: String(p.id),
        slug: p.slug,
        name: p.name,
        nameAr: p.name_ar || '',
        priceAED: Number(p.price_aed),
        compareAtPrice: p.compare_at_price_aed ? Number(p.compare_at_price_aed) : undefined,
        unit: p.unit || 'kg',
        stock: p.stock ?? 0,
        emoji: p.emoji || '',
        imageUrl: p.image_url || undefined,
        isOrganic: !!p.is_organic,
        isFeatured: !!p.is_featured,
        origin: p.origin || '',
      }
    })

  return <WishlistClient initialItems={items} />
}
