'use client'
// The dashboard's first-run guide: the "Getting started" checklist on the
// Overview, the tip card a page shows for its step, and the helper pages call
// when a person finishes a step for real (saves a product, adds a category).
// Step text lives in lib/onboarding.ts.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Circle, GraduationCap, X, BookOpen, ArrowRight } from 'lucide-react'
import {
  EMPTY_GUIDE_STATE, getStep, guideStorageKey, markDone, parseGuideState, progress, stepsForRole,
  type GuideRole, type GuideState, type GuideStepId,
} from '@/lib/onboarding'

const CHANGE_EVENT = 'tmf-guide-change'

interface GuideUser { email: string; role: GuideRole }
const GuideUserContext = createContext<GuideUser | null>(null)

export function GuideUserProvider({ email, role, children }: GuideUser & { children: React.ReactNode }) {
  return <GuideUserContext.Provider value={{ email, role }}>{children}</GuideUserContext.Provider>
}

function read(email: string): GuideState {
  try { return parseGuideState(window.localStorage.getItem(guideStorageKey(email))) } catch { return EMPTY_GUIDE_STATE }
}

function write(email: string, state: GuideState) {
  try { window.localStorage.setItem(guideStorageKey(email), JSON.stringify(state)) } catch { /* private mode: the guide just forgets */ }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useGuide() {
  const user = useContext(GuideUserContext)
  // null until mounted, so server HTML and the first client render match.
  const [state, setState] = useState<GuideState | null>(null)

  useEffect(() => {
    if (!user) return
    const sync = () => setState(read(user.email))
    sync()
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [user])

  const complete = useCallback((id: GuideStepId) => {
    if (!user) return
    write(user.email, markDone(read(user.email), id))
  }, [user])

  const setHidden = useCallback((hidden: boolean) => {
    if (!user) return
    write(user.email, { ...read(user.email), hidden })
  }, [user])

  const reset = useCallback(() => {
    if (!user) return
    write(user.email, EMPTY_GUIDE_STATE)
  }, [user])

  return { user, state, complete, setHidden, reset }
}

// Overview card. Shows until every step is done or the person hides it.
export function GettingStarted() {
  const { user, state, setHidden } = useGuide()
  if (!user || !state || state.hidden) return null
  const steps = stepsForRole(user.role)
  const p = progress(state, user.role)
  if (steps.length === 0 || p.complete) return null
  const next = steps.find(s => !state.done.includes(s.id))
  const pct = Math.round((p.done / p.total) * 100)

  return (
    <section aria-labelledby="getting-started" className="bg-gray-900 border border-emerald-700/40 rounded-xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-emerald-400" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 id="getting-started" className="text-white font-bold">Getting started</h2>
          <p className="text-gray-400 text-sm">Learn the dashboard by doing each task once. {p.done} of {p.total} done.</p>
        </div>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="p-1.5 -m-1 text-gray-500 hover:text-white"
          aria-label="Hide the getting started guide"
          title="Hide (you can bring it back from Help)"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Guide progress">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-4 divide-y divide-gray-800">
        {steps.map(step => {
          const done = state.done.includes(step.id)
          const isNext = step.id === next?.id
          return (
            <li key={step.id} className="py-2.5 flex items-center gap-3">
              {done
                ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-label="Done" />
                : <Circle size={18} className="text-gray-600 shrink-0" aria-label="Not done" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${done ? 'text-gray-500 line-through' : 'text-white'}`}>{step.title}</p>
                {!done && <p className="text-xs text-gray-500">{step.summary}</p>}
              </div>
              {!done && (
                <Link
                  href={step.href}
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isNext ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  Show me <ArrowRight size={12} aria-hidden="true" />
                </Link>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-xs text-gray-500">
        Want the whole picture? <Link href="/dashboard/help" className="text-emerald-400 hover:text-emerald-300 font-semibold">Read the staff guide</Link>.
      </p>
    </section>
  )
}

// A page's tip card. Opens when the URL carries ?guide=<step> (from "Show me"),
// or on its own while the guide is running and the step is not done yet.
// `steps` lists the steps this page teaches, in order.
export function GuideTip({ steps }: { steps: GuideStepId[] }) {
  const { user, state, complete } = useGuide()
  const params = useSearchParams()
  const [closed, setClosed] = useState<string | null>(null)
  if (!user || !state) return null

  const allowed = new Set(stepsForRole(user.role).map(s => s.id))
  const requested = params.get('guide')
  const fromLink = requested && steps.includes(requested as GuideStepId) ? (requested as GuideStepId) : null
  const pending = steps.find(id => allowed.has(id) && !state.done.includes(id))
  // A finished "Show me" step hands over to the page's next unfinished one.
  const id = fromLink && !state.done.includes(fromLink) ? fromLink : (state.hidden ? null : pending)
  if (!id || !allowed.has(id) || closed === id) return null
  const step = getStep(id)
  if (!step) return null
  return (
    <aside
      aria-label={`Tip: ${step.title}`}
      className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-4 text-sm"
    >
      <div className="flex items-start gap-3">
        <GraduationCap size={18} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold">Try it: {step.title.toLowerCase()}</p>
          <ol className="mt-1.5 list-decimal pl-5 space-y-1 text-gray-300">
            {step.tip.map((line, i) => <li key={i}>{line}</li>)}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => complete(id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              I&apos;ve done this
            </button>
            <Link
              href={`/dashboard/help#${step.helpAnchor}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
            >
              <BookOpen size={12} aria-hidden="true" /> More with pictures
            </Link>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white px-1">Back to checklist</Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setClosed(id)}
          className="p-1 -m-1 text-gray-500 hover:text-white"
          aria-label="Close tip"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

// Help page controls: bring the checklist back or start it over.
export function GuideControls() {
  const { user, state, setHidden, reset } = useGuide()
  if (!user || !state || stepsForRole(user.role).length === 0) return null
  const p = progress(state, user.role)
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-400">Getting started checklist: {p.done} of {p.total} done{state.hidden ? ', hidden' : ''}.</span>
      {state.hidden && (
        <button type="button" onClick={() => setHidden(false)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
          Show it on the Overview
        </button>
      )}
      {p.done > 0 && (
        <button type="button" onClick={reset} className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold">
          Start over
        </button>
      )}
    </div>
  )
}
