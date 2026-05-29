// Sprint 952 — Player Development Bottleneck Detection V1
// Detects early player-development bottlenecks from signals.
// Pure TypeScript — read-only, no DB calls, no mutations.
// All recommendations are draft-only; no level movement.

export type BottleneckType =
  | 'no_active_priority'    // Player has no active priority set
  | 'stalled_development'   // No progression signals in recent sessions
  | 'missing_evidence'      // Gates pending but no evidence submitted
  | 'low_attendance'        // Below acceptable attendance threshold
  | 'repeated_attention'    // Coach flagged the same concern multiple times

export interface PlayerBottleneckSignal {
  playerId: string
  playerName: string
  bottleneckType: BottleneckType
  severity: 'critical' | 'warning'
  description: string
  recommendedAction: string
  href: string
}

export type BottleneckDetectionInput = {
  playerId: string
  playerName: string
  hasActivePriority: boolean
  recentSessionCount: number
  progressionSignalCount: number
  pendingGateEvidenceCount: number
  attendanceRate: number // 0-1
  repeatedAttentionNoteCount: number
}

export function detectPlayerBottleneck(input: BottleneckDetectionInput): PlayerBottleneckSignal | null {
  const { playerId, playerName } = input

  if (!input.hasActivePriority) {
    return {
      playerId, playerName,
      bottleneckType: 'no_active_priority',
      severity: 'warning',
      description: `${playerName} has no active development priority assigned.`,
      recommendedAction: 'Assign an active priority to guide their next development phase.',
      href: `/director/players/${playerId}`,
    }
  }
  if (input.recentSessionCount >= 3 && input.progressionSignalCount === 0) {
    return {
      playerId, playerName,
      bottleneckType: 'stalled_development',
      severity: 'warning',
      description: `${playerName} has attended ${input.recentSessionCount} recent sessions with no progression signals.`,
      recommendedAction: 'Review their active priority and check recent coach observations.',
      href: `/director/players/${playerId}`,
    }
  }
  if (input.attendanceRate < 0.6 && input.recentSessionCount >= 5) {
    return {
      playerId, playerName,
      bottleneckType: 'low_attendance',
      severity: 'critical',
      description: `${playerName} has attended fewer than 60% of sessions recently.`,
      recommendedAction: 'Consider a direct conversation with the player or parent.',
      href: `/director/players/${playerId}`,
    }
  }
  if (input.repeatedAttentionNoteCount >= 3) {
    return {
      playerId, playerName,
      bottleneckType: 'repeated_attention',
      severity: 'warning',
      description: `${playerName} has been flagged for the same concern ${input.repeatedAttentionNoteCount} times.`,
      recommendedAction: 'Review observations and consider adjusting the development plan.',
      href: `/director/players/${playerId}`,
    }
  }
  return null
}
