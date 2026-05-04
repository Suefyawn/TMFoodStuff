import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'
import { CheckCircle, XCircle, ExternalLink, Mail, BarChart3, AlertTriangle, Database, Globe } from 'lucide-react'

async function isAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dashboard_auth')?.value
  if (!token) return false
  const expected = createHash('sha256').update(process.env.DASHBOARD_PASSWORD || '').digest('hex')
  return token === expected
}

interface Integration {
  id: string
  name: string
  description: string
  docsUrl: string
  envVars: { key: string; label: string; secret?: boolean }[]
  icon: React.ElementType
  iconColor: string
  configured: boolean
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
      <CheckCircle size={12} /> Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
      <XCircle size={12} /> Not configured
    </span>
  )
}

function EnvVar({ envKey, present }: { envKey: string; present: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg ${
      present ? 'bg-green-900/20 text-green-300 border border-green-800/40' : 'bg-gray-800 text-gray-500 border border-gray-700'
    }`}>
      <span className={present ? 'text-green-400' : 'text-gray-600'}>
        {present ? '✓' : '○'}
      </span>
      {envKey}
    </div>
  )
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = integration.icon
  return (
    <div className={`bg-gray-900 border rounded-2xl p-6 transition-all ${
      integration.configured ? 'border-gray-700' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${integration.iconColor}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{integration.name}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{integration.description}</p>
          </div>
        </div>
        <StatusBadge ok={integration.configured} />
      </div>

      <div className="space-y-1.5 mb-4">
        {integration.envVars.map(v => (
          <EnvVar key={v.key} envKey={v.key} present={!!process.env[v.key]} />
        ))}
      </div>

      <a
        href={integration.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        View docs <ExternalLink size={11} />
      </a>
    </div>
  )
}

export default async function IntegrationsPage() {
  if (!(await isAdmin())) redirect('/dashboard/login')

  const integrations: Integration[] = [
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Database, auth, storage — core infrastructure',
      docsUrl: 'https://supabase.com/docs',
      icon: Database,
      iconColor: 'bg-emerald-900/40 text-emerald-400',
      envVars: [
        { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Project URL' },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon Key' },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', secret: true },
      ],
      configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    {
      id: 'resend',
      name: 'Resend',
      description: 'Transactional emails — order confirmations & admin alerts',
      docsUrl: 'https://resend.com/docs',
      icon: Mail,
      iconColor: 'bg-blue-900/40 text-blue-400',
      envVars: [
        { key: 'RESEND_API_KEY', label: 'API Key', secret: true },
        { key: 'RESEND_FROM_EMAIL', label: 'From Email' },
        { key: 'ADMIN_EMAIL', label: 'Admin Email' },
      ],
      configured: !!process.env.RESEND_API_KEY,
    },
    {
      id: 'posthog',
      name: 'PostHog',
      description: 'Product analytics — pageviews, events, funnels',
      docsUrl: 'https://posthog.com/docs',
      icon: BarChart3,
      iconColor: 'bg-orange-900/40 text-orange-400',
      envVars: [
        { key: 'NEXT_PUBLIC_POSTHOG_KEY', label: 'Project API Key' },
        { key: 'NEXT_PUBLIC_POSTHOG_HOST', label: 'Host (optional)' },
      ],
      configured: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
    },
    {
      id: 'sentry',
      name: 'Sentry',
      description: 'Error tracking & performance monitoring',
      docsUrl: 'https://docs.sentry.io/platforms/javascript/guides/nextjs/',
      icon: AlertTriangle,
      iconColor: 'bg-purple-900/40 text-purple-400',
      envVars: [
        { key: 'NEXT_PUBLIC_SENTRY_DSN', label: 'DSN' },
        { key: 'SENTRY_ORG', label: 'Org slug' },
        { key: 'SENTRY_PROJECT', label: 'Project slug' },
      ],
      configured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
    {
      id: 'domain',
      name: 'Custom Domain',
      description: 'Site URL used in emails and Open Graph tags',
      docsUrl: 'https://vercel.com/docs/projects/domains',
      icon: Globe,
      iconColor: 'bg-cyan-900/40 text-cyan-400',
      envVars: [
        { key: 'NEXT_PUBLIC_SITE_URL', label: 'Site URL' },
      ],
      configured: !!process.env.NEXT_PUBLIC_SITE_URL,
    },
  ]

  const configuredCount = integrations.filter(i => i.configured).length

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Integrations</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {configuredCount}/{integrations.length} services configured
        </p>
      </div>

      {configuredCount < integrations.length && (
        <div className="mb-6 bg-amber-900/20 border border-amber-700/40 rounded-xl px-5 py-4 flex gap-3 items-start">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Missing environment variables</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Add the missing keys to your Vercel project environment variables, then redeploy.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(integration => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-bold text-white mb-3">How to add environment variables</h2>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2"><span className="text-gray-600 font-mono">1.</span> Go to your Vercel project → Settings → Environment Variables</li>
          <li className="flex gap-2"><span className="text-gray-600 font-mono">2.</span> Add each missing key with its value from the respective service dashboard</li>
          <li className="flex gap-2"><span className="text-gray-600 font-mono">3.</span> Redeploy the project — environment changes take effect on next deploy</li>
        </ol>
      </div>
    </div>
  )
}
