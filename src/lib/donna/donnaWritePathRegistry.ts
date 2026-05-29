// Sprint 917 — DONNA Write Path Registry V1
// Canonical documentation of all DONNA-initiated write paths and their approval compliance.
// Pure TypeScript — no DB calls, no side effects.
//
// Design:
//   Each entry describes a write path that DONNA can initiate (directly or via proposed_actions).
//   "compliant" means the path correctly routes through the required approval level.
//   "gateWired" means assertDonnaApprovalAllowed / requireDonnaApproval has been explicitly called.

import { requireDonnaApproval } from '@/lib/donna/donnaApprovalGate'

export interface DonnaWritePathEntry {
  pathId: string
  actionCategory: string
  description: string
  file: string
  writesTo: string[]
  requiredApprovalLevel: string
  isHighRisk: boolean
  canBeProposed: boolean
  complianceMechanism: 'proposed_actions_state_machine' | 'approval_gate_wired' | 'logging_only' | 'read_only'
  gateWired: boolean
  notes: string
}

function buildEntry(
  pathId: string,
  actionCategory: string,
  description: string,
  file: string,
  writesTo: string[],
  complianceMechanism: DonnaWritePathEntry['complianceMechanism'],
  gateWired: boolean,
  notes: string,
): DonnaWritePathEntry {
  const gate = requireDonnaApproval(actionCategory)
  return {
    pathId,
    actionCategory,
    description,
    file,
    writesTo,
    requiredApprovalLevel: gate.requiredLevel,
    isHighRisk: gate.isHighRisk,
    canBeProposed: gate.canBeProposed,
    complianceMechanism,
    gateWired,
    notes,
  }
}

export const DONNA_WRITE_PATH_REGISTRY: DonnaWritePathEntry[] = [
  // ── High-risk apply paths (Sprint 917 gate-wired) ─────────────────────────

  buildEntry(
    'curriculum_adjustment_apply',
    'curriculum_edit',
    'Applies an approved curriculum adjustment to academy_curriculum_overrides',
    'src/app/director/_actions/donnaCurriculumAdjustmentApplyActions.ts',
    ['academy_curriculum_overrides', 'audit_logs', 'proposed_actions'],
    'approval_gate_wired',
    true,
    'Requires proposed_action.status=approved. Gate wired (Sprint 917): assertDonnaApprovalAllowed(curriculum_edit, director_approval).',
  ),

  buildEntry(
    'level_movement_apply',
    'level_movement',
    'Applies an approved level movement to player_curriculum_states and players',
    'src/app/director/_actions/donnaLevelMovementActions.ts',
    ['player_curriculum_states', 'players', 'audit_logs', 'proposed_actions'],
    'approval_gate_wired',
    true,
    'Requires proposed_action.status=approved. Gate wired (Sprint 917): assertDonnaApprovalAllowed(level_movement, director_approval).',
  ),

  // ── Draft-creation paths (proposed_actions state machine compliance) ───────

  buildEntry(
    'curriculum_draft_create',
    'curriculum_draft_create',
    'Creates a curriculum change draft in proposed_actions (pending_review)',
    'src/lib/donna/* (God Mode 34-interceptor + curriculum_draft_create intent)',
    ['proposed_actions'],
    'proposed_actions_state_machine',
    false,
    'Creates proposed_action with status=pending_review. Curriculum draft never auto-executed. Sprint 918+ will wire explicit gate.',
  ),

  buildEntry(
    'parent_communication_draft',
    'parent_communication',
    'Creates a parent communication draft in proposed_actions (pending_review)',
    'src/app/director/_actions/donnaDirectorIntelligenceActions.ts',
    ['proposed_actions'],
    'proposed_actions_state_machine',
    false,
    'Creates proposed_action with status=pending_review. No message sent. Director must approve.',
  ),

  buildEntry(
    'attendance_exception_draft',
    'attendance_exception',
    'Creates an attendance exception draft in proposed_actions (pending_review)',
    'src/app/director/_actions/donnaAttendanceActions.ts',
    ['proposed_actions'],
    'proposed_actions_state_machine',
    false,
    'Creates proposed_action with status=pending_review. No session_attendance row written until director approves.',
  ),

  buildEntry(
    'level_review_draft',
    'level_movement',
    'Creates a level readiness review draft in proposed_actions (pending_review)',
    'src/app/director/_actions/donnaDirectorIntelligenceActions.ts',
    ['proposed_actions'],
    'proposed_actions_state_machine',
    false,
    'Creates proposed_action with status=pending_review. Player level not changed until approved + applied.',
  ),

  buildEntry(
    'intelligence_draft_review',
    'recommend',
    'Updates proposed_actions.status for review decisions (approve/reject/clarify)',
    'src/app/director/_actions/donnaIntelligenceDraftReviewActions.ts',
    ['proposed_actions'],
    'proposed_actions_state_machine',
    false,
    'Only updates status field — never touches payload, player profiles, curriculum, or sessions.',
  ),

  // ── Internal DONNA state (no approval gate required) ─────────────────────

  buildEntry(
    'conversation_persistence',
    'recommend',
    'Persists DONNA conversation sessions, messages, working memory',
    'src/lib/donna/donnaConversationPersistence.ts',
    ['donna_conversation_sessions', 'donna_conversation_messages', 'donna_working_memory'],
    'logging_only',
    false,
    'DONNA internal state only. No content mutations. No approval gate needed.',
  ),

  buildEntry(
    'event_ledger',
    'recommend',
    'Writes audit events to donna_events',
    'src/lib/donna/donnaEventLedger.ts',
    ['donna_events'],
    'logging_only',
    false,
    'Audit log writes only. No content mutations. No approval gate needed.',
  ),

  buildEntry(
    'recommendation_feedback',
    'recommend',
    'Creates recommendation rows and records director feedback',
    'src/lib/donna/donnaRecommendationFeedback.ts',
    ['donna_recommendations', 'donna_recommendation_feedback'],
    'logging_only',
    false,
    'Logging only. No content mutations. Gate check via assertDonnaApprovalAllowed(recommend) in donnaReviewFeedbackAction (Sprint 916).',
  ),

  buildEntry(
    'entity_summaries',
    'recommend',
    'Upserts DONNA entity summaries',
    'src/lib/donna/donnaEntitySummaries.ts',
    ['donna_entity_summaries'],
    'logging_only',
    false,
    'DONNA internal summaries. Not exposed as official mutations. No approval gate needed.',
  ),
]

// ── Compliance summary ─────────────────────────────────────────────────────────

export function getWritePathCompliance(): {
  totalPaths: number
  gateWiredCount: number
  stateMachineCompliantCount: number
  loggingOnlyCount: number
  uncoveredHighRiskCount: number
} {
  const total = DONNA_WRITE_PATH_REGISTRY.length
  const gateWired = DONNA_WRITE_PATH_REGISTRY.filter(e => e.gateWired).length
  const stateMachine = DONNA_WRITE_PATH_REGISTRY.filter(e => e.complianceMechanism === 'proposed_actions_state_machine').length
  const loggingOnly = DONNA_WRITE_PATH_REGISTRY.filter(e => e.complianceMechanism === 'logging_only').length
  const uncoveredHighRisk = DONNA_WRITE_PATH_REGISTRY.filter(
    e => e.isHighRisk && !e.gateWired && e.complianceMechanism !== 'logging_only'
  ).length

  return {
    totalPaths: total,
    gateWiredCount: gateWired,
    stateMachineCompliantCount: stateMachine,
    loggingOnlyCount: loggingOnly,
    uncoveredHighRiskCount: uncoveredHighRisk,
  }
}
