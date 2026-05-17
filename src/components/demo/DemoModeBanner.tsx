'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ChevronRight, Play, X } from 'lucide-react'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

const DEMO_STEPS = [
  {
    path: '/director/today',
    label: "Today's Academy",
    hint: 'Your morning anchor. Sessions on court, risk flags, and what needs attention.',
  },
  {
    path: '/director/sessions',
    label: 'Sessions',
    hint: 'Plan your week. Review session blocks and coach assignments.',
  },
  {
    path: '/director/level-up',
    label: 'Level Up Review',
    hint: `Evidence-based readiness. ${DONNA_PUBLIC_NAME} never moves a player automatically.`,
  },
  {
    path: '/director/parents',
    label: 'Parent Communications',
    hint: 'Draft and approve parent updates. Nothing sends without your approval.',
  },
  {
    path: '/director',
    label: `${DONNA_PUBLIC_NAME} Command Center`,
    hint: `Open the ${DONNA_PUBLIC_NAME} panel (✦ top-right) to explore the full executive command suite.`,
  },
]

function DemoModeBannerInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  if (searchParams.get('demo') !== '1') return null

  const stepIdx = DEMO_STEPS.findIndex(s =>
    s.path === '/director'
      ? pathname === '/director'
      : pathname === s.path || pathname.startsWith(s.path + '/'),
  )
  const currentStep = stepIdx >= 0 ? stepIdx : 0
  const step = DEMO_STEPS[currentStep]
  const isLast = currentStep === DEMO_STEPS.length - 1
  const nextStep = isLast ? null : DEMO_STEPS[currentStep + 1]

  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 shrink-0"
      style={{
        background: 'rgba(200,255,0,0.05)',
        borderBottom: '1px solid rgba(200,255,0,0.15)',
      }}
    >
      <Play className="w-3 h-3 text-lime shrink-0" />

      <div className="flex-1 min-w-0">
        <span className="text-[10px] uppercase tracking-widest text-lime font-semibold mr-2">
          {`Demo · Step ${currentStep + 1} of ${DEMO_STEPS.length}`}
        </span>
        <span className="text-[11px] font-semibold text-text-primary mr-1.5">
          {step?.label}
        </span>
        <span className="hidden sm:inline text-[11px] text-text-muted">
          {step?.hint}
        </span>
      </div>

      {!isLast && nextStep ? (
        <button
          type="button"
          onClick={() => router.push(`${nextStep.path}?demo=1`)}
          className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            background: 'rgba(200,255,0,0.1)',
            border: '1px solid rgba(200,255,0,0.2)',
            color: '#C8FF00',
          }}
        >
          Next: {nextStep.label}
          <ChevronRight className="w-3 h-3" />
        </button>
      ) : (
        <span className="shrink-0 text-[11px] font-semibold" style={{ color: '#C8FF00' }}>
          Tour complete ✓
        </span>
      )}

      <button
        type="button"
        onClick={() => router.push(pathname)}
        aria-label="Exit demo"
        className="shrink-0 p-1 rounded-lg hover:bg-surface-raised transition-colors"
      >
        <X className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
      </button>
    </div>
  )
}

export function DemoModeBanner() {
  return <DemoModeBannerInner />
}
