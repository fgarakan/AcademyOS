// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Academy Decision Patterns: structured record of how the academy decides.
//
// Distinct from decisionTracking.ts (Sprint 1761) which operates on DirectorDonnaContext
// (runtime proposed_actions) for pattern frequency analysis.
// This module:
//   - Extracts curriculum-aware patterns from CurriculumMemoryEntry[] (post-approval records)
//   - Extracts proposed-action patterns from AcademyMemory[] (cross-domain history)
//   - Provides summary statistics per decision area
//   - Feeds the identity profile and personalization engines
//
// V1 limitation: curriculum memory only records accepted decisions (those approved by director).
// Rejected decisions leave no memory trail in V1. This is a known data gap —
// DecisionPatternRecord.outcome is always 'accepted' for curriculum entries.
// Future: wire rejection events to a rejection memory layer.
//
// Storage: academies.settings.donna_decision_patterns[] (JSONB — no new table).

import type { CurriculumMemoryEntry } from '../curriculum/curriculumMemory'
import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DecisionArea =
  | 'curriculum_add'
  | 'curriculum_modify'
  | 'curriculum_move'
  | 'curriculum_expand'
  | 'curriculum_replace'
  | 'curriculum_remove'
  | 'player_promotion'
  | 'player_placement'
  | 'assessment'
  | 'parent_communication'
  | 'coach_assignment'
  | 'director_override'
  | 'other'

export type DecisionOutcome =
  | 'accepted'
  | 'rejected'
  | 'edited_before_approval'
  | 'executed'
  | 'pending'

export interface DecisionPatternRecord {
  id:                   string
  decisionArea:         DecisionArea
  recommendation:       string
  outcome:              DecisionOutcome
  editedBeforeApproval: boolean
  affectedArea:         string
  contentType:          string | null
  levelId:              string | null
  confidence:           'high' | 'medium' | 'low'
  /** V1: always null. V2 will link to outcome evidence. */
  eventualOutcome:      string | null
  timestamp:            string
}

// ── Curriculum memory → decision patterns ─────────────────────────────────────

function intentToArea(intent: CurriculumMemoryEntry['intent']): DecisionArea {
  const map: Record<CurriculumMemoryEntry['intent'], DecisionArea> = {
    add:     'curriculum_add',
    modify:  'curriculum_modify',
    move:    'curriculum_move',
    expand:  'curriculum_expand',
    replace: 'curriculum_replace',
    remove:  'curriculum_remove',
  }
  return map[intent] ?? 'other'
}

/**
 * Converts accepted curriculum memory entries to decision pattern records.
 * V1: all outcomes are 'accepted' (curriculum memory is only written post-approval).
 */
export function buildCurriculumDecisionPatterns(
  curriculumMemory: CurriculumMemoryEntry[],
): DecisionPatternRecord[] {
  return curriculumMemory.map(entry => ({
    id:                   `dp_curr_${entry.id}`,
    decisionArea:         intentToArea(entry.intent),
    recommendation:       entry.changeDescription,
    outcome:              'accepted',
    editedBeforeApproval: false,
    affectedArea:         entry.levelName ?? 'unknown level',
    contentType:          entry.contentType ?? null,
    levelId:              entry.levelId ?? null,
    confidence:           'high',
    eventualOutcome:      null,
    timestamp:            entry.createdAt,
  }))
}

// ── Academy memory → decision patterns ────────────────────────────────────────

function memorySourceToArea(
  sourceType: AcademyMemory['sourceType'],
): DecisionArea {
  const map: Partial<Record<AcademyMemory['sourceType'], DecisionArea>> = {
    promotion_decision:  'player_promotion',
    placement_decision:  'player_placement',
    assessment_result:   'assessment',
    parent_update:       'parent_communication',
    coach_assignment:    'coach_assignment',
    director_override:   'director_override',
    curriculum_change:   'curriculum_add',
  }
  return map[sourceType] ?? 'other'
}

/**
 * Converts academy memory (proposed_action history) to decision pattern records.
 * director_override entries are marked as edited_before_approval.
 */
