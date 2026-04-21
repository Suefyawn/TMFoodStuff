import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import { NextResponse } from 'next/server'
import config from '@payload-config'

function isPayloadConfigured(): boolean {
  const uri = process.env.MONGODB_URI || ''
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')
}

function unavailable() {
  return NextResponse.json(
    {
      error: 'Payload CMS is not configured on this deployment. Set MONGODB_URI and PAYLOAD_SECRET to enable /api/*.',
    },
    { status: 503 },
  )
}

export const GET = async (req: Request, ctx: any) =>
  isPayloadConfigured() ? REST_GET(config)(req as any, ctx) : unavailable()
export const POST = async (req: Request, ctx: any) =>
  isPayloadConfigured() ? REST_POST(config)(req as any, ctx) : unavailable()
export const DELETE = async (req: Request, ctx: any) =>
  isPayloadConfigured() ? REST_DELETE(config)(req as any, ctx) : unavailable()
export const PATCH = async (req: Request, ctx: any) =>
  isPayloadConfigured() ? REST_PATCH(config)(req as any, ctx) : unavailable()
export const PUT = async (req: Request, ctx: any) =>
  isPayloadConfigured() ? REST_PUT(config)(req as any, ctx) : unavailable()
export const OPTIONS = async (req: Request, ctx: any) =>
  isPayloadConfigured() ? REST_OPTIONS(config)(req as any, ctx) : unavailable()
