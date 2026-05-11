import Link from 'next/link'
import { ArrowLeft, Rocket, CheckCircle2, ArrowRight, Info, Lock } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'

// ── Step definitions ───────────────────────────────────────────

interface StepDef {
  number: number
  title: string
  description: string
  settingsKey?: string
  href?: string
  ctaLabel?: string
}

const STEP_DEFS: StepDef[] = [
  {
    number: 1,
    title: 'Academy Identity',
    description: 'Set your academy name, location, timezone, logo URL, website, and description.',
    settingsKey: 'academy_identity_completed',
    href: '/director/settings',
    ctaLabel: 'Open Academy Settings',
  },
  {
    number: 2,
    title: 'Director Interview',
    description: 'Answer a short set of questions about your coaching philosophy, academy goals, and player development approach. Your answers power AI recommendations.',
    settingsKey: 'director_interview_completed',
    href: '/director/onboarding/interview',
    ctaLabel: 'Start Director Interview',
  },
  {
    number: 3,
    title: 'Curriculum Setup',
    description: 'Select or customize a curriculum spine for your academy. Define training levels, skill domains, and session structure.',
    settingsKey: 'curriculum_setup_completed',
    href: '/director/onboarding/curriculum',
    ctaLabel: 'Choose Curriculum Starter',
  },
  {
    number: 4,
    title: 'Level Gates + Promotion Rules',
    description: 'Configure how players move between levels. Set criteria, evidence requirements, and director approval flows.',
    settingsKey: 'level_gates_completed',
    href: '/director/onboarding/level-gates',
    ctaLabel: 'Set Level Gate Rules',
  },
  {
    number: 5,
    title: 'Programs + Groups',
    description: 'Create training programs and player groups. Define capacity, age ranges, and level assignments.',
    settingsKey: 'programs_groups_completed',
    href: '/director/onboarding/programs-groups',
    ctaLabel: 'Set Up Programs + Groups',
  },
  {
    number: 6,
    title: 'Coaches + Permissions',
    description: 'Invite your coaching staff and assign roles. Set access levels for head coaches and assistant coaches.',
    settingsKey: 'coaches_permissions_completed',
    href: '/director/onboarding/coaches-permissions',
    ctaLabel: 'Set Up Coaches + Permissions',
  },
  {
    number: 7,
    title: 'Players + Placement',
    description: 'Import your roster and run the placement engine. Assign each player to their starting level and group.',
  },
  {
    number: 8,
    title: 'Portal Visibility',
    description: 'Control what parents and players can see. Configure which development data, session notes, and progress reports are visible.',
  },
  {
    number: 9,
    title: 'Communication Style',
    description: 'Set the tone and frequency of automated communication. Choose how the system addresses players and parents.',
  },
  {
    number: 10,
    title: 'Session Templates',
    description: 'Build your first class templates. Each template becomes a reusable coaching blueprint tied to your curriculum.',
  },
  {
    number: 11,
    title: 'Demo Week',
    description: 'Run a simulated week of sessions. See how coach wrap-ups, director review, and parent and player clarity work together.',
  },
  {
    number: 12,
    title: 'Launch Checklist',
    description: 'Final review before going live. Confirm all required steps are complete and activate the academy operating system.',
  },
]

type StepStatus = 'complete' | 'next' | 'upcoming'

// ── Page ───────────────────────────────────────────────────────

