// Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
// DonnaNextBestActionEngine — converts existing engine outputs into NextBestAction.
//
// DESIGN RULE: This engine is a MAPPER, not a new intelligence layer.
// It reads DirectorGuidance + OperatingSignal[] produced by existing engines
// and repackages them as the universal NextBestAction contract.
//
// No new DB queries. No new scoring algorithms. No duplicate priority logic.
// All intelligence is delegated to directorGuidanceEngine.ts.

import type { DirectorGuidance } from '@/lib/donna/operating/directorGuidanceEngine'
import type { OperatingSignal, OperatingSignalDomain } from '@/lib/donna/operating/operatingSignal'
import type { AcademyHealthModelV2 } from '@/lib/donna/operating/academyHealthModelV2'
import type { NextBestAction } from './nextBestAction'

// ── Score helpers ─────────────────────────────────────────────────────────────

function signalToImpactScore(signal: OperatingSignal | null): number {
  if (!signal) return 50
  const base: Record<OperatingSignal['type'], number> = {
    escalation:     95,
    risk:           80,
    attention:      70,
    recommendation: 60,
    opportunity:    50,
  }
  const severityBoost: Record<OperatingSignal['severity'], number> = {
    critical: 15,
    high:     10,
    medium:   5,
    low:      0,
  }
  return Math.min(100, (base[signal.type] ?? 60) + (severityBoost[signal.severity] ?? 0))
}

function signalToUrgencyScore(signal: OperatingSignal | null): number {
  if (!signal) return 40
  const severityBase: Record<OperatingSignal['severity'], number> = {
    critical: 90,
    high:     75,
    medium:   50,
    low:      25,
  }
  const agePenalty = signal.isEscalated ? 10 : 0
  return Math.min(100, (severityBase[signal.severity] ?? 40) + agePenalty)
}

function confidenceToScore(confidence: 'high' | 'medium' | 'low'): number {
  return { high: 90, medium: 70, low: 45 }[confidence] ?? 70
}

// ── Completion criteria ───────────────────────────────────────────────────────

function buildCompletionCriteria(
  signal: OperatingSignal | null,
  guidance: DirectorGuidance,
): string {
  if (!signal) {
    return 'Action reviewed and confirmed as complete. Check back with DONNA.'
  }

  const domain = signal.domain as OperatingSignalDomain
  switch (domain) {
    case 'recommendations':
      return 'All pending approvals reviewed — each item approved, deferred, or rejected in the review queue.'
    case 'players':
      return signal.type === 'opportunity'
        ? 'Advancement confirmed — player curriculum state updated to next level.'
        : 'Player recommendation addressed — note logged and follow-up action taken.'
    case 'coaches':
      return 'Coach session recap reviewed — attendance and observations confirmed.'
    case 'parents':
      return 'Parent outreach sent — communication logged in the player profile.'
    case 'assessments':
      return 'Assessment submitted — data visible in the player assessment tab.'
    case 'curriculum':
      return 'Curriculum update saved — changes confirmed in the curriculum editor.'
    case 'attendance':
      return 'Attendance exception resolved — exception noted or escalated in the session.'
    case 'academy':
      return 'Academy-level review completed — all flagged items addressed or deferred.'
    default:
      return guidance.riskIfIgnored
        ? `Risk addressed: ${guidance.riskIfIgnored}`
        : 'Action completed — verify the relevant section reflects the change.'
  }
}

// ── Action ID ─────────────────────────────────────────────────────────────────

function buildActionId(signal: OperatingSignal | null, guidance: DirectorGuidance): string {
  if (signal) return signal.id
  // Synthetic ID from guidance when no signal available
  const base = guidance.highestLeverageAction.slice(0, 40).replace(/\s+/g, '-').toLowerCase()
  return `guidance:${base}`
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Convert DirectorGuidance + signals into a NextBestAction.
 *
 * @param guidance   - Output of buildDirectorGuidance()
 * @param signals    - All operating signals, sorted by priority
 * @param health     - Current academy health model
 * @param completedIds - Signal IDs completed this session — these are skipped
 */
export function buildNextBestAction(
  guidance:     DirectorGuidance,
  signals:      OperatingSignal[],
  health:       AcademyHealthModelV2,
  completedIds: string[] = [],
): NextBestAction | null {
  // Find the top non-completed signal
  const topSignal = signals.find(s => !completedIds.includes(s.id)) ?? null

  // If all signals are completed and no guidance, nothing left
  if (!topSignal && !guidance.sourceSignal && completedIds.length > 0) {
    return null
  }

  // Use top non-completed signal or fall back to guidance source
  const signal = topSignal ?? guidance.sourceSignal ?? null

  // Recompute guidance with skipped signals if necessary
  // (We reuse guidance.* fields — they already reflect the top signal from the full run)
  const isGuidanceStale = signal !== guidance.sourceSignal && signal !== null

  const title = isGuidanceStale
    ? signal!.suggestedAction
    : guidance.highestLeverageAction

  const description = isGuidanceStale
    ? signal!.reason
    : guidance.whyItMatters

  const route = isGuidanceStale
    ? signal!.targetEntityRoute
    : guidance.navigationTarget

  const alternativeHint = isGuidanceStale
    ? (guidance.alternativeActions[0] ?? null)
    : (guidance.alternativeActions[0] ?? null)

  return {
    id:                 buildActionId(signal, guidance),
    title,
    description,
    reason:             signal?.reason ?? guidance.whyItMatters,
    impactScore:        signalToImpactScore(signal),
    urgencyScore:       signalToUrgencyScore(signal),
    confidenceScore:    confidenceToScore(guidance.confidence),
    domain:             signal?.domain ?? 'academy',
    entityType:         signal?.domain ?? null,
    entityId:           signal?.targetEntityRoute ?? null,
    route,
    completionCriteria: buildCompletionCriteria(signal, guidance),
    nextActionHint:     alternativeHint,
    estimatedMinutes:   guidance.timeEstimate,
  }
}
