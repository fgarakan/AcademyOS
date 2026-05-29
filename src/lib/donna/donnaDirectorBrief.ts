// Sprint 945 — DONNA Director Intelligence Brief V1
// COO-style intelligence brief generator for academy directors.
// Inputs: live DirectorDonnaContext signals.
// Output: top-3 priorities with explanations, highlight targets, safety notes, and next actions.
// Pure TypeScript — no DB calls, no React, no API calls.
//
// The brief ranks:
//   1. Pending review items (approval required)
//   2. Attendance exceptions
//   3. High-risk player signals
//   4. Advancement-eligible players
//   5. Player development stalls
//   6. Curriculum draft backlog
//   7. Coach behavior patterns (wrap-up completion)
//   8. Setup/onboarding gaps
//
// Usage:
//   const brief = buildDirectorBrief(directorCtx)
//   brief.priorities[0].text  // "3 items need your review in the Review Center"
//   brief.priorities[0].targetId  // 'pending-review-list'

import type { DonnaContextRole } from './donnaPersonality'
import { getSafetyMessage } from './donnaPersonality'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BriefPriorityLevel = 'critical' | 'high' | 'medium' | 'informational'

export interface DirectorBriefPriority {
  /** Priority rank (1 = most important) */
  rank: number
  level: BriefPriorityLevel
  /** Short headline for the priority */
  headline: string
  /** Detailed explanation DONNA speaks */
  text: string
  /** Why this matters */
  whyItMatters: string
  /** Recommended next action */
  recommendedAction: string
  /** data-donna-focus-id to highlight when pointing to this priority */
  targetId?: string
  /** Route to navigate to for this priority */
  href: string
  /** Safety note when approval is required */
  safetyNote?: string
  /** Signal type driving this priority */
  signal: string
}

export interface DirectorIntelligenceBrief {
  /** The top 3 priorities ranked by urgency */
  priorities: DirectorBriefPriority[]
  /** Opening line DONNA says before reading the brief */
  openingLine: string
  /** Closing line DONNA says after reading priorities */
  closingLine: string
  /** Overall academy health signal */
  overallHealthSignal: 'critical' | 'attention_needed' | 'on_track' | 'insufficient_data'
  /** Whether any priority requires immediate director action */
  hasUrgentAction: boolean
  /** Total number of items needing director attention (sum of pending signals) */
  totalAttentionItems: number
}

// ── Live context input shape ──────────────────────────────────────────────────

/** Subset of DirectorDonnaContext fields used by the brief generator. */
export interface DirectorBriefInput {
  pendingReviews?: number
  attendanceExceptions?: number
  highRiskPlayerCount?: number
  advancementEligibleCount?: number
  playerProgressStallCount?: number
  curriculumDraftCount?: number
  coachCount?: number
  playerCount?: number
  assessmentCount?: number
}

// ── Main brief generator ──────────────────────────────────────────────────────

export function buildDirectorBrief(
  input: DirectorBriefInput,
): DirectorIntelligenceBrief {
  const candidates = buildPriorityCandidates(input)
  // Take top 3 by rank score
  const sorted = candidates.sort((a, b) => a.rank - b.rank).slice(0, 3)
  const total = sumAttentionItems(input)
  const health = deriveHealthSignal(input)
  const hasUrgent = sorted.some(p => p.level === 'critical')

  const openingLine = buildOpeningLine(health, total, hasUrgent)
  const closingLine = buildClosingLine(sorted.length)

  return {
    priorities: sorted,
    openingLine,
    closingLine,
    overallHealthSignal: health,
    hasUrgentAction: hasUrgent,
    totalAttentionItems: total,
  }
}

// ── Priority candidate builders ───────────────────────────────────────────────

