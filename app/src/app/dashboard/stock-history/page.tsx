import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import SubNav, { CATALOG_SUBNAV } from '@/components/dashboard/SubNav'
import StockHistoryClient from './StockHistoryClient'

export const dynamic = 'force-dynamic'

export default async function StockHistoryPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('product_stock_history')
    .select('id, product_id, delta, before, after, reason, actor_email, order_id, note, created_at, products(name, slug)')
    .order('created_at', { ascending: false })
    .limit(500)
  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6">
      <SubNav items={CATALOG_SUBNAV} />
      <div className="-mx-4 sm:-mx-6 -mt-5">
        <StockHistoryClient initialRows={(data || []) as unknown as Array<Row>} />
      </div>
    </div>
  )
}

interface Row {
  id: number
  product_id: number
  delta: number
  before: number
  after: number
  reason: string
  actor_email: string | null
  order_id: number | null
  note: string | null
  created_at: string
  products: { name: string; slug: string } | null
}
