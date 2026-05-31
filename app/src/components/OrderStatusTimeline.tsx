'use client'
import { Clock, CheckCircle2, Package, Truck, Home, XCircle, Circle } from 'lucide-react'
import type { Locale } from '@/lib/locale'

export interface StatusEvent {
  status: string
  changed_at: string
  actor_email?: string | null
  note?: string | null
}

interface Props {
  history: StatusEvent[]
  currentStatus: string
  // Optional ISO date the customer chose for delivery; surfaced under the
  // "Out for delivery" / "Delivered" rows so the timeline conveys "when".
  deliveryDate?: string | null
  deliverySlot?: string | null
  locale?: Locale
  // 'full' shows actor + note rows; 'compact' is just status + timestamp.
  variant?: 'full' | 'compact'
}

const STANDARD_FLOW = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'] as const

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>> = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  out_for_delivery: Truck,
  delivered: Home,
  cancelled: XCircle,
}

const LABELS: Record<string, Record<Locale, string>> = {
  pending:          { en: 'Order placed',     ar: 'تم الطلب' },
  confirmed:        { en: 'Confirmed',         ar: 'مؤكد' },
  processing:       { en: 'Being packed',      ar: 'جارٍ التعبئة' },
  out_for_delivery: { en: 'Out for delivery',  ar: 'في الطريق إليك' },
  delivered:        { en: 'Delivered',         ar: 'تم التوصيل' },
  cancelled:        { en: 'Cancelled',         ar: 'مُلغى' },
}

const DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  pending:          { en: "We've got your order. We'll confirm in a few minutes.",  ar: 'تم استلام طلبك. سنؤكد خلال دقائق.' },
  confirmed:        { en: 'Order confirmed and queued for our packing team.',        ar: 'تم تأكيد طلبك وهو في طابور التعبئة.' },
  processing:       { en: 'Your fresh produce is being hand-picked and packed.',     ar: 'يتم اختيار وتعبئة طلبك يدوياً.' },
  out_for_delivery: { en: "Driver is on the way. Have your phone handy.",            ar: 'السائق في الطريق. اجعل هاتفك في متناولك.' },
  delivered:        { en: 'Delivered. Enjoy your fresh produce!',                    ar: 'تم التوصيل. استمتع بمنتجاتك الطازجة!' },
  cancelled:        { en: 'This order was cancelled.',                                ar: 'تم إلغاء هذا الطلب.' },
}

function formatWhen(iso: string, locale: Locale): string {
  const d = new Date(iso)
  const tag = locale === 'ar' ? 'ar-AE' : 'en-GB'
  const today = new Date()
  const same = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
  if (same) return `${locale === 'ar' ? 'اليوم' : 'Today'} · ${time}`
  return `${d.toLocaleDateString(tag, { day: '2-digit', month: 'short' })} · ${time}`
}

// Renders a vertical, status-aware tracking timeline. Used on three surfaces:
//   - /track (public, by order# + email)
//   - /account/orders/[number] (signed-in customer)
//   - /dashboard/orders/[id]   (admin)
//
// Behaviour:
// - Cancelled orders show ONLY the placement step + a red "Cancelled" row.
// - The currentStatus is the active step — it pulses; everything before it
//   is "done"; everything after is "pending" (greyed out).
// - We pull the actual changed_at timestamp from `history` where present so
//   customers see real "Confirmed at 9:42 AM" data, not just generic labels.
export default function OrderStatusTimeline({
  history,
  currentStatus,
  deliveryDate,
  deliverySlot,
  locale = 'en',
  variant = 'compact',
}: Props) {
  const isAr = locale === 'ar'

  // Build a quick lookup from status name → most recent timestamp seen.
  const latestAt = new Map<string, StatusEvent>()
  for (const ev of history) {
    const prev = latestAt.get(ev.status)
    if (!prev || new Date(ev.changed_at).getTime() > new Date(prev.changed_at).getTime()) {
      latestAt.set(ev.status, ev)
    }
  }

  if (currentStatus === 'cancelled') {
    const placed = latestAt.get('pending')
    const cancelled = latestAt.get('cancelled')
    return (
      <ol className="space-y-0" aria-label={isAr ? 'مسار الطلب' : 'Order timeline'}>
        <TimelineRow
          status="pending" state="done" isLast={false}
          when={placed?.changed_at} locale={locale} variant={variant}
          event={placed}
        />
        <TimelineRow
          status="cancelled" state="active" isLast
          when={cancelled?.changed_at} locale={locale} variant={variant}
          event={cancelled}
        />
      </ol>
    )
  }

  const currentIdx = STANDARD_FLOW.indexOf(currentStatus as typeof STANDARD_FLOW[number])

  return (
    <ol className="space-y-0" aria-label={isAr ? 'مسار الطلب' : 'Order timeline'}>
      {STANDARD_FLOW.map((step, i) => {
        const state: TimelineState =
          i < currentIdx ? 'done' :
          i === currentIdx ? 'active' :
          'pending'
        const event = latestAt.get(step)
        const hint = (step === 'out_for_delivery' || step === 'delivered') && state === 'pending' && deliveryDate
          ? formatDeliveryHint(deliveryDate, deliverySlot, locale)
          : null
        return (
          <TimelineRow
            key={step}
            status={step}
            state={state}
            isLast={i === STANDARD_FLOW.length - 1}
            when={event?.changed_at}
            locale={locale}
            variant={variant}
            event={event}
            hint={hint}
          />
        )
      })}
    </ol>
  )
}