function buildPriorityCandidates(input: DirectorBriefInput): DirectorBriefPriority[] {
  const candidates: DirectorBriefPriority[] = []
  let rank = 1

  // ── 1. Pending review items ─────────────────────────────────────────────────
  if (input.pendingReviews && input.pendingReviews > 0) {
    const n = input.pendingReviews
    const plural = n === 1 ? 'item needs' : 'items need'
    candidates.push({
      rank: rank++,
      level: n >= 5 ? 'critical' : 'high',
      headline: `${n} pending ${n === 1 ? 'review item' : 'review items'}`,
      text: `You have **${n} ${plural} your decision** in the Review Center. These include coach wrap-ups, observations, and other proposed actions. Nothing takes effect until you approve or reject each one.`,
      whyItMatters: 'Unreviewed items block the development pipeline — coach observations cannot be applied and parent updates cannot be sent until you act.',
      recommendedAction: 'Go to the Review Center and work through the queue starting with the highest-urgency items.',
      targetId: 'pending-review-list',
      href: '/director/review',
      safetyNote: getSafetyMessage('approvalRequired'),
      signal: 'pending_reviews',
    })
  }

  // ── 2. Attendance exceptions ────────────────────────────────────────────────
  if (input.attendanceExceptions && input.attendanceExceptions > 0) {
    const n = input.attendanceExceptions
    const plural = n === 1 ? 'exception is' : 'exceptions are'
    candidates.push({
      rank: rank++,
      level: 'high',
      headline: `${n} attendance ${n === 1 ? 'exception' : 'exceptions'} pending`,
      text: `**${n} attendance ${plural} waiting for your review.** These were flagged by coaches and need your decision before player attendance records are updated.`,
      whyItMatters: 'Unresolved attendance exceptions create inaccurate attendance records which affect development tracking and parent communication.',
      recommendedAction: 'Review attendance exceptions in the Review Center and approve or reject each one.',
      targetId: 'attendance-exceptions-section',
      href: '/director/review',
      safetyNote: getSafetyMessage('approvalRequired'),
      signal: 'attendance_exceptions',
    })
  }

  // ── 3. High-risk players ────────────────────────────────────────────────────
  if (input.highRiskPlayerCount && input.highRiskPlayerCount > 0) {
    const n = input.highRiskPlayerCount
    const plural = n === 1 ? 'player has' : 'players have'
    candidates.push({
      rank: rank++,
      level: n >= 3 ? 'critical' : 'high',
      headline: `${n} high-risk ${n === 1 ? 'player' : 'players'}`,
      text: `**${n} ${plural} high-risk development signals** — combining attendance gaps, stalled progression, or repeated coach concerns. These players need your direct attention before the next coaching cycle.`,
      whyItMatters: 'High-risk players are at elevated risk of disengaging from the program. Early director intervention improves retention and development outcomes.',
      recommendedAction: 'Review high-risk player profiles, check coach notes, and decide whether to schedule a direct conversation or adjust their development plan.',
      targetId: 'player-attention-card',
      href: '/director/players',
      signal: 'high_risk_players',
    })
  }

  // ── 4. Advancement-eligible players ──────────────────────────────────────
  if (input.advancementEligibleCount && input.advancementEligibleCount > 0) {
    const n = input.advancementEligibleCount
    const plural = n === 1 ? 'player is' : 'players are'
    candidates.push({
      rank: rank++,
      level: 'medium',
      headline: `${n} ${n === 1 ? 'player' : 'players'} ready to advance`,
      text: `**${n} ${plural} currently marked advancement-eligible.** Review their readiness signals and, if you agree, submit an advancement proposal. Level changes never happen automatically — you decide.`,
      whyItMatters: 'Timely advancement keeps players challenged and engaged. Delays can cause frustration and disengagement.',
      recommendedAction: 'Review advancement-eligible players in the Level Movement section and submit proposals for any you agree should advance.',
      href: '/director/level-up',
      safetyNote: getSafetyMessage('noLevelChange'),
      signal: 'advancement_eligible',
    })
  }

  // ── 5. Player development stalls ─────────────────────────────────────────
  if (input.playerProgressStallCount && input.playerProgressStallCount > 0) {
    const n = input.playerProgressStallCount
    const plural = n === 1 ? 'player has' : 'players have'
    candidates.push({
      rank: rank++,
      level: 'medium',
      headline: `${n} ${n === 1 ? 'player' : 'players'} with stalled development`,
      text: `**${n} ${plural} stalled development signals.** They have not shown progression in recent sessions. Consider reviewing their active priorities and discussing with their coach.`,
      whyItMatters: 'Development stalls often reflect misaligned priorities or delivery gaps. Early detection prevents long-term disengagement.',
      recommendedAction: 'Review stalled players in the Player Directory and assess whether their priorities need updating.',
      href: '/director/players',
      signal: 'player_progress_stalls',
    })
  }

  // ── 6. Curriculum draft backlog ──────────────────────────────────────────
  if (input.curriculumDraftCount && input.curriculumDraftCount > 0) {
    const n = input.curriculumDraftCount
    const plural = n === 1 ? 'draft is' : 'drafts are'
    candidates.push({
      rank: rank++,
      level: 'medium',
      headline: `${n} curriculum ${n === 1 ? 'draft' : 'drafts'} pending review`,
      text: `**${n} curriculum ${plural} waiting in the Review Center.** These are proposed additions — drills, gates, or skills — submitted for your approval. Nothing is published until you review them.`,
      whyItMatters: 'A growing curriculum draft backlog slows curriculum development. Reviewing drafts regularly keeps the curriculum up-to-date.',
      recommendedAction: 'Review pending curriculum drafts in the Review Center and approve, modify, or reject each one.',
      href: '/director/review',
      safetyNote: getSafetyMessage('approvalRequired'),
      signal: 'curriculum_drafts',
    })
  }

  // If no signals — return a positive informational item
  if (candidates.length === 0) {
    candidates.push({
      rank: 1,
      level: 'informational',
      headline: 'Academy is on track',
      text: 'Your Review Center is clear and no urgent signals are active. This is a good time to review player development trajectories, check in on upcoming sessions, or work on curriculum improvements.',
      whyItMatters: 'Proactive review during quiet periods prevents larger backlogs later.',
      recommendedAction: 'Check your upcoming sessions and review player progress profiles.',
      href: '/director',
      signal: 'no_urgent_signals',
    })
  }

  return candidates
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sumAttentionItems(input: DirectorBriefInput): number {
  return (
    (input.pendingReviews ?? 0) +
    (input.attendanceExceptions ?? 0) +
    (input.highRiskPlayerCount ?? 0)
  )
}

function deriveHealthSignal(input: DirectorBriefInput): DirectorIntelligenceBrief['overallHealthSignal'] {
  const total = sumAttentionItems(input)
  const hasData = Object.values(input).some(v => v !== undefined && v !== null)
  if (!hasData) return 'insufficient_data'
  if (total >= 10) return 'critical'
  if (total >= 3) return 'attention_needed'
  return 'on_track'
}

function buildOpeningLine(
  health: DirectorIntelligenceBrief['overallHealthSignal'],
  total: number,
  hasUrgent: boolean,
): string {
  if (health === 'insufficient_data') {
    return "Academy data is loading. Here's what I can tell you right now based on available context."
  }
  if (health === 'critical') {
    return `**Your academy needs attention right now.** You have ${total} active signals requiring your decision.`
  }
  if (health === 'attention_needed') {
    return `Here's your academy briefing. You have ${total} items that need your attention.`
  }
  return "Your academy is on track. Here's your briefing."
}

function buildClosingLine(priorityCount: number): string {
  if (priorityCount === 0) return 'No immediate action required. I\'m here if you need me.'
  return `Those are your top ${priorityCount} priorities. Say "take me there" after any item to navigate directly. All actions go through the Review Center — I never approve anything on your behalf.`
}

// ── Brief to Shell A message ──────────────────────────────────────────────────

/**
 * Formats the director brief as a single DONNA chat message text.
 * Used by Shell A to render the brief as a single readable response.
 */
export function formatBriefAsMessage(brief: DirectorIntelligenceBrief): string {
  const lines: string[] = [brief.openingLine, '']

  brief.priorities.forEach((p, i) => {
    lines.push(`**${i + 1}. ${p.headline}**`)
    lines.push(p.text)
    lines.push(`→ ${p.recommendedAction}`)
    if (p.safetyNote) lines.push(`⚠ ${p.safetyNote}`)
    lines.push('')
  })

  lines.push(brief.closingLine)
  return lines.join('\n')
}
