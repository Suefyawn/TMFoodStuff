import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'
import ReviewsClient from './ReviewsClient'

export const dynamic = 'force-dynamic'

export default async function ReviewsAdminPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('product_reviews')
    .select('id, rating, title, body, images, verified_purchase, helpful_count, admin_reply, admin_reply_at, admin_reply_by, status, created_at, moderated_at, moderator_email, products(slug, name), customers(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(500)
  return <ReviewsClient initialRows={(data || []) as unknown as Array<Row>} />
}

interface Row {
  id: number
  rating: number
  title: string | null
  body: string | null
  images: Array<{ url: string; alt?: string }> | null
  verified_purchase: boolean
  helpful_count: number
  admin_reply: string | null
  admin_reply_at: string | null
  admin_reply_by: string | null
  status: string
  created_at: string
  moderated_at: string | null
  moderator_email: string | null
  products: { slug: string; name: string } | null
  customers: { email: string | null; full_name: string | null } | null
}
