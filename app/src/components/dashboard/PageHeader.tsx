// Shared page-header for every dashboard route. Centralises the
// "[icon] title / subtitle [actions]" pattern most pages were
// duplicating inline. Industry-standard: matches the page-shell pattern
// in Linear, Vercel, Stripe dashboards.
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  // Lucide icon component. Pass the component itself, not an instance.
  icon?: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  iconTone?: 'green' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'red'
  title: string
  subtitle?: string
  // Optional "← back" link rendered above the title. Use for detail
  // pages so the way out is obvious without scrolling.
  backHref?: string
  backLabel?: string
  // Action buttons rendered on the right. Multiple allowed.
  actions?: React.ReactNode
}

const TONES: Record<NonNullable<PageHeaderProps['iconTone']>, { bg: string; text: string }> = {
  green:  { bg: 'bg-green-900/40',  text: 'text-green-300'  },
  blue:   { bg: 'bg-blue-900/40',   text: 'text-blue-300'   },
  purple: { bg: 'bg-purple-900/40', text: 'text-purple-300' },
  amber:  { bg: 'bg-amber-900/40',  text: 'text-amber-300'  },
  rose:   { bg: 'bg-rose-900/40',   text: 'text-rose-300'   },
  indigo: { bg: 'bg-indigo-900/40', text: 'text-indigo-300' },
  cyan:   { bg: 'bg-cyan-900/40',   text: 'text-cyan-300'   },
  red:    { bg: 'bg-red-900/40',    text: 'text-red-300'    },
}

export default function PageHeader({
  icon: Icon,
  iconTone = 'green',
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
}: PageHeaderProps) {
  const tone = TONES[iconTone]
  return (
    <header className="mb-5">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-white mb-2 -ml-0.5"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          {backLabel || 'Back'}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`w-10 h-10 ${tone.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={20} className={tone.text} aria-hidden={true} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </header>
  )
}
