// Sprint 1033 — DONNA Ask Anything Role Boundaries V1
// Boundary response vocabulary for when DONNA cannot answer a question.
// Handles: role restrictions, out-of-scope queries, schema gaps, unknown questions.
// DONNA never silently fails — always explains why and offers an alternative.
// No DB calls. No DB writes.

import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'
import type { ChatMessage } from '@/components/donna/DonnaChatThread'

// ── Boundary types ────────────────────────────────────────────────────────────

export type BoundaryReason =
  | 'role_restriction'         // Coach asked director-only question
  | 'schema_gap'               // Data requires pending migration
  | 'no_data_yet'              // System not yet populated
  | 'not_built'                // Feature is deferred/future
  | 'out_of_scope'             // Question outside DONNA's domain
  | 'ambiguous_question'       // Could not determine intent
  | 'action_requires_approval' // Action needs director sign-off
  | 'parent_send_not_built'    // Parent send flow deferred
  | 'data_unavailable'         // Specific data point not available

export interface DonnaBoundaryResponse {
  text: string
  reason: BoundaryReason
  alternative: string | null
  alternativeActionId: string | null
  alternativeHref: string | null
  confidenceKind: 'blocked' | 'insufficient'
}

// ── Response builders ─────────────────────────────────────────────────────────

export function buildRoleRestrictionResponse(
  questionText: string,
  role: DonnaRole,
  suggestedAlternative: string | null = null,
): DonnaBoundaryResponse {
  const roleLabel = role === 'coach' ? 'coaches' : 'directors'
  return {
    text: `That information is available to directors, not ${roleLabel}. ${suggestedAlternative ? `Instead, ${suggestedAlternative}.` : 'You can ask your director to check this.'}`,
    reason: 'role_restriction',
    alternative: suggestedAlternative,
    alternativeActionId: null,
    alternativeHref: null,
    confidenceKind: 'blocked',
  }
}

export function buildSchemaGapResponse(featureLabel: string): DonnaBoundaryResponse {
  return {
    text: `I don't have ${featureLabel.toLowerCase()} data yet — this requires a database migration that hasn't been applied. Once the migration is applied, this will be available.`,
    reason: 'schema_gap',
    alternative: 'Check back after the migration is applied.',
    alternativeActionId: null,
    alternativeHref: null,
    confidenceKind: 'insufficient',
  }
}

export function buildNoDataYetResponse(domain: string): DonnaBoundaryResponse {
  return {
    text: `I don't have ${domain.toLowerCase()} data yet. This will populate as coaches and players use the system.`,
    reason: 'no_data_yet',
    alternative: 'Complete some sessions and wrap-ups to see this data.',
    alternativeActionId: null,
    alternativeHref: null,
    confidenceKind: 'insufficient',
  }
}

export function buildNotBuiltResponse(featureLabel: string): DonnaBoundaryResponse {
  return {
    text: `${featureLabel} isn't available yet — it's on the roadmap for a future sprint.`,
    reason: 'not_built',
    alternative: null,
    alternativeActionId: null,
    alternativeHref: null,
    confidenceKind: 'insufficient',
  }
}

export function buildOutOfScopeResponse(): DonnaBoundaryResponse {
  return {
    text: "I'm focused on your academy operations — sessions, players, coaches, and curriculum. I can't help with that, but try asking about sessions, pending reviews, or player attention signals.",
    reason: 'out_of_scope',
    alternative: 'Try asking: "What needs my attention?" or "How are my players doing?"',
    alternativeActionId: 'summarize_today',
    alternativeHref: null,
    confidenceKind: 'insufficient',
  }
}

export function buildAmbiguousQuestionResponse(): DonnaBoundaryResponse {
  return {
    text: "I'm not sure what you're asking. Could you be more specific? For example: \"Which players need attention?\" or \"How many sessions today?\"",
    reason: 'ambiguous_question',
    alternative: 'Try a more specific question.',
    alternativeActionId: null,
    alternativeHref: null,
    confidenceKind: 'insufficient',
  }
}

