// Admin customer list. Aggregates from orders (so guest checkouts show
// up too) and joins customers by email when one exists, so the row can
// link to /dashboard/customers/[id] with the full profile.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

interface AggregatedCustomer {
  id: number | null      // customers.id if registered, null for guest-only buyers
  tier: string | null
  name: string
  phone: string
  email: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  orders: Array<{ id: number; order_number: string; total: number | null; status: string | null; created_at: string }>
}

export async function GET() {
  if (!await isAdminAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: orders }, { data: registered }] = await Promise.all([
    supabase.from('orders').select('id, order_number, customer_name, customer_phone, customer_email, total, status, created_at').order('created_at', { ascending: false }).limit(5000),
    supabase.from('customers').select('id, email, full_name, phone, tier').is('deleted_at', null).limit(5000),
  ])

  // Build a quick lookup from lowercase email → registered customer.
  const registeredByEmail = new Map<string, { id: number; tier: string | null; full_name: string | null; phone: string | null }>()
  for (const c of registered || []) {
    if (c.email) registeredByEmail.set(c.email.toLowerCase(), {
      id: c.id,
      tier: c.tier ?? null,
      full_name: c.full_name,
      phone: c.phone,
    })
  }

  const customers: Record<string, AggregatedCustomer> = {}
  for (const order of (orders || [])) {
    const emailLower = (order.customer_email || '').toLowerCase()
    const reg = emailLower ? registeredByEmail.get(emailLower) : undefined
    // Group by registered customer id when one exists (handles email/phone
    // changes across orders), else by phone/email/name.
    const key = reg ? `id:${reg.id}` : (order.customer_phone || order.customer_email || order.customer_name || 'unknown')
    if (!customers[key]) {
      customers[key] = {
        id: reg?.id ?? null,
        tier: reg?.tier ?? null,
        name: reg?.full_name || order.customer_name || '—',
        phone: reg?.phone || order.customer_phone || '',
        email: order.customer_email || '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: order.created_at,
        orders: [],
      }
    }
    customers[key].totalOrders++
    customers[key].totalSpent += order.total || 0
    customers[key].orders.push({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    })
  }

  // Surface registered customers who haven't ordered yet — they should
  // still appear in the team's view (e.g., newly signed-up + abandoned).
  for (const c of registered || []) {
    const k = `id:${c.id}`
    if (!customers[k]) {
      customers[k] = {
        id: c.id,
        tier: c.tier ?? null,
        name: c.full_name || '—',
        phone: c.phone || '',
        email: c.email || '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: '',
        orders: [],
      }
    }
  }

  const list = Object.values(customers).sort((a, b) => b.totalSpent - a.totalSpent)
  return NextResponse.json(list)
}
