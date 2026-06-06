'use client'

// Mega Sprint 2241–2260 — DONNA Executive Workspace V1
//
// Connects the Goal Completion Engine (sessionStorage stack) to the director homepage.
// Directors can see active workflow progress, resume paused workflows, and start
// contextual workflows directly from the dashboard — without having to know what to type.
//
// Design rules:
//   - Reads sessionStorage via getGoalCompletionStack() in useEffect only (SSR-safe).
//   - Never mutates sessionStorage directly — all workflow control goes through donna:open.
//   - Props are live signals from the server (counts + level names). No DB calls here.
//   - All workflow starts dispatch donna:open with a trigger phrase the DONNA brain matches.

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles, Play, RotateCcw, ChevronRight,
  ClipboardList, Users, BookOpen, Calendar,
} from 'lucide-react'
import {
  getGoalCompletionStack,
} from '@/lib/donna/workflows/donnaGoalCompletionModel'
import type {
  GoalCompletionSession,
  GoalCompletionStack,
} from '@/lib/donna/workflows/donnaGoalCompletionModel'

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  /** Wrap-ups + assessments + placement reviews pending review */
  totalPendingReviews: number
  /** Players in pending_placement / placement_in_progress / pending_approval */
  pendingPlacementCount: number
  /** Players enrolled > 180 days and not advancement-eligible */
  stalledPlayerCount: number
  /** Name of the most-blocked curriculum level, or null */
  mostBlockedLevelName: string | null
  /** Count of curriculum_gap suggestions from academy_suggestions */
  curricGapCount: number
}

// ── Workflow card shape ────────────────────────────────────────────────────────

type WorkflowVariant = 'urgent' | 'review' | 'curriculum' | 'plan'

interface WorkflowCard {
  id: string
  label: string
  description: string
  triggerPrompt: string
  variant: WorkflowVariant
  count?: number
  Icon: React.ElementType
}

// ── Event bridge ───────────────────────────────────────────────────────────────

function openDonnaWithPrompt(prompt: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt } }))
  }
}

// ── Status label helpers ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  proposed:             'Proposed',
  active:               'In Progress',
  waiting_for_user:     'Waiting for you',
  waiting_for_approval: 'Needs approval',
  paused:               'Paused',
  completed:            'Complete',
  cancelled:            'Cancelled',
  blocked:              'Blocked',
}

// ── Style maps ─────────────────────────────────────────────────────────────────

const VARIANT_BORDER: Record<WorkflowVariant, string> = {
  urgent:     'border-status-red/20',
  review:     'border-yellow-500/20',
  curriculum: 'border-status-blue/20',
  plan:       'border-lime/15',
}

const VARIANT_COUNT_CHIP: Record<WorkflowVariant, string> = {
  urgent:     'bg-status-red/10 border-status-red/25 text-status-red',
  review:     'bg-yellow-500/10 border-yellow-500/25 text-yellow-400',
  curriculum: 'bg-status-blue/10 border-status-blue/25 text-status-blue',
  plan:       'bg-lime/10 border-lime/25 text-lime',
}

const VARIANT_ICON: Record<WorkflowVariant, string> = {
  urgent:     'text-status-red',
  review:     'text-yellow-400',
  curriculum: 'text-status-blue',
  plan:       'text-lime',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActiveSessionBanner({ session }: { session: GoalCompletionSession }) {
  const stepLabel = `Step ${session.currentStep} of ${session.totalSteps}`
  const progress  = Math.round((session.currentStep / session.totalSteps) * 100)
  const statusLabel = STATUS_LABEL[session.status] ?? session.status

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'linear-gradient(135deg, rgba(200,255,0,0.04) 0%, rgba(200,255,0,0.02) 100%)',
        border:     '1px solid rgba(200,255,0,0.18)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(200,255,0,0.10)', border: '1px solid rgba(200,255,0,0.22)' }}
          >
            <Play className="w-3.5 h-3.5 text-lime" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">
              Active Workflow
            </p>
            <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">
              {session.goalType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-lime/70 bg-lime/[0.06] border border-lime/15 px-2 py-0.5 rounded-full whitespace-nowrap">
          {statusLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-text-muted">{stepLabel}</p>
          <p className="text-[11px] font-mono text-lime">{progress}%</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(200,255,0,0.08)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width:      `${progress}%`,
              background: 'rgba(200,255,0,0.60)',
            }}
          />
        </div>
      </div>

      {/* Current question */}
      {session.nextQuestion && (
        <p className="text-[12px] text-text-secondary leading-relaxed italic">
          &ldquo;{session.nextQuestion}&rdquo;
        </p>
      )}

      {/* Continue CTA */}
      <button
        type="button"
        onClick={() => openDonnaWithPrompt('resume')}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-[12px] transition-all hover:opacity-90"
        style={{
          background: 'rgba(200,255,0,0.12)',
          border:     '1px solid rgba(200,255,0,0.25)',
          color:      '#C8FF00',
        }}
      >
        Continue with DONNA
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function PausedSessionRow({ session }: { session: GoalCompletionSession }) {
  const label = session.goalType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const stepLabel = `Step ${session.currentStep}/${session.totalSteps}`

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
      <RotateCcw className="w-3.5 h-3.5 text-text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-text-primary leading-tight truncate">{label}</p>
        <p className="text-[10px] text-text-muted">{stepLabel} — paused</p>
      </div>
      <button
        type="button"
        onClick={() => openDonnaWithPrompt('resume')}
        className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        Resume →
      </button>
    </div>
  )
}

