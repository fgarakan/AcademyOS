// Mega Sprint 2321–2340 — DONNA Entity Execution Integration V1
// Entity context loader: bridges the existing DirectorDonnaContext (which includes
// player_curriculum_states, groups, templates, assessments) into the AcademyEntityContext
// shape expected by the V2 entity resolver.
// Pure TypeScript — no DB, no React, no side effects.

import type {
  PlayerCurriculumStateSummary,
  GroupSummary,
  TemplateSummary,
  AssessmentSummary,
} from '@/lib/donna/extendedContextLoaders'
import type { AcademyEntityContext } from './donnaEntityResolver'

// ── Minimal slice loaded from the server action ───────────────────────────────

export interface EntityContextSlice {
  players:     PlayerCurriculumStateSummary[]
  groups:      GroupSummary[]
  templates:   TemplateSummary[]
  assessments: AssessmentSummary[]
}

// ── Build entity context from a context slice ─────────────────────────────────

/**
 * Converts a lightweight EntityContextSlice (loaded by the server action)
 * into the AcademyEntityContext shape required by the V2 entity resolver.
 * Coaches and parents are left empty — the current data model does not load
 * them in the entity context slice (honest limitation, not a silent gap).
 */
export function buildEntityContext(slice: EntityContextSlice): AcademyEntityContext {
  return {
    players:     slice.players,
    groups:      slice.groups,
    templates:   slice.templates,
    assessments: slice.assessments,
    coaches:     [],
    parents:     [],
  }
}
