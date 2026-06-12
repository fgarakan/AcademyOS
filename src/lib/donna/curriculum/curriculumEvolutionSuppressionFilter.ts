// DONNA Curriculum Evolution Memory — Suppression Filter
// Mega Sprint 1931–1960
//
// Decides whether a recommendation should be hidden based on prior director decisions.
// Pure function — no DB calls. Operates entirely on EvolutionRecommendation[] + EvolutionMemoryEntry[].
//
// Suppression rules:
//   dismissed → hide unless material evidence change
//   rejected  → hide unless material evidence change
//   deferred  → hide until reviewDate passes
//   approved  → hide (director already agreed; don't re-surface as new)
//
// Material evidence change (triggers resurfacing):
//   - evidenceStrength increased (insufficient < low < medium < high)
//   - confidence increased by 15%+
//   - recommendationType changed

import type { EvolutionRecommendation } from './curriculumEvolutionEngine'
import type { EvolutionMemoryEntry } from './curriculumEvolutionMemory'
import type { EvidenceStrength } from './curriculumEvidenceStrength'

const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  insufficient: 0,
  low:          1,
  medium:       2,
  high:         3,
}

function hasMaterialEvidenceChange(
  rec:  EvolutionRecommendation,
  last: EvolutionMemoryEntry,
): boolean {
  if (STRENGTH_RANK[rec.evidenceStrength] > STRENGTH_RANK[last.evidenceStrength]) return true
  if (rec.confidence - last.confidence >= 15) return true
  if (rec.recommendationType !== last.recommendationType) return true
  return false
}

export function shouldSuppressRecommendation(
  rec:    EvolutionRecommendation,
  memory: EvolutionMemoryEntry[],
  now    = new Date().toISOString(),
): { suppressed: boolean; reason: string | null } {
  const last = memory
    .filter(m => m.recommendationId === rec.id)
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0]

  if (!last) return { suppressed: false, reason: null }

  if (last.decision === 'dismissed' || last.decision === 'rejected') {
    return hasMaterialEvidenceChange(rec, last)
      ? { suppressed: false, reason: null }
      : { suppressed: true, reason: last.decision }
  }

  if (last.decision === 'deferred') {
    return (last.reviewDate !== null && last.reviewDate <= now)
      ? { suppressed: false, reason: null }
      : { suppressed: true, reason: 'deferred' }
  }

  if (last.decision === 'approved') {
    return { suppressed: true, reason: 'approved' }
  }

  return { suppressed: false, reason: null }
}

export function filterEvolutionRecommendations(
  recommendations: EvolutionRecommendation[],
  memory:          EvolutionMemoryEntry[],
  now?:            string,
): EvolutionRecommendation[] {
  return recommendations.filter(
    rec => !shouldSuppressRecommendation(rec, memory, now).suppressed,
  )
}
