// Mega Sprint 2441–2470 — DONNA Recommendation Reasoning + Follow-Up V1
// Lifecycle mapping for the recommendation_status DB enum.
// Pure TypeScript — no DB, no React, no side effects.
//
// DB enum: pending_review | approved | modified | overridden | rejected | in_progress | completed | expired
// Director-facing lifecycle: pending | approved | rejected | executed | verified | expired

export type RecommendationLifecycleStatus =
  | 'pending'   // pending_review — waiting for director action
  | 'approved'  // approved or modified — director said yes
  | 'rejected'  // rejected or overridden — director said no
  | 'executed'  // in_progress — being acted on
  | 'verified'  // completed — outcome confirmed
  | 'expired'   // expired — too old to act on

export function mapDbStatusToLifecycle(dbStatus: string): RecommendationLifecycleStatus {
  switch (dbStatus) {
    case 'pending_review': return 'pending'
    case 'approved':
    case 'modified':       return 'approved'
    case 'rejected':
    case 'overridden':     return 'rejected'
    case 'in_progress':    return 'executed'
    case 'completed':      return 'verified'
    case 'expired':        return 'expired'
    default:               return 'pending'
  }
}

export function lifecycleLabel(status: RecommendationLifecycleStatus): string {
  switch (status) {
    case 'pending':  return 'Pending Review'
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'executed': return 'In Progress'
    case 'verified': return 'Completed'
    case 'expired':  return 'Expired'
  }
}

export function isActiveLifecycle(status: RecommendationLifecycleStatus): boolean {
  return status === 'pending' || status === 'approved' || status === 'executed'
}

export function confidenceScoreToLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 0.75) return 'High'
  if (score >= 0.45) return 'Medium'
  return 'Low'
}

export function recommendationOwner(type: string): 'director' | 'head_coach' | 'coach' {
  if (/advancement|placement|curriculum|assessment/i.test(type)) return 'director'
  if (/session|training/i.test(type)) return 'head_coach'
  return 'director'
}

export function expectedImpactForType(type: string, playerName: string): string {
  const name = playerName || 'the player'
  if (/advancement/i.test(type)) return `${name} moves to the appropriate challenge level, preventing stagnation`
  if (/assessment/i.test(type)) return `Establishes an objective development baseline for ${name}`
  if (/placement/i.test(type)) return `${name} is placed in the right level and group for development`
  if (/curriculum/i.test(type)) return `Session quality improves for ${name}'s level`
  if (/parent/i.test(type)) return `Parent trust and engagement improves for ${name}`
  if (/attendance/i.test(type)) return `Attendance record corrected; development tracking stays accurate`
  return `Appropriate action taken for ${name}`
}

export function riskIfIgnoredForType(type: string): string {
  if (/advancement/i.test(type)) return 'Player stagnates at incorrect level; motivation and development suffer'
  if (/assessment/i.test(type)) return 'Advancement decisions made without evidence; risk of incorrect level placement'
  if (/placement/i.test(type)) return 'Player remains without a clear development path'
  if (/curriculum/i.test(type)) return 'Session inconsistency continues; coaches lack shared reference'
  if (/parent/i.test(type)) return 'Parent communication gap widens; trust erodes over time'
  return 'Unresolved signal may compound into a larger issue'
}