export function buildApprovalRequiredResponse(actionLabel: string): DonnaBoundaryResponse {
  return {
    text: `${actionLabel} requires director approval before anything changes. I can prepare the proposal for review — would you like me to do that?`,
    reason: 'action_requires_approval',
    alternative: 'I can submit this as a draft for director review.',
    alternativeActionId: null,
    alternativeHref: '/director/review',
    confidenceKind: 'blocked',
  }
}

export function buildParentSendNotBuiltResponse(): DonnaBoundaryResponse {
  return {
    text: "The parent send flow isn't built yet. I can prepare a draft for the director to review — but the actual send capability is coming in a future release.",
    reason: 'parent_send_not_built',
    alternative: 'Submit a draft and the director can decide when to communicate with parents.',
    alternativeActionId: 'capture_note',
    alternativeHref: null,
    confidenceKind: 'insufficient',
  }
}

// ── Topic-based boundary detection ───────────────────────────────────────────

const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
  /\b(weather|sports|news|recipe|joke|game|movie|music|book)\b/i,
  /\b(personal|salary|payroll|invoice|billing)\b/i,
  /\b(code|program|debug|website|app)\b/i,
]

const BLOCKED_COACH_TOPICS: Array<{ pattern: RegExp; response: DonnaBoundaryResponse }> = [
  {
    pattern: /\b(academy.?health|kpi|revenue|retention|all players|all coaches)\b/i,
    response: buildRoleRestrictionResponse(
      '',
      'coach',
      'check your own sessions and player notes',
    ),
  },
  {
    pattern: /\b(approve|reject|level.?move|move.?level|level.?up|level.?down)\b/i,
    response: buildRoleRestrictionResponse(
      '',
      'coach',
      'flag a player for the director to make the level decision',
    ),
  },
  {
    pattern: /\b(send.?parent|parent.?email|parent.?message|notify.?parent)\b/i,
    response: buildParentSendNotBuiltResponse(),
  },
]

// Sprint 740 -- narrowed to only catch live-data queries, not explanations or draft creation.
// "add a gate", "what are gates?", "what is a gate?" must NOT trigger schema gap.
const SCHEMA_GAP_TOPICS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(gate.?progress|gate.?evidence|gate.?completion|gate.?status|passed.?gate|gate.?check.?for)\b/i, label: 'Curriculum gate progress' },
  { pattern: /\b(requirement.?progress|requirement.?completion|level.?requirement.?status)\b/i, label: 'Level requirement progress' },
  { pattern: /\b(track.?requirement|curriculum.?track)\b/i, label: 'Curriculum track requirement' },
]

// ── Question boundary checker ─────────────────────────────────────────────────

export function checkQuestionBoundary(
  question: string,
  role: DonnaRole,
): DonnaBoundaryResponse | null {
  // Out of scope
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(question)) return buildOutOfScopeResponse()
  }

  // Coach-blocked topics
  if (role === 'coach') {
    for (const { pattern, response } of BLOCKED_COACH_TOPICS) {
      if (pattern.test(question)) return response
    }
  }

  // Schema gap topics (both roles)
  for (const { pattern, label } of SCHEMA_GAP_TOPICS) {
    if (pattern.test(question)) return buildSchemaGapResponse(label)
  }

  return null
}

// ── Chat message builder from boundary response ───────────────────────────────

export function buildBoundaryMessage(response: DonnaBoundaryResponse): ChatMessage {
  return {
    id: `donna-boundary-${Date.now()}`,
    role: 'donna',
    kind: 'action_blocked',
    text: response.text,
    timestamp: new Date().toISOString(),
    confidence: response.confidenceKind,
    sourceNote: null,
    followUp: response.alternative ?? undefined,
    followUpHref: response.alternativeHref ?? undefined,
  }
}
