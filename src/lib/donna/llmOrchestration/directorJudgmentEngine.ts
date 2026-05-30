// Sprint 984 — DONNA Director Judgment Engine V1
// Determines which action the director should take next based on ranked signals.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// The judgment engine combines:
//   1. Live signals (pending reviews, missing recaps, placement count)
//   2. Page context (what page the director is on)
//   3. Feedback preferences (which recommendations were previously accepted)
//   4. Time signals (urgency, staleness)
//
// This is the reasoning layer that sits above directorNextActionEngine.
// While directorNextActionEngine applies simple priority rules,
// the judgment engine produces a ranked set of actions with confidence scores.
//
// Usage:
//   const judgment = judgeDirectorPriorities(signals)
//   judgment.topAction     // highest-confidence recommendation
//   judgment.rankedActions // full ranked list
//   judgment.reasoning     // why this ordering was chosen

import { buildDirectorNextAction } from '../directorNextActionEngine'
import type { DirectorNextAction } from '../directorNextActionEngine'
import { getRecommendationScore } from './feedbackLoop'
import type { AcademyStateSummary } from './types'

// ── Input signals ─────────────────────────────────────────────────────────────

export interface DirectorJudgmentSignals {
  /** Current page pathname */
  pathname: string
  /** Pending review items (from panel state) */
  pendingReviews: number
  /** Academy state summary */
  academyState: Partial<AcademyStateSummary>
  /** Time since last director action (minutes, optional) */
  minutesSinceLastAction?: number
}

// ── Judgment result ───────────────────────────────────────────────────────────

export interface RankedAction {
  action: DirectorNextAction
  /** Confidence score 0–100 */
  confidence: number
  /** Why this action was ranked at this position */
  rationale: string
  /** Whether this is urgent (confidence >= 80 AND requires approval) */
  isUrgent: boolean
}

export interface DirectorJudgment {
  /** The highest-confidence action */
  topAction: RankedAction
  /** All ranked actions (top 3) */
  rankedActions: RankedAction[]
  /** Summary of the reasoning */
  reasoning: string
  /** Overall urgency level */
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
}

// ── Signal weight table ───────────────────────────────────────────────────────

function computeUrgencyScore(signals: DirectorJudgmentSignals): number {
  let score = 0

  // Pending reviews is highest urgency signal
  if (signals.pendingReviews >= 10) score += 40
  else if (signals.pendingReviews >= 5) score += 30
  else if (signals.pendingReviews >= 1) score += 20

  // Missing recaps (past sessions without wrap-up)
  if (signals.academyState.hasMissingRecaps) score += 15

  // Players needing placement
  if (signals.academyState.hasPlayersNeedingPlacement) score += 10

  // Advancement-eligible players
  if (signals.academyState.hasAdvancementEligiblePlayers) score += 8

  // Time since last action (stale presence)
  if (signals.minutesSinceLastAction && signals.minutesSinceLastAction >= 60) score += 5

  return Math.min(score, 100)
}

function urgencyLevelFromScore(score: number): DirectorJudgment['urgencyLevel'] {
  if (score >= 70) return 'critical'
  if (score >= 40) return 'high'
  if (score >= 15) return 'medium'
  return 'low'
}

// ── Action candidate builders ─────────────────────────────────────────────────

function buildCandidates(signals: DirectorJudgmentSignals): Array<{
  action: DirectorNextAction
  baseScore: number
  rationale: string
}> {
  const candidates = []

  // Primary: pending review queue
  if (signals.pendingReviews > 0) {
    const action = buildDirectorNextAction({ pathname: signals.pathname, pendingReviews: signals.pendingReviews })
    candidates.push({
      action,
      baseScore: 80 + Math.min(signals.pendingReviews * 2, 20),
      rationale: `${signals.pendingReviews} pending review ${signals.pendingReviews === 1 ? 'item blocks' : 'items block'} the development pipeline.`,
    })
  }

  // Secondary: missing recaps
  if (signals.academyState.hasMissingRecaps && signals.pendingReviews === 0) {
    const action = buildDirectorNextAction({ pathname: '/director/sessions', pendingReviews: 0 })
    candidates.push({
      action: { ...action, id: 'missing_recaps', title: 'Missing Wrap-Ups', summary: `Past sessions are missing coach wrap-ups. Visit the Sessions page to identify which sessions need follow-up. No data changes until a coach submits a wrap-up and you approve it.` },
      baseScore: 60,
      rationale: 'Past sessions without wrap-ups mean coach observations are not yet official player evidence.',
    })
  }

  // Tertiary: player placement
  if (signals.academyState.hasPlayersNeedingPlacement && candidates.length < 3) {
    const action = buildDirectorNextAction({ pathname: '/director/players', pendingReviews: 0 })
    candidates.push({
      action: { ...action, id: 'player_placement', title: 'Player Placement', summary: `One or more players need curriculum placement. Visit the Player Directory to assign levels. Placement decisions are always director-controlled — nothing is assigned automatically.` },
      baseScore: 50,
      rationale: 'Players without a curriculum level are not fully integrated into the development system.',
    })
  }

  // Page-specific fallback
  if (candidates.length === 0) {
    const action = buildDirectorNextAction({ pathname: signals.pathname, pendingReviews: 0 })
    candidates.push({
      action,
      baseScore: 30,
      rationale: 'No urgent signals detected. Page-specific guidance provided.',
    })
  }

  return candidates
}

// ── Main judgment engine ──────────────────────────────────────────────────────

/**
 * Produce a ranked judgment of director priorities.
 * Combines live signals, page context, and feedback preferences.
 * No DB calls. No mutations.
 */
export function judgeDirectorPriorities(signals: DirectorJudgmentSignals): DirectorJudgment {
  const candidates = buildCandidates(signals)
  const urgencyScore = computeUrgencyScore(signals)

  // Apply feedback preference boost
  const scored = candidates.map(c => {
    const feedbackBoost = getRecommendationScore(c.action.id) * 3
    const confidence = Math.min(c.baseScore + feedbackBoost, 100)
    return {
      action: c.action,
      confidence,
      rationale: c.rationale,
      isUrgent: confidence >= 80 && c.action.requiresApproval,
    }
  })

  // Sort by confidence descending
  scored.sort((a, b) => b.confidence - a.confidence)

  const topAction = scored[0]
  const rankedActions = scored.slice(0, 3)
  const urgencyLevel = urgencyLevelFromScore(urgencyScore)

  const reasoning = urgencyLevel === 'critical'
    ? `Your academy has critical items requiring immediate attention. ${topAction.rationale}`
    : urgencyLevel === 'high'
    ? `There are high-priority items to address. ${topAction.rationale}`
    : urgencyLevel === 'medium'
    ? `A few items need your attention. ${topAction.rationale}`
    : `Academy is operating smoothly. ${topAction.rationale}`

  return {
    topAction,
    rankedActions,
    reasoning,
    urgencyLevel,
  }
}
