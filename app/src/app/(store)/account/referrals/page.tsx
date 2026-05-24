import { redirect } from 'next/navigation'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'
import { SITE_URL } from '@/lib/site'
import ReferralsClient from './ReferralsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Refer & Earn',
  robots: { index: false, follow: false },
}

interface ReferralRow {
  id: number
  status: string
  reward_points: number
  created_at: string
  rewarded_at: string | null
  // Supabase returns the joined customers row as an array even for a single-
  // valued FK; flatten to one object after the query.
  referred: { full_name: string | null; email: string } | null
}

interface ReferralRowRaw {
  id: number
  status: string
  reward_points: number
  created_at: string
  rewarded_at: string | null
  referred: Array<{ full_name: string | null; email: string }> | null
}

export default async function ReferralsPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/account/login?next=/account/referrals')

  const supabase = getServiceRoleClient()
  const [{ data: profile }, { data: referralsRaw }] = await Promise.all([
    supabase
      .from('customers')
      .select('referral_code, full_name')
      .eq('id', customer.id)
      .maybeSingle(),
    supabase
      .from('customer_referrals')
      .select('id, status, reward_points, created_at, rewarded_at, referred:referred_id(full_name, email)')
      .eq('referrer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const code: string = profile?.referral_code || ''
  const shareUrl = `${SITE_URL}/?ref=${code}`
  const referrals: ReferralRow[] = ((referralsRaw || []) as unknown as ReferralRowRaw[]).map(r => ({
    id: r.id,
    status: r.status,
    reward_points: r.reward_points,
    created_at: r.created_at,
    rewarded_at: r.rewarded_at,
    referred: Array.isArray(r.referred) && r.referred[0] ? r.referred[0] : null,
  }))
  const rewardedCount = referrals.filter(r => r.status === 'rewarded').length
  const pendingCount = referrals.filter(r => r.status === 'pending').length
  const totalEarned = referrals
    .filter(r => r.status === 'rewarded')
    .reduce((s, r) => s + (r.reward_points || 0), 0)

  return (
    <ReferralsClient
      code={code}
      shareUrl={shareUrl}
      referrals={referrals}
      rewardedCount={rewardedCount}
      pendingCount={pendingCount}
      totalEarned={totalEarned}
    />
  )
}
