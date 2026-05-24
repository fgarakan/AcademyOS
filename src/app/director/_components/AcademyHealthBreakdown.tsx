'use client'

import { useState } from 'react'
import { X, ShieldCheck, TrendingUp, TrendingDown, Target, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ── Props ──────────────────────────────────────────────────────────

export interface AcademyHealthBadgeProps {
  healthPct: number
  activePlayers: number
  pendingWrapUpsCount: number
  attentionCount: number
  reassessmentDueCount: number
  missingFocusCount: number
  newRequestsCount: number
  pendingCount: number
  playersWithoutLevel: number
  curricGapCount: number
  highPrioritySuggestionsCount: number
  pendingSuggestionsCount: number
  sessionsThisWeek: number
  improvingCount: number
  advancementReadyCount: number
}

// ── Color helpers ──────────────────────────────────────────────────

function scoreTextColor(score: number): string {
  if (score >= 80) return 'text-teal-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-[#FF3B30]'
}

function scoreBgColor(score: number): string {
  if (score >= 80) return 'bg-teal-400'
  if (score >= 60) return 'bg-yellow-400'
  return 'bg-[#FF3B30]'
}

function statusLabel(score: number): string {
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Needs Attention'
  return 'At Risk'
}

// ── Category scoring ───────────────────────────────────────────────

interface CategoryScore {
  name: string
  score: number
  weight: number
  explanation: string
}

function computeCategories(d: AcademyHealthBadgeProps): CategoryScore[] {
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

  const attendance = clamp(
    100 - Math.min(40, d.attentionCount * 15) - Math.min(30, d.reassessmentDueCount * 10)
  )
  const coach = clamp(100 - Math.min(60, d.pendingWrapUpsCount * 20))
  const improvingPenalty =
    d.activePlayers > 0 && d.improvingCount / d.activePlayers < 0.5 ? 10 : 0
  const playerDev = clamp(100 - Math.min(50, d.missingFocusCount * 10) - improvingPenalty)
  const curric = clamp(
    100 - Math.min(50, d.playersWithoutLevel * 20) - Math.min(30, d.curricGapCount * 10)
  )
  const parent = clamp(
    100 - Math.min(60, d.newRequestsCount * 20) - Math.min(30, d.pendingCount * 10)
  )
  const review = clamp(
    100 -
      Math.min(50, d.pendingWrapUpsCount * 15) -
      Math.min(40, d.highPrioritySuggestionsCount * 20)
  )
  const session = clamp(d.activePlayers > 0 && d.sessionsThisWeek === 0 ? 70 : 100)

  return [
    {
      name: 'Attendance & Retention',
      score: attendance,
      weight: 20,
      explanation:
        d.attentionCount > 0 || d.reassessmentDueCount > 0
          ? `${d.attentionCount + d.reassessmentDueCount} player${d.attentionCount + d.reassessmentDueCount !== 1 ? 's' : ''} on hold or due for reassessment`
          : 'All active players are on track',
    },
    {
      name: 'Coach Execution',
      score: coach,
      weight: 15,
      explanation:
        d.pendingWrapUpsCount > 0
          ? `${d.pendingWrapUpsCount} coach wrap-up${d.pendingWrapUpsCount !== 1 ? 's' : ''} awaiting director review`
          : 'Coach wrap-ups are current',
    },
    {
      name: 'Player Development',
      score: playerDev,
      weight: 20,
      explanation:
        d.missingFocusCount > 0
          ? `${d.missingFocusCount} player${d.missingFocusCount !== 1 ? 's' : ''} without a current coaching focus`
          : 'All active players have coaching focus areas',
    },
    {
      name: 'Curriculum Execution',
      score: curric,
      weight: 15,
      explanation:
        d.playersWithoutLevel > 0
          ? `${d.playersWithoutLevel} active player${d.playersWithoutLevel !== 1 ? 's' : ''} missing a curriculum level`
          : 'All active players have curriculum levels assigned',
    },
    {
      name: 'Parent Communication',
      score: parent,
      weight: 10,
      explanation:
        d.newRequestsCount > 0
          ? `${d.newRequestsCount} parent lesson request${d.newRequestsCount !== 1 ? 's' : ''} pending review`
          : 'No pending parent communication items',
    },
    {
      name: 'Review Queue Health',
      score: review,
      weight: 10,
      explanation:
        d.pendingWrapUpsCount + d.highPrioritySuggestionsCount > 0
          ? `${d.pendingWrapUpsCount + d.highPrioritySuggestionsCount} item${d.pendingWrapUpsCount + d.highPrioritySuggestionsCount !== 1 ? 's' : ''} in the review queue`
          : 'Review queue is clear',
    },
    {
      name: 'Session Operations',
      score: session,
      weight: 10,
      explanation:
        d.sessionsThisWeek === 0 && d.activePlayers > 0
          ? 'No sessions scheduled this week'
          : `${d.sessionsThisWeek} session${d.sessionsThisWeek !== 1 ? 's' : ''} scheduled this week`,
    },
  ]
}

// ── Contributors ───────────────────────────────────────────────────

function buildContributors(d: AcademyHealthBadgeProps) {
  const helping: string[] = []
  const lowering: string[] = []

  if (d.activePlayers > 0)
    helping.push(`${d.activePlayers} active player${d.activePlayers !== 1 ? 's' : ''} enrolled`)
  if (d.improvingCount > 0)
    helping.push(`${d.improvingCount} player${d.improvingCount !== 1 ? 's' : ''} showing score improvement`)
  if (d.advancementReadyCount > 0)
    helping.push(`${d.advancementReadyCount} player${d.advancementReadyCount !== 1 ? 's' : ''} ready for advancement`)
  if (d.sessionsThisWeek > 0)
    helping.push(`${d.sessionsThisWeek} session${d.sessionsThisWeek !== 1 ? 's' : ''} scheduled this week`)
  if (d.pendingWrapUpsCount === 0) helping.push('Coach wrap-ups are current — no review backlog')
  if (d.attentionCount === 0 && d.reassessmentDueCount === 0)
    helping.push('No players on hold or at risk')

  if (d.pendingWrapUpsCount > 0)
    lowering.push(
      `${d.pendingWrapUpsCount} coach wrap-up${d.pendingWrapUpsCount !== 1 ? 's' : ''} awaiting review`
    )
  if (d.attentionCount > 0)
    lowering.push(
      `${d.attentionCount} player${d.attentionCount !== 1 ? 's' : ''} on hold or due for reassessment`
    )
  if (d.missingFocusCount > 0)
    lowering.push(
      `${d.missingFocusCount} player${d.missingFocusCount !== 1 ? 's' : ''} without a coaching focus`
    )
  if (d.playersWithoutLevel > 0)
    lowering.push(
      `${d.playersWithoutLevel} player${d.playersWithoutLevel !== 1 ? 's' : ''} missing curriculum level`
    )
  if (d.newRequestsCount > 0)
    lowering.push(
      `${d.newRequestsCount} parent request${d.newRequestsCount !== 1 ? 's' : ''} not yet reviewed`
    )
  if (d.reassessmentDueCount > 0)
    lowering.push(
      `${d.reassessmentDueCount} player${d.reassessmentDueCount !== 1 ? 's' : ''} overdue for reassessment`
    )
  if (d.highPrioritySuggestionsCount > 0)
    lowering.push(
      `${d.highPrioritySuggestionsCount} high-priority suggestion${d.highPrioritySuggestionsCount !== 1 ? 's' : ''} pending review`
    )

  return {
    helping: helping.slice(0, 5),
    lowering: lowering.slice(0, 5),
  }
}

// ── Focus actions ──────────────────────────────────────────────────

interface FocusAction {
  label: string
  detail: string
  href: string
}

function buildFocusActions(d: AcademyHealthBadgeProps): FocusAction[] {
  const actions: FocusAction[] = []

  if (d.pendingWrapUpsCount > 0)
    actions.push({
      label: 'View Coach Recaps',
      detail: `${d.pendingWrapUpsCount} coach wrap-up${d.pendingWrapUpsCount !== 1 ? 's' : ''} awaiting your review`,
      href: '/director/review?tab=wrap-ups',
    })
  if (d.attentionCount > 0 || d.reassessmentDueCount > 0)
    actions.push({
      label: 'Review Players',
      detail: `${d.attentionCount + d.reassessmentDueCount} player${d.attentionCount + d.reassessmentDueCount !== 1 ? 's' : ''} on hold or due for reassessment`,
      href: '/director/players',
    })
  if (d.newRequestsCount > 0)
    actions.push({
      label: 'Open Review Queue',
      detail: `${d.newRequestsCount} parent request${d.newRequestsCount !== 1 ? 's' : ''} awaiting director review`,
      href: '/director/review',
    })
  if (d.highPrioritySuggestionsCount > 0)
    actions.push({
      label: 'Review Suggestions',
      detail: `${d.highPrioritySuggestionsCount} high-priority suggestion${d.highPrioritySuggestionsCount !== 1 ? 's' : ''} to evaluate`,
      href: '/director/signals',
    })
  if (d.playersWithoutLevel > 0)
    actions.push({
      label: 'Assign Curriculum Levels',
      detail: `${d.playersWithoutLevel} player${d.playersWithoutLevel !== 1 ? 's' : ''} missing a level assignment`,
      href: '/director/players',
    })
  if (d.pendingCount > 0)
    actions.push({
      label: 'Place Players',
      detail: `${d.pendingCount} player${d.pendingCount !== 1 ? 's' : ''} awaiting placement`,
      href: '/director/players',
    })

  if (actions.length === 0) {
    actions.push({
      label: 'View Today\'s Academy',
      detail: 'No urgent actions — check today\'s live session feed',
      href: '/director/today',
    })
    actions.push({
      label: 'View Coach Recaps',
      detail: 'Review recent coach session wrap-ups',
      href: '/director/review?tab=wrap-ups',
    })
  }

  return actions
}

// ── Drawer ─────────────────────────────────────────────────────────

function AcademyHealthDrawer({
  data,
  onClose,
}: {
  data: AcademyHealthBadgeProps
  onClose: () => void
}) {
  const categories = computeCategories(data)
  const { helping, lowering } = buildContributors(data)
  const focusActions = buildFocusActions(data)
  const status = statusLabel(data.healthPct)

  const badgeColorClass =
    data.healthPct >= 80
      ? 'bg-teal-400/10 text-teal-400 border-teal-400/20'
      : data.healthPct >= 60
      ? 'bg-yellow-400/10 text-yellow-400 border-yellow-500/20'
      : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] max-w-full bg-surface border-l border-border flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Academy Health Breakdown"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary text-base leading-tight">Academy Health</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`font-mono font-bold text-2xl ${scoreTextColor(data.healthPct)}`}>
                  {data.healthPct}%
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColorClass}`}
                >
                  {status}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                Operational health estimate based on current academy signals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1.5 -mr-1 rounded-lg hover:bg-surface-raised shrink-0"
            aria-label="Close breakdown"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Category Breakdown */}
          <section>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-3">
              Category Breakdown
            </p>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.name} className="bg-surface-raised rounded-xl px-4 py-3 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">{cat.weight}%</span>
                    </div>
                    <span className={`font-mono font-bold text-base ${scoreTextColor(cat.score)}`}>
                      {cat.score}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${scoreBgColor(cat.score)}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">{cat.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What is helping */}
          {helping.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
                  What is helping
                </p>
              </div>
              <ul className="space-y-2">
                {helping.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                    <span className="text-sm text-text-secondary leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* What is lowering */}
          {lowering.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-3.5 h-3.5 text-status-orange shrink-0" />
                <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
                  What is lowering the score
                </p>
              </div>
              <ul className="space-y-2">
                {lowering.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-orange shrink-0 mt-1.5" />
                    <span className="text-sm text-text-secondary leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Focus first */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
                Focus first
              </p>
            </div>
            <div className="space-y-2">
              {focusActions.map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  onClick={onClose}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border hover:border-lime/20 hover:bg-lime/5 transition-all group"
                >
                  <span className="text-[11px] font-bold font-mono text-text-muted shrink-0 mt-0.5 w-4 text-right">
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-lime transition-colors">
                      {action.label}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{action.detail}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 bg-base">
          <p className="text-[11px] text-text-muted leading-snug text-center">
            DONNA can recommend what to review next. Nothing official changes from this panel.
          </p>
        </div>
      </div>
    </>
  )
}

// ── Badge + drawer entry point ─────────────────────────────────────

export function AcademyHealthBadgeWithDrawer(props: AcademyHealthBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isHealthy = props.healthPct >= 80
  const isWarning = props.healthPct >= 60 && props.healthPct < 80

  const color = isHealthy
    ? { text: 'text-teal-400', border: 'border-teal-400/30', dot: 'bg-teal-400' }
    : isWarning
    ? { text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' }
    : { text: 'text-[#FF3B30]', border: 'border-[#FF3B30]/30', dot: 'bg-[#FF3B30]' }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`shrink-0 group flex items-center gap-2 px-3 py-2 rounded-xl border ${color.border} hover:scale-[1.02] transition-all cursor-pointer`}
        style={{ background: 'rgba(0,0,0,0.3)' }}
        aria-label="View Academy Health breakdown"
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`}
          style={{ boxShadow: isHealthy ? '0 0 6px rgba(45,212,191,0.6)' : undefined }}
        />
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted leading-none mb-0.5">
            Academy Health
          </p>
          <p className={`font-mono font-bold text-xl leading-none ${color.text}`}>
            {props.healthPct}%
          </p>
        </div>
        <ShieldCheck className={`w-4 h-4 ${color.text} opacity-60 shrink-0`} />
      </button>

      {isOpen && (
        <AcademyHealthDrawer data={props} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
