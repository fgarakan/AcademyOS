'use client'

import { ArrowLeft, Sparkles, CheckCircle2, Circle, ExternalLink, Zap } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { AcademyDnaSummaryCard } from '../AcademyDnaSummaryCard'

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
    route: '/parent',
    routeLabel: 'Parent Portal',
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
  {
    id: 'player-mission',
    label: 'Player mission style set',
    desc: 'Default player portal framing is configured.',
    route: '/player',
    routeLabel: 'Player Portal',
    required: false,
    readyCheck: (d) => !!d.playerMissionStyle,
  },
  {
    id: 'first-player',
    label: 'Add your first player',
    desc: 'Import or manually add at least one player to start tracking development.',
    route: '/director/players',
    routeLabel: 'Players',
    required: false,
    readyCheck: () => false,
  },
  {
    id: 'first-session',
    label: 'Schedule your first session',
    desc: 'Create a session using your new default template.',
    route: '/director/sessions',
    routeLabel: 'Sessions',
    required: false,
    readyCheck: () => false,
  },
]

interface Props {
  draft: OnboardingDraft
  onPrev: () => void
  onEditStep: (stepIndex: number) => void
}

export function ActivationChecklistStep({ draft, onPrev, onEditStep }: Props) {
  const items          = CHECKLIST.map(item => ({ ...item, ready: item.readyCheck(draft) }))
  const requiredReady  = items.filter(i => i.required && i.ready).length
  const requiredTotal  = items.filter(i => i.required).length
  const totalReady     = items.filter(i => i.ready).length
  const canActivate    = requiredReady === requiredTotal

  // Build DNA pill values from draft
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
              Step 12 of 12 — Activate
            </p>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              Your academy foundation is ready.
            </h2>
          </div>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Complete these steps to launch your starting operating system.
        </p>
      </div>

      {/* DONNA message bubble */}
      <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
          <span className="font-bold text-lime text-[13px] leading-none select-none">D</span>
        </div>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Your Academy DNA is drafted. Review the checklist below — required items unlock activation. Optional items can be completed after launch.
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

      {/* Readiness summary */}
      <div className="mb-6">
        <AcademyDnaSummaryCard draft={draft} onEditStep={onEditStep} compact />
      </div>

      {/* Checklist */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Continue Setup
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
              <a
                href={item.route}
                className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-text-muted hover:text-lime transition-colors px-2 py-1 rounded-lg hover:bg-lime/8 border border-transparent hover:border-lime/20 mt-0.5"
              >
                {item.routeLabel}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Activation status */}
      <div className={[
        'mb-8 rounded-2xl border px-5 py-4',
        canActivate
          ? 'bg-lime/5 border-lime/20'
          : 'bg-surface border-border',
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
                  Ready to activate your starting system.
                </p>
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  All required fields are complete. DONNA will prepare your curriculum defaults, session templates, coach cue library, and portal defaults when you activate.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-secondary mb-1">
                  {requiredTotal - requiredReady} required item{requiredTotal - requiredReady > 1 ? 's' : ''} remaining
                </p>
                <p className="text-[12px] text-text-muted leading-relaxed">
                  Complete the required checklist items above to unlock activation. Go back to any step to fill in missing details.
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
        <button
          disabled={!canActivate}
          className={[
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all',
            canActivate
              ? 'bg-lime text-base hover:brightness-110 shadow-lime cursor-pointer'
              : 'bg-surface border border-border text-text-muted cursor-not-allowed',
          ].join(' ')}
        >
          <Zap className="w-4 h-4" />
          Activate Starting System
        </button>
        {!canActivate && (
          <span className="text-[10px] text-text-muted">
            Complete required items first
          </span>
        )}
      </div>

      <p className="mt-4 text-[10px] text-text-muted/40 text-center">
        Activation will apply your Academy DNA settings to your AcademyOS account.
        Nothing has been saved or applied yet.
      </p>
    </div>
  )
}