export default async function AcademyOnboardingPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access onboarding.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">
          Academy onboarding is only available to academy directors.
        </p>
      </div>
    )
  }

  const rawDb = supabase as any
  const { data: academy } = await rawDb
    .from('academies')
    .select('id, name, settings')
    .eq('id', academyId)
    .single()

  if (!academy) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy not found.</p>
      </div>
    )
  }

  const settings = (academy.settings as Record<string, unknown>) ?? {}

  // Completion state — one entry per step that has a detectable settings key
  const completedStepNumbers = new Set<number>()
  if (settings.academy_identity_completed === true) completedStepNumbers.add(1)
  if (settings.director_interview_completed === true) completedStepNumbers.add(2)
  if (settings.curriculum_setup_completed === true) completedStepNumbers.add(3)
  if (settings.level_gates_completed === true) completedStepNumbers.add(4)
  if (settings.programs_groups_completed === true) completedStepNumbers.add(5)
  if (settings.coaches_permissions_completed === true) completedStepNumbers.add(6)

  // Assign status: complete → next (first incomplete) → upcoming
  let nextAssigned = false
  const stepStatuses: StepStatus[] = STEP_DEFS.map(step => {
    if (completedStepNumbers.has(step.number)) return 'complete'
    if (!nextAssigned) { nextAssigned = true; return 'next' }
    return 'upcoming'
  })

  const completedCount = completedStepNumbers.size
  const totalSteps = STEP_DEFS.length
  const progressPct = Math.round((completedCount / totalSteps) * 100)

  const nextStepIndex = stepStatuses.indexOf('next')
  const nextStep = nextStepIndex >= 0 ? STEP_DEFS[nextStepIndex] : null

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl">

      <Link
        href="/director"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      {/* ── Page header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Setup</p>
        </div>
        <h1 className="page-title">Academy Onboarding</h1>
        <p className="page-subtitle">
          Set up your academy operating system step by step. The system will help you configure
          identity, curriculum, programs, people, portals, and launch readiness.
        </p>
      </div>

      {/* ── Progress summary ── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-secondary">Setup Progress</p>
            <p className="text-xs font-mono text-text-muted tabular-nums">
              {completedCount} / {totalSteps} steps complete
            </p>
          </div>
          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-lime rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {nextStep ? (
            <p className="text-[11px] text-text-muted mt-2">
              <span className="text-lime/70">Next:</span>{' '}
              {nextStep.title}
            </p>
          ) : (
            <p className="text-[11px] text-status-green font-medium mt-2">
              All setup steps complete.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Next step CTA (only when step has a navigable href) ── */}
      {nextStep?.href && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border bg-lime/5 border-lime/20">
          <Rocket className="w-4 h-4 text-lime shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-lime leading-snug">
              Next Step: {nextStep.title}
            </p>
            <p className="text-[11px] mt-0.5 leading-relaxed text-text-secondary">
              {nextStep.description}
            </p>
          </div>
          <Link
            href={nextStep.href}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-lime text-base hover:bg-lime/90 transition-colors"
          >
            {nextStep.ctaLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── Step list ── */}
      <Card>
        <CardContent className="p-0">
          {STEP_DEFS.map((step, idx) => {
            const status = stepStatuses[idx]
            return (
              <div
                key={step.number}
                className="flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-b-0"
              >
                {/* Status indicator */}
                <div className="shrink-0 mt-0.5 w-5 flex items-center justify-center">
                  {status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-status-green" />
                  ) : status === 'next' ? (
                    <div className="w-4 h-4 rounded-full border border-lime bg-lime/10 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-lime leading-none">{step.number}</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center">
                      <span className="text-[9px] font-mono text-text-muted leading-none">{step.number}</span>
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className={`text-xs font-medium leading-tight ${
                      status === 'next' ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      {step.title}
                      {status === 'complete' && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-status-green/10 text-status-green text-[10px] font-semibold">
                          Complete
                        </span>
                      )}
                    </p>

                    {/* Right badge / link */}
                    {status === 'upcoming' && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] text-text-muted px-1.5 py-0.5 rounded-md bg-surface-raised border border-border">
                        <Lock className="w-2.5 h-2.5" />
                        Coming Soon
                      </span>
                    )}
                    {status === 'complete' && step.href && (
                      <Link
                        href={step.href}
                        className="shrink-0 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Revisit →
                      </Link>
                    )}
                    {status === 'next' && step.href && (
                      <Link
                        href={step.href}
                        className="shrink-0 text-[11px] font-medium text-lime hover:opacity-80 transition-opacity"
                      >
                        {step.ctaLabel} →
                      </Link>
                    )}
                  </div>

                  {status !== 'complete' && (
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── AI note ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          AI-assisted setup and voice-guided onboarding will plug into this flow as each phase
          becomes available. Steps marked Coming Soon will be unlocked in future releases.
        </span>
      </div>

    </div>
  )
}
