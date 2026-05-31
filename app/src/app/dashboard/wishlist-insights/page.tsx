// Wishlist analytics — which products customers want most. Practical
// signal: high-want + low-orders = price too high or low awareness;
// high-want + low-stock = "restock urgently" tier.
//
// Compares wishlist count vs 30-day order quantity per product so the
// admin can spot products that are popular in intent but not converting.
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart, AlertTriangle, TrendingUp } from 'lucide-react'
import { isAdminAuthed } from '@/lib/admin-auth'
import PageHeader from '@/components/dashboard/PageHeader'
import SubNav, { CUSTOMERS_SUBNAV } from '@/components/dashboard/SubNav'

export const dynamic = 'force-dynamic'

interface WishlistRow {
  product_id: number
  product: { name: string; slug: string; emoji: string | null; stock: number | null; price_aed: number | null; is_active: boolean } | Array<{ name: string; slug: string; emoji: string | null; stock: number | null; price_aed: number | null; is_active: boolean }> | null
}

interface OrderItem { id?: number | string; product_id?: number | string; quantity?: number }

export default async function WishlistInsightsPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: wishlistRaw }, { data: orders }] = await Promise.all([
    supabase
      .from('customer_wishlists')
      .select('product_id, product:product_id(name, slug, emoji, stock, price_aed, is_active)')
      .limit(5000),
    supabase
      .from('orders')
      .select('items')
      .neq('status', 'cancelled')
      .gte('created_at', monthAgo)
      .limit(5000),
  ])

  // Aggregate wishlist counts per product.
  const wishCounts = new Map<number, number>()
  const productInfo = new Map<number, { name: string; slug: string; emoji: string | null; stock: number; price: number; active: boolean }>()
  for (const row of ((wishlistRaw || []) as WishlistRow[])) {
    const p = Array.isArray(row.product) ? row.product[0] : row.product
    if (!p) continue
    wishCounts.set(row.product_id, (wishCounts.get(row.product_id) || 0) + 1)
    if (!productInfo.has(row.product_id)) {
      productInfo.set(row.product_id, {
        name: p.name,
        slug: p.slug,
        emoji: p.emoji,
        stock: Number(p.stock ?? 0),
        price: Number(p.price_aed ?? 0),
        active: p.is_active !== false,
      })
    }
  }

  // 30-day units sold per product.
  const sold30d = new Map<number, number>()
  for (const o of (orders || [])) {
    const items = Array.isArray(o.items) ? (o.items as OrderItem[]) : []
    for (const it of items) {
      const id = Number(it.id ?? it.product_id)
      if (!Number.isFinite(id)) continue
      sold30d.set(id, (sold30d.get(id) || 0) + (Number(it.quantity) || 0))
    }
  }

  // Build the ranked list. Score = wishlist count + bonus when stock is low.
  const rows = Array.from(wishCounts.entries()).map(([id, wishes]) => {
    const info = productInfo.get(id)
    return {
      id,
      info,
      wishes,
      sold: sold30d.get(id) || 0,
    }
  }).sort((a, b) => b.wishes - a.wishes)

  const totalWishes = rows.reduce((s, r) => s + r.wishes, 0)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      <SubNav items={CUSTOMERS_SUBNAV} />
      <PageHeader
        icon={Heart}
        iconTone="rose"
        title="Wishlist insights"
        subtitle={`${totalWishes} saved items across ${rows.length} unique products`}
      />

      {/* Action-tier hint banner — only renders when there's at least
          one product that's high-want + out-of-stock. */}
      {(() => {
        const oos = rows.filter(r => r.info && r.info.stock === 0 && r.wishes >= 2).slice(0, 5)
        if (oos.length === 0) return null
        return (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-amber-100 font-bold text-sm mb-1">{oos.length} highly-wished product{oos.length === 1 ? '' : 's'} {oos.length === 1 ? 'is' : 'are'} out of stock</p>
              <p className="text-xs text-amber-200/70">{oos.map(r => r.info?.name).join(', ')} — restocking will unlock back-in-stock emails to {oos.reduce((s, r) => s + r.wishes, 0)} interested customer{oos.reduce((s, r) => s + r.wishes, 0) === 1 ? '' : 's'}.</p>
            </div>
          </div>
        )
      })()}

      <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-12 text-center text-sm text-gray-500">No wishlist activity yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Product</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Saved</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Sold 30d</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.slice(0, 50).map(r => {
                const i = r.info
                const oos = i && i.stock === 0
                const lowStock = i && i.stock > 0 && i.stock <= 5
                const popular = r.wishes >= 5
                // Compose a one-word signal so the operator can scan the
                // table without doing the math themselves.
                let signal = '—'
                let signalCls = 'text-gray-500'
                if (oos && popular) { signal = 'Restock urgent'; signalCls = 'text-red-300' }
                else if (oos) { signal = 'Restock'; signalCls = 'text-amber-300' }
                else if (popular && r.sold === 0) { signal = 'Price check?'; signalCls = 'text-amber-200' }
                else if (popular) { signal = 'Hot'; signalCls = 'text-green-300' }
                else if (lowStock) { signal = 'Low stock'; signalCls = 'text-amber-200' }
                return (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/product/${i?.slug || ''}`} target="_blank" className="text-white font-bold hover:text-green-400 inline-flex items-center gap-2">
                        {i?.emoji && <span>{i.emoji}</span>}
                        {i?.name || `#${r.id}`}
                      </Link>
                      {i && !i.active && <span className="ml-2 text-[10px] font-bold uppercase text-gray-500 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">inactive</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-rose-300 font-bold">{r.wishes}</td>
                    <td className={`px-5 py-3 text-right tabular-nums font-bold ${oos ? 'text-red-400' : lowStock ? 'text-amber-400' : 'text-gray-300'}`}>{i?.stock ?? 0}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300">{r.sold}</td>
                    <td className={`px-5 py-3 text-right text-[11px] font-bold ${signalCls}`}>
                      {signal !== '—' && <TrendingUp size={10} className="inline mr-1" aria-hidden="true" />}
                      {signal}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
      <p className="text-[11px] text-gray-500">
        Signal hints: <span className="text-red-300">Restock urgent</span> = high wishes + zero stock.
        <span className="text-amber-200 ml-2">Price check?</span> = many customers wished but nobody ordered in 30 days.
        <span className="text-green-300 ml-2">Hot</span> = high wishes + healthy sales.
      </p>
    </div>
  )
}
