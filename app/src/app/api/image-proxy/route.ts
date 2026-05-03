import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Only allow Barakat CDN and Unsplash — exact hostname match to prevent bypass
  const allowedDomains = ['media.barakatfresh.ae', 'images.unsplash.com']
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  if (!allowedDomains.includes(parsed.hostname)) {
    return new NextResponse('Domain not allowed', { status: 403 })
  }

  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Referer': 'https://barakatfresh.ae/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    clearTimeout(timer)

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_SIZE) {
      return new NextResponse('Image too large', { status: 413 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 415 })
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_SIZE) {
      return new NextResponse('Image too large', { status: 413 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    clearTimeout(timer)
    if (err?.name === 'AbortError') return new NextResponse('Upstream timeout', { status: 504 })
    return new NextResponse('Proxy error', { status: 500 })
  }
}
