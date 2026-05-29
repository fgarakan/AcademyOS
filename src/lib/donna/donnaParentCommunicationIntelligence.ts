// Sprint 955 — Parent Communication Intelligence V1
// Identifies where parent-safe communication should happen.
// Pure TypeScript — read-only, no DB calls, no mutations.
// No automatic send. Director approval required for all communications.

import { getSafetyMessage } from './donnaPersonality'

export type ParentCommOpportunityType =
  | 'new_applied_observation'   // Recent observation approved and applied
  | 'repeated_priority_signal'  // Same priority signaled 3+ sessions
  | 'summary_ready'             // Coach-approved summary ready to send
  | 'communication_gap_aging'   // No parent communication in N days

export interface ParentCommOpportunity {
  type: ParentCommOpportunityType
  playerId: string
  playerName: string
  parentId: string | null
  urgency: 'high' | 'medium' | 'low'
  description: string
  draftAction: string
  safetyNote: string
  href: string
}

export interface ParentCommInput {
  playerId: string
  playerName: string
  parentId: string | null
  hasNewAppliedObservation: boolean
  repeatedPriorityCount: number
  parentSafeSummaryReady: boolean
  daysSinceLastCommunication: number | null
}

export function detectParentCommOpportunity(
  input: ParentCommInput,
): ParentCommOpportunity | null {
  const { playerId, playerName, parentId } = input
  const safetyNote = getSafetyMessage('noAutoSend')
  const href = `/director/players/${playerId}`

  if (input.hasNewAppliedObservation) {
    return {
      type: 'new_applied_observation',
      playerId, playerName, parentId,
      urgency: 'medium',
      description: `${playerName} has a new applied observation that could be shared as a parent update.`,
      draftAction: 'Draft a parent-safe summary for your review and approval before sending.',
      safetyNote,
      href,
    }
  }
  if (input.repeatedPriorityCount >= 3) {
    return {
      type: 'repeated_priority_signal',
      playerId, playerName, parentId,
      urgency: 'medium',
      description: `${playerName}'s coach has flagged the same priority across ${input.repeatedPriorityCount} sessions — parents may benefit from context.`,
      draftAction: 'Draft a parent-safe explanation of this development focus for your review.',
      safetyNote,
      href,
    }
  }
  if (input.parentSafeSummaryReady) {
    return {
      type: 'summary_ready',
      playerId, playerName, parentId,
      urgency: 'low',
      description: `A parent-safe progress summary is available for ${playerName}.`,
      draftAction: 'Review the draft summary and approve it when ready.',
      safetyNote,
      href,
    }
  }
  if (input.daysSinceLastCommunication !== null && input.daysSinceLastCommunication > 30) {
    return {
      type: 'communication_gap_aging',
      playerId, playerName, parentId,
      urgency: 'low',
      description: `No parent communication for ${playerName} in ${input.daysSinceLastCommunication} days.`,
      draftAction: 'Consider drafting a brief progress update when next observations are approved.',
      safetyNote,
      href,
    }
  }
  return null
}
