// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// Memory layer: what DONNA records after a curriculum draft is submitted.
//
// Memory is stored in academies.settings.donna_curriculum_memory[] — no new table.
// Two categories map to existing DonnaMemoryPolicy categories:
//   - 'recommendation_outcome': Add and Expand (tracks accepted suggestions)
//   - 'academy_operation': Modify, Move, Replace, Remove (tracks structural decisions)
//
// Memory is read during context load and used to pre-fill inferences and
// avoid re-surfacing suggestions the director has already acted on.

import type { CurriculumModificationIntent } from './curriculumDraftObject'

// ── Memory entry ──────────────────────────────────────────────────────────────

export interface CurriculumMemoryEntry {
  id: string
  intent: CurriculumModificationIntent
  /** Maps to DonnaMemoryCategory */
  category: 'recommendation_outcome' | 'academy_operation'
  levelId?: string
  levelName?: string
  itemId?: string
  itemTitle?: string
  contentType?: string
  changeDescription: string
  reason?: string
  createdAt: string
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function buildCurriculumMemoryEntry(params: {
  intent: CurriculumModificationIntent
  levelId?: string
  levelName?: string
  itemId?: string
  itemTitle?: string
  contentType?: string
  changeDescription: string
  reason?: string
}): CurriculumMemoryEntry {
  const category: CurriculumMemoryEntry['category'] =
    params.intent === 'add' || params.intent === 'expand'
      ? 'recommendation_outcome'
      : 'academy_operation'

  return {
    id: `cmem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    intent:            params.intent,
    category,
    levelId:           params.levelId,
    levelName:         params.levelName,
    itemId:            params.itemId,
    itemTitle:         params.itemTitle,
    contentType:       params.contentType,
    changeDescription: params.changeDescription,
    reason:            params.reason,
    createdAt:         new Date().toISOString(),
  }
}

// ── Memory lookup helpers ─────────────────────────────────────────────────────

/** Returns true if a recommendation for this level + contentType was recently accepted */
export function wasRecommendationAccepted(
  memory: CurriculumMemoryEntry[],
  levelId: string,
  contentType: string,
): boolean {
  return memory.some(
    m =>
      m.category === 'recommendation_outcome' &&
      m.intent === 'add' &&
      m.levelId === levelId &&
      m.contentType === contentType,
  )
}

/** Returns the most recent decision about a specific item */
export function getLastDecisionForItem(
  memory: CurriculumMemoryEntry[],
  itemId: string,
): CurriculumMemoryEntry | null {
  const matches = memory
    .filter(m => m.itemId === itemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return matches[0] ?? null
}

/** Returns memory entries for a level, most recent first */
export function getMemoryForLevel(
  memory: CurriculumMemoryEntry[],
  levelId: string,
): CurriculumMemoryEntry[] {
  return memory
    .filter(m => m.levelId === levelId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
