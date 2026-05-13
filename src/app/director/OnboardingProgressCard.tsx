import Link from 'next/link'
import { Rocket, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

const ONBOARDING_STEPS = [
  {
    title: 'Academy Identity',
    description: 'Set your academy name, location, timezone, logo, and description.',
    key: 'academy_identity_completed',
    href: '/director/settings',
  },
  {
    title: 'Academy Setup Assistant',
    description: 'Customize how Academy OS understands your curriculum, workflow, and player pathways.',
    key: 'director_interview_completed',
    href: '/director/onboarding/interview',
  },
  {
    title: 'Curriculum Setup',
    description: 'Select or customize a curriculum spine for your academy.',
    key: 'curriculum_setup_completed',
    href: '/director/onboarding/curriculum',
  },
  {
    title: 'Level Gates + Promotion Rules',
    description: 'Configure how players move between levels.',
    key: 'level_gates_completed',
    href: '/director/onboarding/level-gates',
  },
  {
    title: 'Programs + Groups',
    description: 'Define how training programs and player groups are structured.',
    key: 'programs_groups_completed',
    href: '/director/onboarding/programs-groups',
  },
  {
    title: 'Coaches + Permissions',
    description: 'Define how your coaching team operates inside Academy OS.',
    key: 'coaches_permissions_completed',
    href: '/director/onboarding/coaches-permissions',
  },
  {
    title: 'Players + Placement',
    description: 'Define how players are added and placed into the academy.',
    key: 'players_placement_completed',
    href: '/director/onboarding/players-placement',
  },
] as const

interface Props {
  settings: Record<string, unknown>
}

export function OnboardingProgressCard({ settings }: Props) {
  const completedCount = ONBOARDING_STEPS.filter(s => settings[s.key] === true).length
  const total = ONBOARDING_STEPS.length
  const progressPct = Math.round((completedCount / total) * 100)
  const allComplete = completedCount === total
  const nextStep = ONBOARDING_STEPS.find(s => settings[s.key] !== true) ?? null

  if (allComplete) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-green/5 border border-status-green/20">
        <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-status-green">Core setup complete</p>
          <p className="text-xs text-text-secondary mt-0.5">
            All 7 onboarding steps are done. Academy OS is ready to generate better recommendations for your academy.
          </p>
        </div>
        <Link
          href="/director/onboarding"
          className="shrink-0 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors whitespace-nowrap"
        >
          Review Onboarding →
        </Link>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="py-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-semibold text-text-primary">Academy Onboarding</p>
          </div>
          <p className="text-xs font-mono text-text-muted tabular-nums shrink-0">
            {completedCount} / {total} steps complete
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-lime rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
          Finish setup so Academy OS can generate better recommendations for your academy.
        </p>

        {/* Next step callout */}
        {nextStep && (
          <div className="px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/15 mb-4">
            <p className="text-[10px] font-semibold text-lime/70 uppercase tracking-wider mb-0.5">
              Next step
            </p>
            <p className="text-xs font-semibold text-text-primary leading-tight">
              {nextStep.title}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              {nextStep.description}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/director/onboarding"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-lime text-base hover:bg-lime/90 transition-colors"
          >
            Continue Curriculum Setup
            <ArrowRight className="w-3 h-3" />
          </Link>
          {nextStep && (
            <Link
              href={nextStep.href}
              className="text-xs font-medium text-lime/80 hover:text-lime transition-colors"
            >
              Go directly to {nextStep.title} →
            </Link>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
