import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

function isPayloadConfigured(): boolean {
  const uri = process.env.MONGODB_URI || ''
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')
}

export const generateMetadata = ({ params, searchParams }: Args) => {
  if (!isPayloadConfigured()) {
    return { title: 'Admin unavailable — TMFoodStuff' }
  }
  return generatePageMetadata({ config, params, searchParams })
}

export default async function Page({ params, searchParams }: Args) {
  // Payload's built-in admin requires MongoDB. When the CMS is not configured
  // we render a friendly explainer pointing at the Supabase-backed dashboard
  // instead of crashing the request with an unhandled 500.
  if (!isPayloadConfigured()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🥬</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Payload admin is not configured</h1>
          <p style={{ color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
            This route is powered by Payload CMS and needs a MongoDB connection
            via <code>MONGODB_URI</code>. The live admin for TMFoodStuff lives
            at <a href="/dashboard" style={{ color: '#22c55e', fontWeight: 700, textDecoration: 'underline' }}>/dashboard</a> (Supabase-backed).
          </p>
          <a
            href="/dashboard"
            style={{
              display: 'inline-block',
              background: '#16a34a',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Go to dashboard →
          </a>
        </div>
      </div>
    )
  }

  return RootPage({ config, params, searchParams, importMap })
}
