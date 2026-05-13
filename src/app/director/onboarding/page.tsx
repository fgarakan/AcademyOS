import Link from 'next/link'
import { ArrowLeft, Rocket, CheckCircle2, ArrowRight, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { AnimatedOnboardingDeck } from './AnimatedOnboardingDeck'

// ── Step definitions ───────────────────────────────────────────

interface StepDef {
  number: number
  title: string
  description: string
  unlockCopy?: string
  settingsKey?: string
  href?: string
  ctaLabel?: string
}

const STEP_DEFS: StepDef[] = [
  {
    number: 1,
    title: 'Academy Identity',
    description: 'Set your academy name, location, timezone, logo URL, website, and description.',
    unlockCopy: 'Unlocks academy identity and setup context.',
    settingsKey: 'academy_identity_completed',
    href: '/director/settings',
    ctaLabel: 'Open Academy Settings',
  },
  {
    number: 2,
    title: 'Academy Setup Assistant',
    description: 'Customize how Academy OS understands your curriculum, coaching workflow, and player pathways.',
    unlockCopy: 'Unlocks personalized setup guidance.',
    settingsKey: 'director_interview_completed',
    href: '/director/onboarding/interview',
    ctaLabel: 'Start Guided Setup',
  },
  {
    number: 3,
    title: 'Curriculum Setup',
    description: 'Select or customize a curriculum spine. Define training levels, skill domains, and session structure.',
    unlockCopy: 'Unlocks player levels, curriculum builder, and session planning structure.',
    settingsKey: 'curriculum_setup_completed',
    href: '/director/onboarding/curriculum',
    ctaLabel: 'Choose Curriculum Starter',
  },
  {
    number: 4,
    title: 'Level Gates + Promotion Rules',
    description: 'Configure how players move between levels. Set criteria, evidence requirements, and director approval flows.',
    unlockCopy: 'Unlocks player grouping and placement logic.',
    settingsKey: 'level_gates_completed',
    href: '/director/onboarding/level-gates',
    ctaLabel: 'Set Level Gate Rules',
  },
  {
    number: 5,
    title: 'Programs + Groups',
    description: 'Create training programs and player groups. Define capacity, age ranges, and level assignments.',
    unlockCopy: 'Unlocks program capacity, age ranges, and group structure.',
    settingsKey: 'programs_groups_completed',
    href: '/director/onboarding/programs-groups',
    ctaLabel: 'Set Up Programs + Groups',
  },
  {
    number: 6,
    title: 'Coaches + Permissions',
    description: 'Invite your coaching staff and assign roles. Set access levels for head coaches and assistant coaches.',
    unlockCopy: 'Unlocks coach session clarity and recap structure.',
    settingsKey: 'coaches_permissions_completed',
    href: '/director/onboarding/coaches-permissions',
    ctaLabel: 'Set Up Coaches + Permissions',
  },
  {
    number: 7,
    title: 'Players + Placement',
    description: 'Import your roster and run the placement engine. Assign each player to their starting level and group.',
    unlockCopy: 'Unlocks player profiles, development tracking, and real academy usage.',
    settingsKey: 'players_placement_completed',
    href: '/director/onboarding/players-placement',
    ctaLabel: 'Set Up Players + Placement',
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

  // Completion state — unchanged
  const completedStepNumbers = new Set<number>()
  if (settings.academy_identity_completed === true) completedStepNumbers.add(1)
  if (settings.director_interview_completed === true) completedStepNumbers.add(2)
  if (settings.curriculum_setup_completed === true) completedStepNumbers.add(3)
  if (settings.level_gates_completed === true) completedStepNumbers.add(4)
  if (settings.programs_groups_completed === true) completedStepNumbers.add(5)
  if (settings.coaches_permissions_completed === true) completedStepNumbers.add(6)
  if (settings.players_placement_completed === true) completedStepNumbers.add(7)

  // Assign status: complete → next (first incomplete) → upcoming — unchanged
  let nextAssigned = false
  const stepStatuses: StepStatus[] = STEP_DEFS.map(step => {
    if (completedStepNumbers.has(step.number)) return 'complete'
    if (!nextAssigned) { nextAssigned = true; return 'next' }
    return 'upcoming'
  })

  const completedCount = completedStepNumbers.size
  const totalSteps = 7  // steps 1–7 are the active setup phase; 8–12 are coming later
  const progressPct = Math.round((completedCount / totalSteps) * 100)

  const nextStepIndex = stepStatuses.indexOf('next')
  const nextStep = nextStepIndex >= 0 ? STEP_DEFS[nextStepIndex] : null

  // Visual group slices — data model unchanged
  const group1 = STEP_DEFS.slice(0, 3)   // Start Here: steps 1–3
  const group2 = STEP_DEFS.slice(3, 6)   // Build Your OS: steps 4–6
  const group3 = STEP_DEFS.slice(6, 7)   // Launch: step 7
  const advanced = STEP_DEFS.slice(7)    // Later: steps 8–12

  const group1Done = group1.filter(s => completedStepNumbers.has(s.number)).length
  const group2Done = group2.filter(s => completedStepNumbers.has(s.number)).length
  const group3Done = group3.filter(s => completedStepNumbers.has(s.number)).length

  return (
    <div className="animate-fade-in p-6 space-y-5 max-w-2xl">

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
          Start with the essentials. Academy OS will guide you one step at a time.
        </p>
      </div>

      {/* ── Animated overview deck — unchanged ── */}
      <AnimatedOnboardingDeck
        nextStepHref={nextStep?.href ?? '/director/onboarding/interview'}
        nextStepLabel={nextStep?.ctaLabel ?? 'Continue Setup'}
        completedCount={completedCount}
      />

      {/* ── Next Best Step — the primary action on the page ── */}
      {nextStep ? (
        <div className="rounded-xl border border-lime/30 bg-lime/5 px-5 py-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-lime/60 mb-2">
            Next Best Step
          </p>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-snug">
                {nextStep.title}
              </p>
              <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
                {nextStep.description}
              </p>
              {nextStep.unlockCopy && (
                <p className="text-[11px] text-text-muted mt-1.5">
                  <span className="text-lime/60 font-medium">Unlocks:</span>{' '}
                  {nextStep.unlockCopy}
                </p>
              )}
            </div>
            {nextStep.href && (
              <Link
                href={nextStep.href}
                className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2.5 rounded-lg bg-lime hover:brightness-110 transition-all"
                style={{ color: '#030506' }}
              >
                {nextStep.ctaLabel}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 h-1 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-lime/50 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="shrink-0 text-[10px] font-mono text-text-muted/60 tabular-nums">
              {completedCount} / {totalSteps}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-status-green/30 bg-status-green/5 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-status-green" />
            <p className="text-sm font-semibold text-text-primary">Core setup complete</p>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed">
            All 7 core setup steps are complete. Academy OS is ready to use.
          </p>
          <Link
            href="/director"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors mt-2"
          >
            Go to Dashboard
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      )}

      {/* ── Group 1: Start Here — primary weight ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-secondary">
            Start Here
          </p>
          <p className="text-[10px] font-mono text-text-muted tabular-nums">
            {group1Done} / {group1.length}
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            {group1.map((step, i) => {
              const status = stepStatuses[i]
              return (
                <div
                  key={step.number}
                  className="flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-b-0"
                >
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <p className={`text-xs font-medium leading-tight ${
                        status === 'next' ? 'text-text-primary' :
                        status === 'complete' ? 'text-text-secondary' :
                        'text-text-muted'
                      }`}>
                        {step.title}
                        {status === 'complete' && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-status-green/10 text-status-green text-[10px] font-semibold">
                            Complete
                          </span>
                        )}
                      </p>
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
                    {status === 'next' && (
                      <>
                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                        {step.unlockCopy && (
                          <p className="text-[10px] text-text-muted/60 mt-1">
                            <span className="text-lime/50 font-medium">Unlocks:</span>{' '}
                            {step.unlockCopy}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      {/* ── Group 2: Build Your Operating System — secondary weight ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
            Build Your Operating System
          </p>
          <p className="text-[10px] font-mono text-text-muted/60 tabular-nums">
            {group2Done} / {group2.length}
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            {group2.map((step, i) => {
              const status = stepStatuses[3 + i]
              return (
                <div
                  key={step.number}
                  className={`flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0${
                    status === 'upcoming' ? ' opacity-50' : ''
                  }`}
                >
                  <div className="shrink-0 w-5 flex items-center justify-center">
                    {status === 'complete' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                    ) : status === 'next' ? (
                      <div className="w-4 h-4 rounded-full border border-lime bg-lime/10 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-lime leading-none">{step.number}</span>
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center">
                        <span className="text-[8px] font-mono text-text-muted leading-none">{step.number}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-medium leading-tight ${
                          status === 'next' ? 'text-text-primary' :
                          status === 'complete' ? 'text-text-secondary' :
                          'text-text-muted'
                        }`}>
                          {step.title}
                        </p>
                        {status === 'next' && step.unlockCopy && (
                          <p className="text-[10px] text-text-muted/60 mt-0.5">
                            <span className="text-lime/50">Unlocks:</span>{' '}
                            {step.unlockCopy}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {status === 'complete' && (
                          <span className="text-[10px] text-status-green/80 font-medium">Complete</span>
                        )}
                        {status === 'complete' && step.href && (
                          <Link
                            href={step.href}
                            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                          >
                            Revisit →
                          </Link>
                        )}
                        {status === 'next' && step.href && (
                          <Link
                            href={step.href}
                            className="text-[11px] font-medium text-lime hover:opacity-80 transition-opacity whitespace-nowrap"
                          >
                            {step.ctaLabel} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      {/* ── Group 3: Launch — least weight among active groups ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted/60">
            Launch Your First Operating Version
          </p>
          <p className="text-[10px] font-mono text-text-muted/40 tabular-nums">
            {group3Done} / {group3.length}
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            {group3.map((step, i) => {
              const status = stepStatuses[6 + i]
              return (
                <div
                  key={step.number}
                  className={`flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0${
                    status === 'upcoming' ? ' opacity-40' : ''
                  }`}
                >
                  <div className="shrink-0 w-5 flex items-center justify-center">
                    {status === 'complete' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                    ) : status === 'next' ? (
                      <div className="w-4 h-4 rounded-full border border-lime bg-lime/10 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-lime leading-none">{step.number}</span>
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-border/60 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-text-muted/50 leading-none">{step.number}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-medium leading-tight ${
                          status === 'next' ? 'text-text-secondary' :
                          status === 'complete' ? 'text-text-secondary' :
                          'text-text-muted/60'
                        }`}>
                          {step.title}
                        </p>
                        {status === 'next' && step.unlockCopy && (
                          <p className="text-[10px] text-text-muted/60 mt-0.5">
                            <span className="text-lime/50">Unlocks:</span>{' '}
                            {step.unlockCopy}
                          </p>
                        )}
                      </div>
                      {status === 'next' && step.href && (
                        <Link
                          href={step.href}
                          className="shrink-0 text-[11px] font-medium text-lime/70 hover:opacity-80 transition-opacity whitespace-nowrap"
                        >
                          {step.ctaLabel} →
                        </Link>
                      )}
                      {status === 'complete' && step.href && (
                        <Link
                          href={step.href}
                          className="shrink-0 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                        >
                          Revisit →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      {/* ── Advanced setup — collapsed by default, clearly later ── */}
      <details>
        <summary className="flex items-center gap-2 cursor-pointer select-none list-none px-1 py-1">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted/40">
            Advanced setup — later
          </p>
        </summary>
        <div className="mt-2">
          <p className="text-[11px] text-text-muted/50 px-1 mb-2 leading-relaxed">
            These steps become useful after your first operating version is active.
          </p>
          <Card>
            <CardContent className="p-0">
              {advanced.map((step) => (
                <div
                  key={step.number}
                  className="flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0 opacity-40"
                >
                  <div className="shrink-0 w-5 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full border border-border/50 flex items-center justify-center">
                      <span className="text-[8px] font-mono text-text-muted/60 leading-none">{step.number}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-text-muted leading-tight">{step.title}</p>
                    <p className="text-[10px] text-text-muted/70 mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </details>

      {/* ── AI note ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          AI-assisted setup and voice-guided onboarding will plug into this flow as each phase
          becomes available.
        </span>
      </div>

    </div>
  )
}
