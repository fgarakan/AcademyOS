// DONNA UI Constitution — Player Profile Hero
//
// Shows the 5 key signals for a player — the constitution-compliant top section.
// Placed above all existing tabs and cards.
//
// 5 signals:
//   1. Current level
//   2. Next target level
//   3. Top 3 priorities
//   4. Active missions count
//   5. DONNA brief (what matters + next action)
//
// Everything else (assessments, blueprint detail, coach notes, etc.)
// is accessible through tabs and expansion — but not visually dominant by default.

import { DonnaScreenBriefStatic } from '@/components/donna/DonnaScreenBrief'
import { AskDonnaInlinePrompt } from '@/components/donna/AskDonnaInlinePrompt'
import { ArrowRight, Target, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface PrioritySignal {
  title: string
  urgency: string | null
  category: string | null
}

interface PlayerProfileConstitutionHeroProps {
  // Player identity
  playerFirstName: string
  playerLastName: string
  playerStatus: string | null

  // Level signals
  currentLevelName: string | null
  currentStage: string | null
  nextLevelName: string | null
  advancementEligible: boolean

  // Priorities (top 3)
  topPriorities: PrioritySignal[]

  // Missions
  activeMissionCount: number
  pendingMissionCount: number

  // Assessment
  latestAssessmentDate: string | null
  latestAssessmentOverallScore: number | null

  // For links
  playerId: string
  academyId: string
}

// Stage → friendly label
const STAGE_LABELS: Record<string, string> = {
  red_foundation:     'Red Ball',
  orange_development: 'Orange Ball',
  green_performance:  'Green Ball',
  yellow_competitive: 'Yellow Ball',
  high_performance:   'High Performance',
}

function buildPlayerBrief(props: PlayerProfileConstitutionHeroProps): string {
  const {
    playerFirstName,
    currentLevelName,
    topPriorities,
    activeMissionCount,
    pendingMissionCount,
    latestAssessmentDate,
    advancementEligible,
    nextLevelName,
  } = props

  const parts: string[] = []
  const name = playerFirstName

  if (!currentLevelName) {
    return `${name} has not been placed yet. Complete placement to generate a development plan.`
  }

  parts.push(`${name} is at ${currentLevelName}.`)

  if (topPriorities.length > 0) {
    const top = topPriorities[0].title
    parts.push(`Top focus: ${top}.`)
  }

  if (advancementEligible && nextLevelName) {
    parts.push(`May be ready to advance to ${nextLevelName}.`)
  } else if (nextLevelName) {
    parts.push(`Next target: ${nextLevelName}.`)
  }

  if (pendingMissionCount > 0) {
    parts.push(`${pendingMissionCount} mission${pendingMissionCount > 1 ? 's' : ''} pending your review.`)
  } else if (activeMissionCount > 0) {
    parts.push(`${activeMissionCount} active mission${activeMissionCount > 1 ? 's' : ''}.`)
  }

  if (latestAssessmentDate) {
    const daysAgo = Math.floor((Date.now() - new Date(latestAssessmentDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo > 60) {
      parts.push(`Assessment is ${daysAgo} days old — consider reassessing.`)
    }
  }

  return parts.join(' ')
}

export function PlayerProfileConstitutionHero(props: PlayerProfileConstitutionHeroProps) {
  const {
    playerFirstName,
    currentLevelName,
    currentStage,
    nextLevelName,
    advancementEligible,
    topPriorities,
    activeMissionCount,
    pendingMissionCount,
    playerId,
    playerStatus,
  } = props

  const brief = buildPlayerBrief(props)
  const stageLabel = currentStage ? (STAGE_LABELS[currentStage] ?? currentStage) : null

  // Primary action: approve missions if pending, otherwise start assessment
  const primaryActionLabel = pendingMissionCount > 0
    ? `Review ${pendingMissionCount} Mission${pendingMissionCount > 1 ? 's' : ''}`
    : advancementEligible ? 'Review Level Readiness' : undefined

  const primaryActionHref = pendingMissionCount > 0
    ? `/director/players/${playerId}?tab=missions`
    : advancementEligible ? `/director/players/${playerId}?tab=skill-path` : undefined

  return (
    <div className="space-y-4 mb-6">

      {/* DONNA brief — constitution requirement */}
      <DonnaScreenBriefStatic
        brief={brief}
        primaryActionLabel={primaryActionLabel}
        primaryActionHref={primaryActionHref}
        emphasis={pendingMissionCount > 0 || advancementEligible ? 'urgent' : 'normal'}
      />

      {/* 5 signal cards — max 5, high signal only */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">

        {/* Signal 1: Current level */}
        <Link
          href={`/director/players/${playerId}?tab=development`}
          className="group rounded-xl border border-border bg-surface hover:border-lime/25 hover:bg-surface-raised transition-all px-3 py-3"
        >
          <p className="label-xs text-text-muted mb-1">Current Level</p>
          <p className="text-sm font-bold text-text-primary leading-tight">
            {currentLevelName ?? '—'}
          </p>
          {stageLabel && <p className="text-[10px] text-text-muted mt-0.5">{stageLabel}</p>}
        </Link>

        {/* Signal 2: Next target */}
        <div className="rounded-xl border border-border bg-surface px-3 py-3">
          <p className="label-xs text-text-muted mb-1">Next Target</p>
          <p className={`text-sm font-bold leading-tight ${advancementEligible ? 'text-lime' : 'text-text-secondary'}`}>
            {nextLevelName ?? '—'}
          </p>
          {advancementEligible && (
            <p className="text-[10px] text-lime mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Ready
            </p>
          )}
        </div>

        {/* Signal 3: Top priority */}
        <Link
          href={`/director/players/${playerId}?tab=notes`}
          className="group rounded-xl border border-border bg-surface hover:border-lime/25 hover:bg-surface-raised transition-all px-3 py-3"
        >
          <p className="label-xs text-text-muted mb-1">Top Priority</p>
          <p className="text-sm font-bold text-text-primary leading-tight line-clamp-2">
            {topPriorities[0]?.title ?? 'None set'}
          </p>
          {topPriorities.length > 1 && (
            <p className="text-[10px] text-text-muted mt-0.5">+{topPriorities.length - 1} more</p>
          )}
        </Link>

        {/* Signal 4: Active missions */}
        <Link
          href={`/director/players/${playerId}?tab=missions`}
          className={`group rounded-xl border transition-all px-3 py-3 ${
            pendingMissionCount > 0
              ? 'border-status-orange/30 bg-status-orange/4 hover:border-status-orange/40'
              : 'border-border bg-surface hover:border-lime/25 hover:bg-surface-raised'
          }`}
        >
          <p className="label-xs text-text-muted mb-1">Missions</p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-text-primary">{activeMissionCount} active</p>
          </div>
          {pendingMissionCount > 0 && (
            <p className="text-[10px] text-status-orange mt-0.5 flex items-center gap-0.5">
              <AlertCircle className="w-2.5 h-2.5" />
              {pendingMissionCount} pending
            </p>
          )}
        </Link>

        {/* Signal 5: Ask DONNA */}
        <div className="rounded-xl border border-lime/15 bg-lime/3 px-3 py-3 flex flex-col justify-between">
          <p className="label-xs text-lime mb-1">Ask DONNA</p>
          <div className="space-y-1">
            <AskDonnaInlinePrompt
              question={`Why is ${playerFirstName} at ${currentLevelName ?? 'this level'}?`}
              label="Why this level?"
              size="xs"
            />
            <AskDonnaInlinePrompt
              question={`What is blocking ${playerFirstName}'s level progress?`}
              label="What's blocking?"
              size="xs"
            />
          </div>
        </div>

      </div>

      {/* Status alert if non-active */}
      {playerStatus && playerStatus !== 'active' && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-status-orange/25 bg-status-orange/5">
          <AlertCircle className="w-4 h-4 text-status-orange shrink-0" />
          <p className="text-[12px] text-text-secondary">
            Player status: <span className="font-semibold text-status-orange">{playerStatus.replace(/_/g, ' ')}</span>
            {playerStatus === 'pending_placement' && ' — Complete placement to activate this player.'}
          </p>
        </div>
      )}

    </div>
  )
}
