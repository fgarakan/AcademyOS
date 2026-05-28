// Sprint 914.8 — DONNA Response Schema V1
// Structured response type that enriches existing DonnaSafeReadAnswer with metadata
// for event logging, context packet, and future action layers.
//
// Design:
//   - DonnaSafeReadAnswer remains the primary rendering type (unchanged)
//   - DonnaResponseSchema is an OPTIONAL enrichment layer
//   - createDonnaResponse() produces the schema from a chat message
//   - UI still renders ChatMessage.text — no rendering behavior changes
//
// Pure TypeScript — no DB calls, no mutations, no side effects.

import type { DonnaUnifiedIntentType } from '@/lib/donna/donnaIntentRouterV1'

// ── Schema types ───────────────────────────────────────────────────────────────

export interface DonnaProposedActionRef {
  actionId: string
  label: string
  requiresApproval: boolean
  href: string | null
}

export interface DonnaSuggestedUiOp {
  operation: 'navigate' | 'highlight' | 'show_panel' | 'refresh' | 'none'
  target?: string | null
  label?: string | null
}

export interface DonnaResponseSchema {
  /** The text shown to the director — always present */
  responseText: string
  /** Unified intent classification */
  intent: DonnaUnifiedIntentType | string | null
  /** Data confidence level */
  confidence: 'high' | 'medium' | 'low' | 'partial' | 'insufficient' | null
  /** Whether any proposed action requires director approval */
  requiresApproval: boolean
  /** Actions proposed (all require approval before execution) */
  proposedActions: DonnaProposedActionRef[]
  /** Suggested UI operations (non-mutating hints only) */
  suggestedUiOperations: DonnaSuggestedUiOp[]
  /** Safe metadata for event log — no raw IDs, no sensitive content */
  eventLogPayload: Record<string, unknown> | null
  /** Where DONNA's data came from */
  sourceContext: string | null
  /** Follow-up question DONNA offers */
  followUpQuestion: string | null
  /** Safety note if approval required */
  safetyNote: string | null
  /** Free-form metadata for debugging / future use */
  metadata: Record<string, unknown>
}

// ── Builder input ──────────────────────────────────────────────────────────────

export interface CreateDonnaResponseInput {
  responseText: string
  intent?: DonnaUnifiedIntentType | string | null
  confidence?: 'high' | 'medium' | 'low' | 'partial' | 'insufficient' | null
  requiresApproval?: boolean
  sourceContext?: string | null
  followUpQuestion?: string | null
  safetyNote?: string | null
  proposedActions?: DonnaProposedActionRef[]
  suggestedUiOperations?: DonnaSuggestedUiOp[]
  eventLogPayload?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Creates a DonnaResponseSchema from a DONNA response.
 * Called alongside existing DonnaSafeReadAnswer rendering — does not replace it.
 * The schema is used for event logging, message metadata, and future routing.
 */
export function createDonnaResponse(input: CreateDonnaResponseInput): DonnaResponseSchema {
  return {
    responseText:          input.responseText,
    intent:                input.intent ?? null,
    confidence:            input.confidence ?? null,
    requiresApproval:      input.requiresApproval ?? false,
    proposedActions:       input.proposedActions ?? [],
    suggestedUiOperations: input.suggestedUiOperations ?? [],
    eventLogPayload:       input.eventLogPayload ?? null,
    sourceContext:         input.sourceContext ?? null,
    followUpQuestion:      input.followUpQuestion ?? null,
    safetyNote:            input.safetyNote ?? null,
    metadata:              input.metadata ?? {},
  }
}

/**
 * Converts a ChatMessage-like object into a DonnaResponseSchema.
 * Used when persisting DONNA messages to inject structured metadata.
 * Falls back gracefully — any missing field is null.
 */
export function schemaFromChatMessage(msg: {
  text?: string | null
  confidence?: string | null
  sourceNote?: string | null
  followUp?: string | null
  followUpHref?: string | null
  intent?: string | null
}): DonnaResponseSchema {
  const proposedActions: DonnaProposedActionRef[] = []
  if (msg.followUp && msg.followUpHref) {
    proposedActions.push({
      actionId:        'follow_up_nav',
      label:           msg.followUp,
      requiresApproval: false,
      href:            msg.followUpHref,
    })
  }

  return createDonnaResponse({
    responseText:     msg.text ?? '',
    intent:           (msg.intent as DonnaUnifiedIntentType) ?? null,
    confidence:       (msg.confidence as DonnaResponseSchema['confidence']) ?? null,
    sourceContext:    msg.sourceNote ?? null,
    followUpQuestion: msg.followUp ?? null,
    proposedActions,
  })
}

// ── Safe metadata extractor ────────────────────────────────────────────────────

/**
 * Extracts a safe, non-sensitive event log payload from a schema.
 * Strips any fields that could expose raw IDs or sensitive content.
 */
export function safeEventLogPayload(schema: DonnaResponseSchema): Record<string, unknown> {
  return {
    intent:             schema.intent,
    confidence:         schema.confidence,
    requiresApproval:   schema.requiresApproval,
    hasProposedActions: schema.proposedActions.length > 0,
    suggestedOps:       schema.suggestedUiOperations.map(op => op.operation),
    sourceContext:      schema.sourceContext,
  }
}