export function buildProposedActionDecisionPatterns(
  memories: AcademyMemory[],
): DecisionPatternRecord[] {
  return memories.map(mem => {
    const edited  = mem.sourceType === 'director_override'
    const outcome: DecisionOutcome = edited ? 'edited_before_approval' : 'accepted'

    const confidenceMap: Record<AcademyMemory['confidence'], DecisionPatternRecord['confidence']> = {
      high:     'high',
      medium:   'medium',
      low:      'low',
      inferred: 'low',
    }

    return {
      id:                   `dp_mem_${mem.id}`,
      decisionArea:         memorySourceToArea(mem.sourceType),
      recommendation:       mem.headline,
      outcome,
      editedBeforeApproval: edited,
      affectedArea:         mem.entityLinks?.[0]?.entityLabel ?? 'unknown',
      contentType:          null,
      levelId:              null,
      confidence:           confidenceMap[mem.confidence] ?? 'low',
      eventualOutcome:      null,
      timestamp:            mem.occurredAt,
    }
  })
}

// ── Pattern analysis ──────────────────────────────────────────────────────────

export interface DecisionPatternSummary {
  area:              DecisionArea
  totalDecisions:    number
  acceptedCount:     number
  rejectedCount:     number
  editedCount:       number
  /** 0–1. Based on available data — V1 curriculum memory is acceptance-only. */
  acceptanceRate:    number
  mostCommonOutcome: DecisionOutcome
  confidence:        'high' | 'medium' | 'low' | 'insufficient'
  dataLimitation:    string | null
}

export function summarizeDecisionPatterns(
  patterns: DecisionPatternRecord[],
): DecisionPatternSummary[] {
  const byArea: Record<string, DecisionPatternRecord[]> = {}
  for (const p of patterns) {
    if (!byArea[p.decisionArea]) byArea[p.decisionArea] = []
    byArea[p.decisionArea].push(p)
  }

  const summaries: DecisionPatternSummary[] = []
  for (const area of Object.keys(byArea) as DecisionArea[]) {
    const recs     = byArea[area]
    const accepted = recs.filter(r => r.outcome === 'accepted' || r.outcome === 'executed').length
    const rejected = recs.filter(r => r.outcome === 'rejected').length
    const edited   = recs.filter(r => r.editedBeforeApproval).length
    const total    = recs.length

    const confidenceLevel: DecisionPatternSummary['confidence'] =
      total >= 10 ? 'high'
      : total >= 5  ? 'medium'
      : total >= 2  ? 'low'
      : 'insufficient'

    const isCurriculumArea = area.startsWith('curriculum_')
    const dataLimitation = isCurriculumArea
      ? 'V1: curriculum memory records accepted decisions only. Rejection history is not yet tracked.'
      : null

    summaries.push({
      area,
      totalDecisions:    total,
      acceptedCount:     accepted,
      rejectedCount:     rejected,
      editedCount:       edited,
      acceptanceRate:    total > 0 ? accepted / total : 0,
      mostCommonOutcome: rejected > accepted ? 'rejected' : 'accepted',
      confidence:        confidenceLevel,
      dataLimitation,
    })
  }

  return summaries.sort((a, b) => b.totalDecisions - a.totalDecisions)
}

// ── Content type concentration ────────────────────────────────────────────────

/** Returns the most accepted content types from curriculum patterns. */
export function getMostAcceptedContentTypes(
  patterns: DecisionPatternRecord[],
): Array<{ contentType: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const p of patterns) {
    if (!p.contentType) continue
    if (p.outcome !== 'accepted' && p.outcome !== 'executed') continue
    counts[p.contentType] = (counts[p.contentType] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([contentType, count]) => ({ contentType, count }))
    .sort((a, b) => b.count - a.count)
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export function saveDecisionPatterns(
  rawSettings: Record<string, unknown>,
  patterns:    DecisionPatternRecord[],
): Record<string, unknown> {
  return { ...rawSettings, donna_decision_patterns: patterns }
}

export function loadDecisionPatterns(rawSettings: Record<string, unknown>): DecisionPatternRecord[] {
  return Array.isArray(rawSettings.donna_decision_patterns)
    ? (rawSettings.donna_decision_patterns as DecisionPatternRecord[])
    : []
}
