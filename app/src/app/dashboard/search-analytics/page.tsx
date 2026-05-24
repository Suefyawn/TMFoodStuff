// Search analytics. Two stories on one page:
//
//   1. Top no-results queries — every search that found neither a product
//      nor a category. This is the highest-value signal: each row is
//      something a customer wanted and we didn't sell.
//
//   2. Top queries overall — what people search for most. Useful to know
//      which products to feature on the home page and which categories
//      to surface in the navbar.
//
// Both views run on the last 30 days so seasonal patterns are visible
// without ancient data washing out current signal.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, AlertCircle, TrendingUp } from 'lucide-react'
import { isAdminAuthed } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

interface AggRow {
  query: string
  cnt: number
}

async function topQueries(supabase: SupabaseClient, zeroOnly: boolean): Promise<AggRow[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  // PostgREST can't aggregate, so pull rows + aggregate in JS. 5000 row
  // cap keeps the lambda bounded; if the storefront gets so much search
  // traffic that we hit it, swap this for a server-side group-by view.
  let query = supabase
    .from('search_logs')
    .select('query, total_hits')
    .gte('created_at', since)
    .limit(5000)
  if (zeroOnly) query = query.eq('total_hits', 0)
  const { data } = await query
  const rows = (data || []) as Array<{ query: string; total_hits: number }>
  const map = new Map<string, number>()
  for (const r of rows) {
    map.set(r.query, (map.get(r.query) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([query, cnt]) => ({ query, cnt }))
    .sort((a, b) => b.cnt - a.cnt)
    .slice(0, 25)
}

export default async function SearchAnalyticsPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [zeroResults, allTop, { count: totalSearches }] = await Promise.all([
    topQueries(supabase, true),
    topQueries(supabase, false),
    supabase
      .from('search_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <header className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-purple-900/40 rounded-xl flex items-center justify-center">
          <Search size={20} className="text-purple-300" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Search analytics</h1>
          <p className="text-gray-500 text-sm">Last 30 days · {totalSearches || 0} total searches</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* No-results queries — the source-this-product list */}
        <section className="bg-gray-900 border border-amber-800/40 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-300" aria-hidden="true" />
            <h2 className="text-white font-black">Customers searched for these — we didn&apos;t have it</h2>
          </div>
          {zeroResults.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">Every recent search returned something. Nice.</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {zeroResults.map(r => (
                <li key={r.query} className="px-5 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-800/30 transition-colors">
                  <span className="font-mono text-sm text-gray-200 truncate">{r.query}</span>
                  <span className="text-xs font-bold text-amber-300 tabular-nums">{r.cnt}×</span>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-2.5 bg-amber-900/10 border-t border-amber-800/30 text-xs text-amber-200/70">
            <Link href="/dashboard/products" className="hover:text-amber-100 font-bold">→ Add a matching product</Link>
          </div>
        </section>

        {/* Top queries overall */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-300" aria-hidden="true" />
            <h2 className="text-white font-black">Top searches</h2>
          </div>
          {allTop.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No search traffic yet.</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {allTop.map(r => (
                <li key={r.query} className="px-5 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-800/30 transition-colors">
                  <span className="font-mono text-sm text-gray-200 truncate">{r.query}</span>
                  <span className="text-xs font-bold text-green-300 tabular-nums">{r.cnt}×</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
