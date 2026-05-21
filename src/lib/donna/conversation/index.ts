// Sprint 462 — DONNA Conversational Core V1
// Organizational index for the DONNA conversation subsystem.
// Re-exports the canonical types and helpers from the conversational layer.
// All conversation state is session-scoped — no cross-session persistence without approval.

// Conversation state machine types
export type {
  ConversationState,
  MessageRole,
  MessageKind,
} from '../conversationTypes'

// Session-scoped memory (in-process, no DB)
export type { SessionMemoryEntry, SessionMemoryEntryStatus } from '../donnaSessionMemory'

// Multi-step flow state machine
export type { DonnaFlowStep } from '../donnaMultiStepFlow'

// Intent classification
export type { IntentClassificationResult } from '../donnaIntentClassifier'

// Confidence model
export type { DONNAConfidence } from '../donnaCOOAnswerEngine'
export { deriveConfidenceFromStatuses } from '../donnaConfidence'

// Role boundaries — what DONNA can and cannot do per role
export { DONNA_ROLE_BLOCKS, getRoleBlock, isActionBlockedForRole } from '../donnaRoleBlocks'

// Draft-only action validation
export type { DonnaDraftPayload, DraftValidationResult } from '../donnaDraftOnlyActions'

// Safe read actions — formatted answer shapes
export type { DonnaSafeReadAnswer } from '../donnaSafeReadActions'

// Boundary responses — canned refusals for out-of-scope requests
export {
  buildRoleRestrictionResponse,
  buildNoDataYetResponse,
  buildNotBuiltResponse,
  buildOutOfScopeResponse,
  buildApprovalRequiredResponse,
} from '../donnaBoundaryResponses'

// ── Conversational context rules (docs for future AI prompt engineering) ──────

// DONNA conversational behavior rules (enforced via prompt context + guardrails):
// 1. DONNA always answers within the academy context — no general internet knowledge
// 2. DONNA surfaces evidence and data sources in every answer
// 3. DONNA asks one clarifying question at a time, not a list
// 4. DONNA remembers the current screen context within the same flow
// 5. DONNA always offers "I'll create a draft" not "I've done X"
// 6. DONNA uses academy-specific terminology (group names, level names)
// 7. DONNA never invents data — if unknown, says so with confidence level
// 8. All proposed actions go through the approval pipeline

export const DONNA_CONVERSATION_RULES = [
  'Answer only within academy context. No general internet knowledge.',
  'Cite evidence and data source in every substantive answer.',
  'Ask one clarifying question at a time.',
  'Offer structured drafts, not direct mutations.',
  'Say "I don\'t have enough data" when uncertain — never invent.',
  'Use academy-specific names (level, group, coach names from context).',
  'Respect the proposed_actions approval pipeline for all sensitive actions.',
] as const
