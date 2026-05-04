// Sprint 248 — Voice Safety and Role Guardrails V1
// Pure utility. No DB calls. No side effects.
// Governs which roles can create which voice intents.
// Complements voiceDestinationRouter (which governs destination routing).

import type { VoiceIntakeRole, VoiceIntakeIntentType } from './voiceIntakeTypes'

// ── Intent permission matrix ──────────────────────────────────────────────────
//
// Director-only intents: require academy_director or head_coach
// Coach intents: require coach, head_coach, or academy_director
// All intents: allowed for all voice roles

const DIRECTOR_ONLY_INTENTS = new Set<VoiceIntakeIntentType>([
  'create_session_draft',
  'create_group_draft',
  'set_group_focus',
  'create_player_review_request',
  'create_parent_safe_draft',
  'summarize_curriculum_gaps',
  'create_coach_briefing',
  'record_director_note',
])

const COACH_INTENTS = new Set<VoiceIntakeIntentType>([
  'record_attendance_exception',
  'flag_unrostered_attendee',
  'create_player_observation',
  'create_gate_evidence_draft',
  'create_session_recap',
  'create_gap_signal',
  'create_parent_safe_candidate',
  'alert_director',
])

// These intents always require director/head_coach approval before any execution.
// All voice intents currently go through proposed_actions (pending_review) — this
// set identifies intents that additionally should never auto-execute even if approved.
const APPROVAL_REQUIRED_INTENTS = new Set<VoiceIntakeIntentType>([
  'create_session_draft',
  'create_group_draft',
  'set_group_focus',
  'create_player_review_request',
  'create_parent_safe_draft',
  'create_coach_briefing',
  'record_director_note',
  'record_attendance_exception',
  'flag_unrostered_attendee',
  'create_player_observation',
  'create_gate_evidence_draft',
  'create_session_recap',
  'create_gap_signal',
  'create_parent_safe_candidate',
])

// These intents must never be executed automatically under any circumstances.
const HARD_BLOCKED_AUTO_INTENTS = new Set<VoiceIntakeIntentType>([
  'create_parent_safe_draft',
  'create_parent_safe_candidate',
  'create_player_review_request',
])

// ── Blocked reason messages ───────────────────────────────────────────────────

const DIRECTOR_ONLY_BLOCKED_REASONS: Record<string, string> = {
  create_session_draft: 'Session draft creation requires Director or Head Coach role.',
  create_group_draft: 'Group draft creation requires Director or Head Coach role.',
  set_group_focus: 'Setting group focus requires Director or Head Coach role.',
  create_player_review_request: 'Player review requests require Director or Head Coach role.',
  create_parent_safe_draft: 'Parent-safe drafts require Director or Head Coach role — never accessible to coaches.',
  summarize_curriculum_gaps: 'Curriculum gap queries require Director or Head Coach role.',
  create_coach_briefing: 'Coach briefing drafts require Director or Head Coach role.',
  record_director_note: 'Director notes require Director or Head Coach role.',
}

// ── Exported permission functions ─────────────────────────────────────────────

export function canRoleCreateVoiceIntent(
  role: VoiceIntakeRole,
  intent: VoiceIntakeIntentType,
): boolean {
  if (intent === 'unknown') return true

  if (role === 'academy_director' || role === 'head_coach') {
    return DIRECTOR_ONLY_INTENTS.has(intent) || COACH_INTENTS.has(intent)
  }

  if (role === 'coach') {
    return COACH_INTENTS.has(intent)
  }

  return false
}

export function getVoiceBlockedReason(
  role: VoiceIntakeRole,
  intent: VoiceIntakeIntentType,
): string | null {
  if (canRoleCreateVoiceIntent(role, intent)) return null

  if (DIRECTOR_ONLY_INTENTS.has(intent)) {
    return DIRECTOR_ONLY_BLOCKED_REASONS[intent] ?? `Intent "${intent}" requires Director or Head Coach role.`
  }

  return `The ${role} role does not have permission to create "${intent.replace(/_/g, ' ')}" drafts.`
}

export function getVoiceIntentsForRole(role: VoiceIntakeRole): VoiceIntakeIntentType[] {
  if (role === 'academy_director' || role === 'head_coach') {
    return [
      ...Array.from(DIRECTOR_ONLY_INTENTS),
      ...Array.from(COACH_INTENTS),
      'unknown',
    ]
  }
  if (role === 'coach') {
    return [...Array.from(COACH_INTENTS), 'unknown']
  }
  return ['unknown']
}

export function isVoiceActionIntent(intent: VoiceIntakeIntentType): boolean {
  return intent !== 'unknown' && intent !== 'summarize_curriculum_gaps'
}

export function voiceIntentRequiresApproval(intent: VoiceIntakeIntentType): boolean {
  return APPROVAL_REQUIRED_INTENTS.has(intent)
}

export function isHardBlockedAutoIntent(intent: VoiceIntakeIntentType): boolean {
  return HARD_BLOCKED_AUTO_INTENTS.has(intent)
}
