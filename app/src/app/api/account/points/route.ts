import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { aedValueOfPoints, MIN_REDEEM_POINTS, POINTS_PER_AED_EARN, POINTS_PER_AED_REDEEM } from '@/lib/points'

export const dynamic = 'force-dynamic'

interface LedgerRow {
  id: number
  delta: number
  reason: string
  description: string | null
  order_id: number | null
  expires_at: string | null
  created_at: string
}

export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return NextResponse.json({
      signedIn: false,
      balance: 0,
      pendingEarn: 0,
      history: [],
      rules: {
        earnPerAed: POINTS_PER_AED_EARN,
        redeemPointsPerAed: POINTS_PER_AED_REDEEM,
        minRedeem: MIN_REDEEM_POINTS,
      },
    })
  }
  const supabase = getServiceRoleClient()
  const nowIso = new Date().toISOString()

  const [ledger, pending] = await Promise.all([
    supabase
      .from('customer_points_ledger')
      .select('id, delta, reason, description, order_id, expires_at, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(50),
    // "Pending" earn = points the customer will earn once their open orders
    // are marked delivered. We sum subtotals for non-cancelled, non-delivered
    // card-paid OR COD orders that don't yet have an order_earned row.
    supabase
      .from('orders')
      .select('id, subtotal_aed, subtotal, status')
      .eq('customer_email', customer.email.toLowerCase())
      .not('status', 'in', '("delivered","cancelled")'),
  ])

  const rows = (ledger.data || []) as LedgerRow[]
  const balance = rows
    .filter(r => !r.expires_at || r.expires_at > nowIso)
    .reduce((s, r) => s + r.delta, 0)
  const pendingEarn = (pending.data || []).reduce(
    (s, o) => s + Math.floor(Number(o.subtotal_aed ?? o.subtotal ?? 0)),
    0,
  )

  return NextResponse.json({
    signedIn: true,
    balance,
    pendingEarn,
    history: rows,
    rules: {
      earnPerAed: POINTS_PER_AED_EARN,
      redeemPointsPerAed: POINTS_PER_AED_REDEEM,
      minRedeem: MIN_REDEEM_POINTS,
      aedAtMinRedeem: aedValueOfPoints(MIN_REDEEM_POINTS),
    },
  })
}
