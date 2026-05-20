'use client'

import {
  ArrowLeft, Sparkles, CheckCircle2, Circle, ArrowRight,
  BookOpen, LayoutTemplate, Activity, Users, UserPlus, Eye, ArrowUpRight,
} from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { AcademyDnaSummaryCard } from '../AcademyDnaSummaryCard'

// ── DNA foundation checklist ──────────────────────────────────

interface ChecklistItem {
  id: string
  label: string
  desc: string
  route: string
  routeLabel: string
  required: boolean
  readyCheck: (draft: OnboardingDraft) => boolean
}

const CHECKLIST: ChecklistItem[] = [
  {
    id: 'academy-identity',
    label: 'Academy identity configured',
    desc: 'Academy name, age groups, and program model are set.',
    route: '/director',
    routeLabel: 'Director Dashboard',
    required: true,
    readyCheck: (d) => !!(d.academyName.trim() && d.ageGroups.length && d.academyModel),
  },
  {
    id: 'coaching-dna',
    label: 'Coaching DNA defined',
    desc: 'At least one coaching style and a primary communication voice are selected.',
    route: '/director',
    routeLabel: 'Director Dashboard',
    required: true,
    readyCheck: (d) => !!(d.coachingStyles.length && d.primaryCommunication),
  },
  {
    id: 'session-structure',
    label: 'Default session structure set',
    desc: 'Session blocks and development priorities are configured.',
    route: '/director',
    routeLabel: 'Director Dashboard',
    required: false,
    readyCheck: (d) => !!(d.sessionBlocks.length && d.developmentPriorities.length),
  },
  {
    id: 'parent-experience',
    label: 'Parent experience configured',
    desc: 'Parent communication style and privacy rules are set.',
    route: '/director',
    routeLabel: 'Director Dashboard',
    required: false,
    readyCheck: (d) => !!(d.parentStyles.length),
  },
  {
    id: 'privacy-rules',
    label: 'Parent privacy rules active',
    desc: 'At least 3 parent visibility rules are protecting sensitive data.',
    route: '/director',
    routeLabel: 'Director Dashboard',
    required: true,
    readyCheck: (d) => Object.values(d.parentVisibilityRules).filter(Boolean).length >= 3,
  },
]

// ── Next-steps card grid ──────────────────────────────────────

interface NextStepCard {
  id: string
  Icon: typeof BookOpen
  label: string
  desc: string
  href: string | null
  status: string
  statusStyle: string
  iconStyle: string
  ctaLabel: string
}

const NEXT_STEP_CARDS: NextStepCard[] = [
  {
    id: 'curriculum',
    Icon: BookOpen,
    label: 'Review Curriculum',
    desc: 'Review the curriculum structure DONNA will use as the foundation for your academy.',
    href: '/director/curriculum',
    status: 'Next setup task',
    statusStyle: 'bg-lime/8 border-lime/20 text-lime',
    iconStyle: 'text-lime',
    ctaLabel: 'Review',
  },
  {
    id: 'class-template',
    Icon: LayoutTemplate,
    label: 'Create Class Template',
    desc: 'Build a coach-ready class template from your Academy DNA.',
    href: '/director/class-templates/new',
    status: 'Draft',
    statusStyle: 'bg-status-blue/8 border-status-blue/20 text-status-blue',
    iconStyle: 'text-status-blue',
    ctaLabel: 'Create draft',
  },
  {
    id: 'fitness-template',
    Icon: Activity,
    label: 'Create Fitness Template',
    desc: 'Build a fitness template with movement, speed, agility, plyometrics, strength, and recovery blocks.',
    href: '/director/fitness/templates/new',
    status: 'Draft',
    statusStyle: 'bg-status-blue/8 border-status-blue/20 text-status-blue',
    iconStyle: 'text-status-blue',
    ctaLabel: 'Create draft',
  },
  {
    id: 'players',
    Icon: Users,
    label: 'Upload Players',
    desc: 'Add players to start tracking development after the academy foundation is saved.',
    href: '/director/players',
    status: 'Setup later',
    statusStyle: 'bg-surface-raised border-border text-text-muted',
    iconStyle: 'text-text-muted',
    ctaLabel: 'Go to Players',
  },
  {
    id: 'coaches',
    Icon: UserPlus,
    label: 'Add Coaches',
    desc: 'Set up coaches and configure future workflow defaults.',
    href: '/director/coaches',
    status: 'Setup later',
    statusStyle: 'bg-surface-raised border-border text-text-muted',
    iconStyle: 'text-text-muted',
    ctaLabel: 'Go to Coaches',
  },
  {
    id: 'portal-preview',
    Icon: Eye,
    label: 'Preview Portals',
    desc: 'Preview what parents and players will see in their portals.',
    href: null,
    status: 'Coming next',
    statusStyle: 'bg-surface-raised border-border text-text-muted/50',
    iconStyle: 'text-text-muted/40',
    ctaLabel: 'Not available yet',
  },
]

// ── Component ─────────────────────────────────────────────────

interface Props {
  draft: OnboardingDraft
  onPrev: () => void
  onEditStep: (stepIndex: number) => void
}