function WorkflowStarterCard({ card }: { card: WorkflowCard }) {
  const { Icon } = card

  return (
    <button
      type="button"
      onClick={() => openDonnaWithPrompt(card.triggerPrompt)}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all group hover:bg-surface-raised ${VARIANT_BORDER[card.variant]} border`}
      style={{ background: 'rgba(255,255,255,0.015)' }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Icon className={`w-4 h-4 ${VARIANT_ICON[card.variant]}`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-text-primary leading-tight">{card.label}</p>
          {card.count !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border leading-none ${VARIANT_COUNT_CHIP[card.variant]}`}>
              {card.count}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">{card.description}</p>
      </div>

      {/* Start chip */}
      <span className="shrink-0 text-[10px] font-semibold text-text-muted group-hover:text-lime transition-colors whitespace-nowrap flex items-center gap-0.5">
        Start <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DonnaExecutiveWorkspace({
  totalPendingReviews,
  pendingPlacementCount,
  stalledPlayerCount,
  mostBlockedLevelName,
  curricGapCount,
}: Props) {
  const [stack, setStack] = useState<GoalCompletionStack | null>(null)

  const refreshStack = useCallback(() => {
    setStack(getGoalCompletionStack())
  }, [])

  useEffect(() => {
    refreshStack()
    // Re-read when DONNA panel closes — session may have advanced
    window.addEventListener('donna:closed', refreshStack)
    window.addEventListener('donna:session-updated', refreshStack)
    return () => {
      window.removeEventListener('donna:closed', refreshStack)
      window.removeEventListener('donna:session-updated', refreshStack)
    }
  }, [refreshStack])

  const activeSession  = stack?.active  ?? null
  const pausedSessions = stack?.paused  ?? []

  // ── Contextual workflow cards ────────────────────────────────────────────────

  const workflowCards: WorkflowCard[] = []

  if (totalPendingReviews > 0) {
    workflowCards.push({
      id:            'review_queue',
      label:         'Review & Decide',
      description:   `${totalPendingReviews} item${totalPendingReviews !== 1 ? 's' : ''} waiting for your decision`,
      triggerPrompt: 'walk me through the review queue',
      variant:       'review',
      count:         totalPendingReviews,
      Icon:          ClipboardList,
    })
  }

  if (pendingPlacementCount > 0) {
    workflowCards.push({
      id:            'player_placement',
      label:         'Player Placement',
      description:   `${pendingPlacementCount} player${pendingPlacementCount !== 1 ? 's' : ''} waiting to be placed`,
      triggerPrompt: 'walk me through player placements',
      variant:       'urgent',
      count:         pendingPlacementCount,
      Icon:          Users,
    })
  }

  if (stalledPlayerCount > 0 || curricGapCount > 0 || mostBlockedLevelName !== null) {
    const desc = mostBlockedLevelName !== null
      ? `Players stalling at ${mostBlockedLevelName}`
      : curricGapCount > 0
        ? `${curricGapCount} curriculum gap${curricGapCount !== 1 ? 's' : ''} to address`
        : `${stalledPlayerCount} player${stalledPlayerCount !== 1 ? 's' : ''} stuck at their level`
    workflowCards.push({
      id:            'curriculum_improvement',
      label:         'Curriculum Bottleneck',
      description:   desc,
      triggerPrompt: 'curriculum bottleneck',
      variant:       'curriculum',
      Icon:          BookOpen,
    })
  }

  // Plan My Day is always available as the fallback entry point
  workflowCards.push({
    id:            'daily_priorities',
    label:         'Plan My Day',
    description:   'DONNA walks you through your ranked priorities and decides what to tackle first',
    triggerPrompt: 'what should I do today',
    variant:       'plan',
    Icon:          Calendar,
  })

  // Don't render the workspace if there's nothing actionable and no session running
  const hasActiveState = activeSession !== null || pausedSessions.length > 0
  const hasSignals     = workflowCards.some(c => c.id !== 'daily_priorities')
  if (!hasActiveState && !hasSignals && stack !== null) {
    // All clear — render minimal "ready" state
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ border: '1px solid rgba(200,255,0,0.08)', background: 'rgba(200,255,0,0.02)' }}
        data-donna-focus-id="donna-executive-workspace"
      >
        <Sparkles className="w-3.5 h-3.5 text-lime/60 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-text-secondary leading-snug">
            No priority signals right now. Ask DONNA to plan your day.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openDonnaWithPrompt('what should I do today')}
          className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          Plan Day →
        </button>
      </div>
    )
  }

  return (
    <div
      className="space-y-2"
      data-donna-focus-id="donna-executive-workspace"
    >
      {/* Section label */}
      <div className="flex items-center gap-2 px-0.5">
        <Sparkles className="w-3 h-3 text-lime/70" />
        <p className="text-[10px] uppercase tracking-widest text-lime/70 font-semibold">
          DONNA — Start a Workflow
        </p>
      </div>

      {/* Active session progress */}
      {activeSession !== null && (
        <ActiveSessionBanner session={activeSession} />
      )}

      {/* Paused sessions stack */}
      {pausedSessions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold px-0.5">
            Paused — resume where you left off
          </p>
          {pausedSessions.map((s, i) => (
            <PausedSessionRow key={s.sessionId ?? i} session={s} />
          ))}
        </div>
      )}

      {/* Workflow starter cards */}
      <div className="space-y-1.5">
        {activeSession === null && (
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold px-0.5">
            {workflowCards.length === 1 ? 'Ask DONNA to guide you' : 'Let DONNA guide you through'}
          </p>
        )}
        {workflowCards.map(card => (
          <WorkflowStarterCard key={card.id} card={card} />
        ))}
      </div>

      {/* Trust footer */}
      <p className="text-[10px] text-text-muted px-0.5 leading-snug">
        DONNA guides. You decide. Nothing changes until you approve.
      </p>
    </div>
  )
}
