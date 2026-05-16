// Donna Object Resolution Types — Sprint 269
// Defines the shapes for resolving real Academy OS objects from user input
// (names, descriptions, dates) into confirmed database IDs.
//
// Resolution is always director-confirmed — Donna may propose candidates
// but NEVER auto-selects or applies changes without explicit user approval.

import type { DonnaTaskId } from './donnaTaskContracts'

// ---------------------------------------------------------------------------
// Object types that can be resolved
// ---------------------------------------------------------------------------

export type DonnaResolvableObjectType =
  | 'player'
  | 'group'
  | 'coach'
  | 'session'
  | 'class_template'
  | 'fitness_template'
  | 'parent_guardian'

// ---------------------------------------------------------------------------
// A single candidate returned by the resolver
// ---------------------------------------------------------------------------

export interface DonnaResolvedObjectCandidate {
  id: string
  type: DonnaResolvableObjectType
  label: string
  subtitle?: string
  metadata?: Record<string, string>
  confidence: 'low' | 'medium' | 'high'
}

// ---------------------------------------------------------------------------
// A resolution request — what Donna is trying to match
// ---------------------------------------------------------------------------

export interface DonnaObjectResolutionRequest {
  objectType: DonnaResolvableObjectType
  query: string
  /** The draft field this resolution is for — used to store confirmed ID */
  forFieldId: string
}

// ---------------------------------------------------------------------------
// Resolution outcome status
// ---------------------------------------------------------------------------

export type DonnaObjectResolutionStatus =
  | 'resolved_single'  // exactly one strong match — still needs director confirmation
  | 'multiple_matches' // two or more matches — director must choose
  | 'no_match'         // nothing found — director must clarify
  | 'not_supported'    // object type not yet resolvable
  | 'error'            // server/DB error

// ---------------------------------------------------------------------------
// Full resolution result returned from server action
// ---------------------------------------------------------------------------

export interface DonnaObjectResolutionResult {
  ok: boolean
  objectType: DonnaResolvableObjectType
  query: string
  status: DonnaObjectResolutionStatus
  candidates: DonnaResolvedObjectCandidate[]
  /** Pre-selected ID only if status === 'resolved_single' AND confidence === 'high' */
  selectedId?: string
  message: string
  safetyNotes: string[]
}

// ---------------------------------------------------------------------------
// Field resolution map — which task fields need object resolution
// Keyed by taskId, then by fieldId → the object type to resolve
// ---------------------------------------------------------------------------

export const FIELD_RESOLUTION_MAP: Partial<
  Record<DonnaTaskId, Partial<Record<string, DonnaResolvableObjectType>>>
> = {
  capture_coach_note: {
    player: 'player',
    session_context: 'session',
  },
  draft_parent_update: {
    player: 'player',
  },
  draft_player_note: {
    player: 'player',
  },
  review_level_readiness: {
    player: 'player',
  },
  summarize_player_progress: {
    player: 'player',
  },
  handle_attendance_exception: {
    session_or_group: 'session',
  },
  assign_player_to_group: {
    player: 'player',
    group: 'group',
  },
  create_session: {
    group: 'group',
    coach: 'coach',
    template: 'class_template',
  },
  populate_session_from_template: {
    session: 'session',
    template: 'class_template',
  },
  draft_session_brief: {
    session: 'session',
  },
  draft_coach_brief: {
    coach: 'coach',
  },
  create_group: {
    coach: 'coach',
  },
  recommend_template_for_group: {
    group_or_players: 'group',
  },
}

// ---------------------------------------------------------------------------
// Helper: does this field in this task need resolution?
// ---------------------------------------------------------------------------

export function fieldNeedsResolution(
  taskId: DonnaTaskId,
  fieldId: string,
): DonnaResolvableObjectType | null {
  return FIELD_RESOLUTION_MAP[taskId]?.[fieldId] ?? null
}

// ---------------------------------------------------------------------------
// Helper: is a string value a likely user-typed name (not a UUID or confirmed ID)?
// UUIDs look like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
// ---------------------------------------------------------------------------

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function looksLikeUserTypedName(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (UUID_PATTERN.test(trimmed)) return false
  // Already-confirmed labels end with " ✓" — skip re-resolution
  if (trimmed.endsWith(' ✓')) return false
  return true
}