type TimelineState = 'done' | 'active' | 'pending'

interface RowProps {
  status: string
  state: TimelineState
  isLast: boolean
  when?: string
  locale: Locale
  variant: 'full' | 'compact'
  event?: StatusEvent
  hint?: string | null
}

function TimelineRow({ status, state, isLast, when, locale, variant, event, hint }: RowProps) {
  const isAr = locale === 'ar'
  const Icon = ICONS[status] || Circle
  const label = LABELS[status]?.[locale] || status.replace(/_/g, ' ')
  const desc = DESCRIPTIONS[status]?.[locale]

  const ringClasses =
    status === 'cancelled' ? 'bg-red-500 text-white ring-red-100' :
    state === 'done' ? 'bg-forest text-white ring-green-100' :
    state === 'active' ? 'bg-forest text-white ring-green-100 shadow-md shadow-forest-light/30' :
    'bg-gray-100 text-gray-400 ring-gray-50'

  const lineClasses =
    state === 'done' ? 'bg-forest' :
    state === 'active' ? 'bg-gradient-to-b from-forest to-gray-200' :
    'bg-gray-200'

  const labelClasses =
    state === 'pending' ? 'text-gray-400' :
    status === 'cancelled' ? 'text-red-600' :
    'text-gray-900'

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Connector line behind subsequent steps */}
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute ${isAr ? 'right-[18px]' : 'left-[18px]'} top-9 bottom-0 w-0.5 ${lineClasses}`}
        />
      )}

      {/* Icon node */}
      <div className="relative shrink-0">
        <div className={`relative z-10 w-9 h-9 rounded-full ring-4 flex items-center justify-center ${ringClasses}`}>
          <Icon size={16} aria-hidden={true} />
          {state === 'active' && status !== 'cancelled' && (
            <span aria-hidden="true" className="absolute -inset-1 rounded-full bg-forest-light/30 animate-ping" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <p className={`font-bold text-sm ${labelClasses}`}>{label}</p>
          {when && (
            <p className="text-xs text-gray-500 tabular-nums">{formatWhen(when, locale)}</p>
          )}
        </div>
        {state !== 'pending' && desc && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        )}
        {state === 'pending' && hint && (
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        )}
        {variant === 'full' && event?.actor_email && state !== 'pending' && (
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            {isAr ? 'بواسطة' : 'by'} {event.actor_email}
          </p>
        )}
        {variant === 'full' && event?.note && state !== 'pending' && (
          <p className="text-xs text-gray-500 mt-1 italic">{event.note}</p>
        )}
      </div>
    </li>
  )
}

function formatDeliveryHint(date: string, slot: string | null | undefined, locale: Locale): string {
  const d = new Date(date + 'T00:00:00')
  const tag = locale === 'ar' ? 'ar-AE' : 'en-GB'
  const day = d.toLocaleDateString(tag, { weekday: 'long', day: '2-digit', month: 'short' })
  if (slot) {
    return locale === 'ar' ? `متوقع ${day} (${slot})` : `Expected ${day} (${slot})`
  }
  return locale === 'ar' ? `متوقع ${day}` : `Expected ${day}`
}
