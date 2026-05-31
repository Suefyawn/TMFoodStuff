import { NextResponse } from 'next/server'
import { getCurrentCustomer, getServiceRoleClient } from '@/lib/customer'

export const dynamic = 'force-dynamic'

interface AddressBody {
  id?: number
  label?: string
  building?: string
  street?: string
  area?: string
  emirate?: string
  makani?: string
  is_default?: boolean
}

function sanitise(body: AddressBody) {
  return {
    label:    String(body.label || '').trim().slice(0, 60) || null,
    building: String(body.building || '').trim().slice(0, 200) || null,
    street:   String(body.street || '').trim().slice(0, 200) || null,
    area:     String(body.area || '').trim().slice(0, 200) || null,
    emirate:  String(body.emirate || '').trim().slice(0, 100) || null,
    makani:   String(body.makani || '').trim().slice(0, 100) || null,
    is_default: !!body.is_default,
  }
}

export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getServiceRoleClient()
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('id, label, building, street, area, emirate, makani, is_default, created_at')
    .eq('customer_id', customer.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ addresses: data || [] })
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as AddressBody
  if (!body.emirate || !body.area) {
    return NextResponse.json({ error: 'Emirate and area are required.' }, { status: 400 })
  }
  const supabase = getServiceRoleClient()
  const payload = sanitise(body)
  // If this is being set as default, clear the flag on any other rows first
  // so there's never more than one default per customer.
  if (payload.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customer.id)
  }
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({ ...payload, customer_id: customer.id })
    .select('id')
    .single()
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true, id: data.id })
}

export async function PATCH(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as AddressBody
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = getServiceRoleClient()
  const payload = sanitise(body)
  if (payload.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customer.id)
  }
  const { error } = await supabase
    .from('customer_addresses')
    .update(payload)
    .eq('id', body.id)
    .eq('customer_id', customer.id)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = getServiceRoleClient()
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', Number(id))
    .eq('customer_id', customer.id)
  if (error) { console.error('[api]', error); return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
