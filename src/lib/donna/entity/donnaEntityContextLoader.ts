// Mega Sprint 2321–2340 — DONNA Entity Execution Integration V1
// Mega Sprint 1475–1504 — Added coaches to EntityContextSlice (BLOCKER 6 fix).
// Entity context loader: bridges the existing DirectorDonnaContext (which includes
// player_curriculum_states, groups, templates, assessments, coaches) into the
// AcademyEntityContext shape expected by the V2 entity resolver.
// Pure TypeScript — no DB, no React, no side effects.

import type {
  PlayerCurriculumStateSummary,
  GroupSummary,
  TemplateSummary,
  AssessmentSummary,
  CoachContextSummary,
} from '@/lib/donna/extendedContextLoaders'
import type { AcademyEntityContext } from './donnaEntityResolver'

// ── Minimal slice loaded from the server action ───────────────────────────────

export interface EntityContextSlice {
  players:     PlayerCurriculumStateSummary[]
  groups:      GroupSummary[]
  templates:   TemplateSummary[]
  assessments: AssessmentSummary[]
  coaches:     CoachContextSummary[]
}

// ── Build entity context from a context slice ─────────────────────────────────

export function buildEntityContext(slice: EntityContextSlice): AcademyEntityContext {
  return {
    players:     slice.players,
    groups:      slice.groups,
    templates:   slice.templates,
    assessments: slice.assessments,
    coaches:     slice.coaches,
    parents:     [],
  }
}
