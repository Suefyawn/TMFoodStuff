import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Only allow Barakat CDN and Unsplash
  const allowedDomains = ['media.barakatfresh.ae', 'images.unsplash.com']
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  if (!allowedDomains.some(d => hostname.includes(d))) {
    return new NextResponse('Domain not allowed', { status: 403 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://barakatfresh.ae/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Proxy error', { status: 500 })
  }
}