export function ActivationChecklistStep({ draft, onPrev, onEditStep }: Props) {
  const items         = CHECKLIST.map(item => ({ ...item, ready: item.readyCheck(draft) }))
  const requiredReady = items.filter(i => i.required && i.ready).length
  const requiredTotal = items.filter(i => i.required).length
  const totalReady    = items.filter(i => i.ready).length
  const canActivate   = requiredReady === requiredTotal

  const dnaPills: string[] = [
    ...draft.coachingStyles,
    ...draft.sessionBlocks,
    ...draft.developmentPriorities,
  ].slice(0, 6)

  return (
    <div>

      {/* Celebration header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-lime" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-lime/70 mb-0.5">
              Step 10 of 10 — DNA Ready
            </p>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              Your Academy DNA is ready.
            </h2>
          </div>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Your foundation is set. Review curriculum, build templates, and continue setup below.
        </p>
      </div>

      {/* DONNA message bubble */}
      <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
          <span className="font-bold text-lime text-[13px] leading-none select-none">D</span>
        </div>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Academy DNA is captured. Use the cards below to continue setup — curriculum, templates, and team configuration are ready when you are. Nothing is published until you decide to activate each piece.
        </p>
      </div>

      {/* DNA pill strip */}
      {dnaPills.length > 0 && (
        <div className="mb-6">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
            Academy DNA captured
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dnaPills.map(pill => (
              <span
                key={pill}
                className="inline-flex items-center px-2 py-1 rounded-md bg-surface-raised border border-border text-[10px] text-text-secondary capitalize"
              >
                {pill.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Continue Setup card grid */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Continue Setup
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {NEXT_STEP_CARDS.map(card => {
            const { Icon } = card
            const isActive = card.href !== null

            const cardInner = (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className={[
                    'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
                    isActive ? 'bg-surface-raised border-border' : 'bg-surface border-border/50',
                  ].join(' ')}>
                    <Icon className={['w-4 h-4', card.iconStyle].join(' ')} />
                  </div>
                  <span className={[
                    'text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border',
                    card.statusStyle,
                  ].join(' ')}>
                    {card.status}
                  </span>
                </div>
                <p className={[
                  'text-xs font-semibold mb-1 transition-colors',
                  isActive ? 'text-text-secondary group-hover:text-text-primary' : 'text-text-muted/60',
                ].join(' ')}>
                  {card.label}
                </p>
                <p className={[
                  'text-[10px] leading-snug mb-3 flex-1',
                  isActive ? 'text-text-muted' : 'text-text-muted/40',
                ].join(' ')}>
                  {card.desc}
                </p>
                <div className="flex items-center gap-1 mt-auto">
                  {isActive ? (
                    <>
                      <span className="text-[10px] font-medium text-text-muted group-hover:text-lime transition-colors">
                        {card.ctaLabel}
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-text-muted group-hover:text-lime transition-colors" />
                    </>
                  ) : (
                    <span className="text-[10px] font-medium text-text-muted/30">{card.ctaLabel}</span>
                  )}
                </div>
              </>
            )

            if (card.href !== null) {
              return (
                <a
                  key={card.id}
                  href={card.href}
                  className="group rounded-xl border border-border bg-surface hover:border-border-strong hover:bg-surface-raised px-4 py-3.5 transition-all flex flex-col"
                >
                  {cardInner}
                </a>
              )
            }
            return (
              <div
                key={card.id}
                className="rounded-xl border border-border/50 bg-surface/50 px-4 py-3.5 flex flex-col opacity-60"
              >
                {cardInner}
              </div>
            )
          })}
        </div>
      </div>

      {/* DNA Readiness summary card */}
      <div className="mb-6">
        <AcademyDnaSummaryCard draft={draft} onEditStep={onEditStep} compact />
      </div>

      {/* DNA Foundation Check */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            DNA Foundation Check
          </p>
          <span className="text-[11px] font-mono text-text-muted">
            <span className={totalReady > 0 ? 'text-lime' : ''}>{totalReady}</span>/{items.length} complete
          </span>
        </div>

        <div className="rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border">
          {items.map(item => (
            <div
              key={item.id}
              className={[
                'flex items-start gap-3 px-4 py-3.5 transition-colors',
                item.ready ? 'bg-lime/3' : '',
              ].join(' ')}
            >
              {item.ready
                ? <CheckCircle2 className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                : <Circle className="w-4 h-4 text-border-strong shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={[
                    'text-xs font-semibold',
                    item.ready ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {item.label}
                  </p>
                  {item.required && !item.ready && (
                    <span className="text-[8px] font-bold uppercase tracking-wide text-status-orange bg-status-orange/8 border border-status-orange/20 rounded px-1.5 py-0.5">
                      Required
                    </span>
                  )}
                  {item.ready && (
                    <span className="text-[8px] font-bold uppercase tracking-wide text-lime bg-lime/8 border border-lime/20 rounded px-1.5 py-0.5">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DNA status banner */}
      <div className={[
        'mb-8 rounded-2xl border px-5 py-4',
        canActivate ? 'bg-lime/5 border-lime/20' : 'bg-surface border-border',
      ].join(' ')}>
        <div className="flex items-start gap-3">
          <Sparkles className={[
            'w-4 h-4 shrink-0 mt-0.5',
            canActivate ? 'text-lime' : 'text-text-muted',
          ].join(' ')} />
          <div>
            {canActivate ? (
              <>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Academy DNA is complete.
                </p>
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  All required DNA fields are set. Head to the Director Dashboard to continue with curriculum, templates, players, and coaches.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-secondary mb-1">
                  {requiredTotal - requiredReady} required item{requiredTotal - requiredReady > 1 ? 's' : ''} remaining
                </p>
                <p className="text-[12px] text-text-muted leading-relaxed">
                  Complete the required DNA fields above. Go back to any step to fill in missing details.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <a
          href="/director"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime text-base font-semibold text-sm hover:brightness-110 shadow-lime transition-all"
        >
          Go to Director Dashboard
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <p className="mt-4 text-[10px] text-text-muted/40 text-center">
        Your Academy DNA is saved to your draft. Settings are applied when you complete setup in the Director Dashboard.
      </p>

    </div>
  )
}
