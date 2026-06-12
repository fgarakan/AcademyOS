// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Evolution Memory: records what DONNA recommended and what the director decided.
//
// Storage: academies.settings.donna_curriculum_evolution_memory[]
// No new table. No migrations. Same pattern as donna_curriculum_memory[].
//
// Memory serves two purposes:
//   1. Prevents DONNA from re-surfacing dismissed recommendations
//   2. Tracks outcomes over time — did the approved change help?

import type { EvidenceStrength, RecommendationType } from './curriculumEvidenceStrength'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvolutionDecision = 'approved' | 'rejected' | 'deferred' | 'dismissed'

export interface EvolutionMemoryEntry {
  id:                 string
  recommendationId:   string
  title:              string
  recommendationType: RecommendationType
  evidenceStrength:   EvidenceStrength
  decision:           EvolutionDecision
  levelId:            string | null
  gateId:             string | null
  evidence:           string[]
  confidence:         number
  decidedAt:          string
  /** ISO date when to resurface a deferred recommendation */
  reviewDate:         string | null
  /** Filled in when outcome is observed after approval */
  outcome:            string | null
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function buildEvolutionMemoryEntry(params: {
  recommendationId:   string
  title:              string
  recommendationType: RecommendationType
  evidenceStrength:   EvidenceStrength
  decision:           EvolutionDecision
  levelId?:           string
  gateId?:            string
  evidence:           string[]
  confidence:         number
  deferDays?:         number
}): EvolutionMemoryEntry {
  const deferDate = params.deferDays
    ? new Date(Date.now() + params.deferDays * 86_400_000).toISOString()
    : null

  return {
    id:                 `emem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recommendationId:   params.recommendationId,
    title:              params.title,
    recommendationType: params.recommendationType,
    evidenceStrength:   params.evidenceStrength,
    decision:           params.decision,
    levelId:            params.levelId ?? null,
    gateId:             params.gateId ?? null,
    evidence:           params.evidence,
    confidence:         params.confidence,
    decidedAt:          new Date().toISOString(),
    reviewDate:         deferDate,
    outcome:            null,
  }
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** Returns true if this recommendation was already dismissed or rejected */
export function wasRecommendationDismissed(
  memory: EvolutionMemoryEntry[],
  recommendationId: string,
): boolean {
  return memory.some(
    m => m.recommendationId === recommendationId &&
         (m.decision === 'dismissed' || m.decision === 'rejected'),
  )
}

/** Returns all deferred entries that are past their review date */
export function getDueReviews(
  memory: EvolutionMemoryEntry[],
  now = new Date().toISOString(),
): EvolutionMemoryEntry[] {
  return memory.filter(
    m => m.decision === 'deferred' && m.reviewDate !== null && m.reviewDate <= now,
  )
}

/** Returns approved entries for a specific level — helps track what was already done */
export function getApprovedForLevel(
  memory: EvolutionMemoryEntry[],
  levelId: string,
): EvolutionMemoryEntry[] {
  return memory
    .filter(m => m.levelId === levelId && m.decision === 'approved')
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
}

/** Returns true if a recommendation type for a level was recently approved */
export function wasTypeApprovedForLevel(
  memory: EvolutionMemoryEntry[],
  levelId: string,
  type: RecommendationType,
): boolean {
  return memory.some(
    m => m.levelId === levelId && m.recommendationType === type && m.decision === 'approved',
  )
}
