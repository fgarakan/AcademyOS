// Sprint 591 — DONNA Command Router Architecture V1
// Routes classified DONNA intent to the appropriate preview or proposal handler.
// Pure TypeScript — no DB writes, no execution, no external calls.
// All routes return proposals only — director approves before any action is taken.

// ── Intent categories ─────────────────────────────────────────────────────────

export type DonnaCommandCategory =
  | 'attendance'          // mark attendance, flag exception
  | 'session_actual'      // update session notes, intensity, outcome
  | 'coach_observation'   // add player observation, flag concern
  | 'parent_draft'        // draft parent update (blocked from send)
  | 'level_readiness'     // surface readiness signal (no level change)
  | 'curriculum_override' // propose curriculum override (session-level)
  | 'review_queue'        // surface or navigate review queue
  | 'academy_health'      // COO health query (read-only answer)
  | 'wrap_up'             // guide coach wrap-up flow
  | 'unknown'             // unclassified — route to clarification

// ── Dispatch destinations ─────────────────────────────────────────────────────

export type DonnaCommandDestination =
  | 'attendance_preview'
  | 'session_actual_preview'
  | 'observation_preview'
  | 'parent_draft_preview'
  | 'level_readiness_preview'
  | 'curriculum_override_preview'
  | 'review_queue_surface'
  | 'academy_health_answer'
  | 'wrap_up_flow'
  | 'clarification_required'

// ── Route result ──────────────────────────────────────────────────────────────

export interface DonnaRouteResult {
  category: DonnaCommandCategory
  destination: DonnaCommandDestination
  requiresDirectorApproval: boolean
  isReadOnly: boolean
  canAutoRoute: boolean    // false if clarification is needed first
  routingNote: string
}

// ── Route map ─────────────────────────────────────────────────────────────────

const ROUTE_MAP: Record<DonnaCommandCategory, DonnaRouteResult> = {
  attendance: {
    category: 'attendance',
    destination: 'attendance_preview',
    requiresDirectorApproval: true,
    isReadOnly: false,
    canAutoRoute: true,
    routingNote: 'Attendance exception → proposed_actions → director review → AttendanceApplyPreview',
  },
  session_actual: {
    category: 'session_actual',
    destination: 'session_actual_preview',
    requiresDirectorApproval: true,
    isReadOnly: false,
    canAutoRoute: true,
    routingNote: 'Session actual → proposed_actions → director review → SessionActualApplyPreview',
  },
  coach_observation: {
    category: 'coach_observation',
    destination: 'observation_preview',
    requiresDirectorApproval: true,
    isReadOnly: false,
    canAutoRoute: true,
    routingNote: 'Coach observation → proposed_actions → director review → ObservationPlayerProfilePreview',
  },
  parent_draft: {
    category: 'parent_draft',
    destination: 'parent_draft_preview',
    requiresDirectorApproval: true,
    isReadOnly: false,
    canAutoRoute: true,
    routingNote: 'Parent message → draft only (SEND BLOCKED) → director approval before any send',
  },
  level_readiness: {
    category: 'level_readiness',
    destination: 'level_readiness_preview',
    requiresDirectorApproval: true,
    isReadOnly: true,   // preview only — finalize_player_placement() required for actual move
    canAutoRoute: true,
    routingNote: 'Level readiness signal → LevelReadinessApplyPreview → NO movement without director + finalize_player_placement()',
  },
  curriculum_override: {
    category: 'curriculum_override',
    destination: 'curriculum_override_preview',
    requiresDirectorApproval: true,
    isReadOnly: false,
    canAutoRoute: true,
    routingNote: 'Curriculum override → proposed_actions → director review → CurriculumOverrideApplyPreview → curriculum_overrides table only',
  },
  review_queue: {
    category: 'review_queue',
    destination: 'review_queue_surface',
    requiresDirectorApproval: false,
    isReadOnly: true,
    canAutoRoute: true,
    routingNote: 'Review queue surface — read-only COO signal display, no action initiated',
  },
  academy_health: {
    category: 'academy_health',
    destination: 'academy_health_answer',
    requiresDirectorApproval: false,
    isReadOnly: true,
    canAutoRoute: true,
    routingNote: 'COO health query — donnaCOOAnswerEngine.ts answers from pre-fetched context. No write.',
  },
  wrap_up: {
    category: 'wrap_up',
    destination: 'wrap_up_flow',
    requiresDirectorApproval: false,
    isReadOnly: false,
    canAutoRoute: true,
    routingNote: 'Coach wrap-up flow — DonnaConversationalPanel → DonnaVoiceWrapUpShell → draft adapter',
  },
  unknown: {
    category: 'unknown',
    destination: 'clarification_required',
    requiresDirectorApproval: false,
    isReadOnly: true,
    canAutoRoute: false,
    routingNote: 'Intent not classified — must ask clarifying question before routing',
  },
}

// ── Router ────────────────────────────────────────────────────────────────────

export function routeDonnaCommand(category: DonnaCommandCategory): DonnaRouteResult {
  return ROUTE_MAP[category]
}

export function getRouteForCategory(category: DonnaCommandCategory): DonnaCommandDestination {
  return ROUTE_MAP[category].destination
}

export function isReadOnlyRoute(category: DonnaCommandCategory): boolean {
  return ROUTE_MAP[category].isReadOnly
}

export function requiresApproval(category: DonnaCommandCategory): boolean {
  return ROUTE_MAP[category].requiresDirectorApproval
}

// ── Safety invariants (never violated) ───────────────────────────────────────

export const DONNA_ROUTING_INVARIANTS = {
  neverAutoExecute: 'DONNA never executes — all routes produce previews or proposals only.',
  noLevelMovement: 'Level readiness route surfaces preview only. finalize_player_placement() required.',
  noParentSend: 'Parent draft route creates draft only. Send is always blocked at routing layer.',
  directorApprovalRequired: 'All write-capable routes require director approval before system executes.',
  executeApprovedActionOnly: 'execute_approved_action() is the only function that executes approved actions.',
} as const
