// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Memory importance scorer: assigns MemoryImportance to academy memories.
// Pure TypeScript — no DB, no React, no side effects.
// Deterministic: same input → same output.

import type { MemoryImportance, MemorySourceType, MemoryConfidence } from './donnaAcademyMemoryTypes'

// ── Scorer input ──────────────────────────────────────────────────────────────

export interface MemoryImportanceScorerInput {
  sourceType: MemorySourceType
  riskLevel: string                // 'low' | 'medium' | 'high' — from proposed_action
  isDirectorOverride: boolean      // modified_payload was non-null
  hasReviewerNotes: boolean        // reviewer_notes present
  confidence: MemoryConfidence
  entityLinked: boolean            // target_object_id was non-null
}

// ── Base importance by source type ───────────────────────────────────────────

const BASE_IMPORTANCE: Record<MemorySourceType, number> = {
  promotion_decision:    90,   // high impact on player development arc
  placement_decision:    85,   // activates a player — irreversible path
  director_override:     80,   // director explicitly changed DONNA's proposal
  parent_update:         70,   // parent-facing communication — trust impact
  assessment_result:     65,   // evidence-backed development signal
  curriculum_change:     60,   // affects all players in a level/group
  coach_assignment:      55,   // coach-player relationship change
  coach_wrap_up:         40,   // session-level event
  proposed_action:       30,   // generic action
  donna_recommendation:  25,   // recommendation only (no decision yet)
}

// ── Scoring function ──────────────────────────────────────────────────────────

export function scoreMemoryImportance(input: MemoryImportanceScorerInput): MemoryImportance {
  let score = BASE_IMPORTANCE[input.sourceType] ?? 30

  // Risk level adjustment
  if (input.riskLevel === 'high') score += 15
  else if (input.riskLevel === 'medium') score += 5

  // Director override: already reflected in source type, but adds weight
  if (input.isDirectorOverride) score += 10

  // Reviewer notes mean the director engaged deeply — higher significance
  if (input.hasReviewerNotes) score += 5

  // Entity-linked records are more traceable → more valuable as memory
  if (input.entityLinked) score += 5

  // Confidence penalty for inferred/low confidence memories
  if (input.confidence === 'low' || input.confidence === 'inferred') score -= 10

  // ── Map score → importance tier ───────────────────────────────────────────

  if (score >= 90) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// ── Importance label for display ──────────────────────────────────────────────

export function formatImportanceLabel(importance: MemoryImportance): string {
  const LABELS: Record<MemoryImportance, string> = {
    critical: 'Critical',
    high:     'High',
    medium:   'Medium',
    low:      'Low',
  }
  return LABELS[importance]
}

// ── Sort comparator ───────────────────────────────────────────────────────────

const IMPORTANCE_ORDER: Record<MemoryImportance, number> = {
  critical: 4,
  high:     3,
  medium:   2,
  low:      1,
}

export function compareByImportance(a: MemoryImportance, b: MemoryImportance): number {
  return IMPORTANCE_ORDER[b] - IMPORTANCE_ORDER[a]
}
