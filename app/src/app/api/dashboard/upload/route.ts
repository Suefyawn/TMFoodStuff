import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthed } from '@/lib/admin-auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    if (error.message.includes('Bucket not found')) {
      return NextResponse.json(
        { error: 'Storage bucket "product-images" not set up. Please create it in your Supabase dashboard → Storage.' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}

export async function DELETE(request: Request) {
  if (!await isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Extract the filename from the full public URL
  const urlObj = new URL(url)
  const parts = urlObj.pathname.split('/product-images/')
  if (parts.length < 2) return NextResponse.json({ ok: true }) // not our bucket, ignore

  const path = decodeURIComponent(parts[1])
  await supabase.storage.from('product-images').remove([path])

  return NextResponse.json({ ok: true })
}
