import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { POINTS_PER_AED_EARN, POINTS_PER_AED_REDEEM, MIN_REDEEM_POINTS, aedValueOfPoints } from '@/lib/points'
import PointsClient from './PointsClient'

export const dynamic = 'force-dynamic'

export default async function PointsPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/points')

  const supabase = getServiceRoleClient()
  const nowIso = new Date().toISOString()
  const { data: ledger } = await supabase
    .from('customer_points_ledger')
    .select('id, delta, reason, description, order_id, expires_at, created_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(100)

  type Row = { id: number; delta: number; reason: string; description: string | null; order_id: number | null; expires_at: string | null; created_at: string }
  const rows = (ledger || []) as Row[]
  const balance = rows
    .filter(r => !r.expires_at || r.expires_at > nowIso)
    .reduce((s, r) => s + r.delta, 0)

  return (
    <PointsClient
      balance={balance}
      history={rows}
      rules={{
        earnPerAed: POINTS_PER_AED_EARN,
        redeemPointsPerAed: POINTS_PER_AED_REDEEM,
        minRedeem: MIN_REDEEM_POINTS,
        aedAtMinRedeem: aedValueOfPoints(MIN_REDEEM_POINTS),
      }}
    />
  )
}
