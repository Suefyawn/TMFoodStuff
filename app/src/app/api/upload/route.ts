// Customer-side image upload for review photos. Same storage bucket as
// admin uploads but gated to signed-in customers and only allows the
// `reviews/` folder path so a malicious uploader can't drop arbitrary
// files at the bucket root.
//
// Reuses the dashboard upload's validation (allowed types, max size).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentCustomer } from '@/lib/customer'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return NextResponse.json({ error: 'Sign in to upload images.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP or AVIF images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large — max 5 MB' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  // Prefix with customer id so abuse can be traced back, scoped to the
  // reviews folder which is the only customer-writable area.
  const filename = `reviews/${customer.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}
