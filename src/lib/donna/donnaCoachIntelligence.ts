// Sprint 953 — Coach Follow-Through Intelligence V1
// Aggregate coach follow-through signals for director visibility.
// Pure TypeScript — read-only, no DB calls, no mutations.
// Tone: supportive context, not surveillance or ranking.

export interface CoachFollowThroughSignal {
  coachId: string
  coachName: string
  wrapUpCompletionRate: number    // 0-1 (ratio of sessions with wrap-ups submitted)
  pendingClarifications: number   // director-requested clarifications not yet answered
  observationQuality: 'high' | 'medium' | 'low' | 'unknown'
  lastWrapUpDaysAgo: number | null
}

export interface CoachFollowThroughSummary {
  coachId: string
  coachName: string
  status: 'on_track' | 'needs_support' | 'attention_needed'
  message: string
  supportNote: string
}

export function evaluateCoachFollowThrough(
  signal: CoachFollowThroughSignal,
): CoachFollowThroughSummary {
  const { coachId, coachName } = signal

  if (signal.pendingClarifications >= 2) {
    return {
      coachId, coachName,
      status: 'attention_needed',
      message: `${coachName} has ${signal.pendingClarifications} unresolved director clarifications.`,
      supportNote: 'These may indicate the coach needs more guidance on what the director expects from wrap-ups.',
    }
  }
  if (signal.wrapUpCompletionRate < 0.6) {
    return {
      coachId, coachName,
      status: 'needs_support',
      message: `${coachName}'s wrap-up completion rate is ${Math.round(signal.wrapUpCompletionRate * 100)}%.`,
      supportNote: 'Consider a brief check-in to understand any obstacles — not a performance review.',
    }
  }
  if (signal.lastWrapUpDaysAgo !== null && signal.lastWrapUpDaysAgo > 7) {
    return {
      coachId, coachName,
      status: 'needs_support',
      message: `${coachName}'s last wrap-up was ${signal.lastWrapUpDaysAgo} days ago.`,
      supportNote: 'A friendly reminder may be all that is needed.',
    }
  }
  return {
    coachId, coachName,
    status: 'on_track',
    message: `${coachName} is submitting wrap-ups consistently.`,
    supportNote: 'No action needed.',
  }
}
