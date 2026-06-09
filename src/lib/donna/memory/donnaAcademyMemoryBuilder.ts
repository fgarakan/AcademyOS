// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Memory builder: converts raw proposed_action rows into AcademyMemory objects.
// Pure TypeScript — no DB, no React, no side effects.
// Input: raw rows from proposed_actions (enriched with target_object_type/id).
// Output: AcademyMemory[]

import type {
  AcademyMemory,
  MemorySourceType,
  MemoryEntityLink,
  MemoryConfidence,
} from './donnaAcademyMemoryTypes'
import { scoreMemoryImportance } from './donnaMemoryImportanceScorer'

// ── Raw row shape (superset of RecentDecisionSummary) ─────────────────────────

export interface RawMemoryRow {
  id: string
  actionLabel: string
  targetModule: string
  actionType: string
  status: string
  riskLevel: string
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  reviewerNotes: string | null
  rejectionReason: string | null
  targetObjectId: string | null
  targetObjectType: string | null
  modifiedPayload: unknown | null   // non-null = director override
  riskNotes: string[] | null
}

// ── Source type inference ─────────────────────────────────────────────────────

function inferSourceType(row: RawMemoryRow): MemorySourceType {
  // Director override takes precedence — modified_payload present means director changed the proposal
  if (row.modifiedPayload !== null) return 'director_override'

  const m = row.targetModule.toLowerCase()
  const a = row.actionType.toLowerCase()

  if (m.includes('promotion') || m.includes('advancement') || a.includes('promot') || a.includes('advanc')) {
    return 'promotion_decision'
  }
  if (m.includes('placement') || m.includes('onboarding') || m.includes('finalize_placement')) {
    return 'placement_decision'
  }
  if (m.includes('assessment') || a.includes('assessment')) {
    return 'assessment_result'
  }
  if (m.includes('coach_assignment') || a.includes('assign_coach')) {
    return 'coach_assignment'
  }
  if (m.includes('wrap_up') || m.includes('recap') || a.includes('wrap')) {
    return 'coach_wrap_up'
  }
  if (m.includes('parent') || m.includes('communication') || a.includes('parent')) {
    return 'parent_update'
  }
  if (m.includes('curriculum') || a.includes('curriculum')) {
    return 'curriculum_change'
  }

  return 'proposed_action'
}

// ── Entity link builder ───────────────────────────────────────────────────────

function buildEntityLinks(row: RawMemoryRow): MemoryEntityLink[] {
  const links: MemoryEntityLink[] = []

  if (row.targetObjectType && row.targetObjectId) {
    const knownTypes: Record<string, MemoryEntityLink['entityType']> = {
      player:           'player',
      coach:            'coach',
      group:            'group',
      curriculum_level: 'curriculum_level',
      session:          'session',
      template:         'template',
      academy:          'academy',
    }
    const entityType = knownTypes[row.targetObjectType.toLowerCase()] ?? 'player'
    // Extract entity name from action label (best-effort — label often starts with entity name)
    const label = extractEntityNameFromLabel(row.actionLabel, entityType)
    links.push({ entityType, entityId: row.targetObjectId, entityLabel: label })
  } else if (row.targetObjectType) {
    // Have type but no ID — partial link
    const label = extractEntityNameFromLabel(row.actionLabel, 'player')
    links.push({
      entityType: (row.targetObjectType as MemoryEntityLink['entityType']) ?? 'player',
      entityId: null,
      entityLabel: label,
    })
  }

  return links
}

// Extract entity name from action_label text.
// Labels often start with the entity name: "Promote Jake Chen to Green Ball" → "Jake Chen"
// This is best-effort text extraction, not resolved against DB.
function extractEntityNameFromLabel(label: string, _type: string): string {
  // Common label patterns:
  // "Promote Jake Chen to..." → "Jake Chen"
  // "Coach Sarah wrap-up for..." → ""
  // "Parent update for Jake Chen..." → "Jake Chen"
  // "Assessment: Jake Chen - Orange 1..." → "Jake Chen"
  const forMatch = label.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (forMatch) return forMatch[1]!

  const promotionMatch = label.match(/^(?:Promote|Advance|Place|Assess)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (promotionMatch) return promotionMatch[1]!

  const colonMatch = label.match(/:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[–-]/i)
  if (colonMatch) return colonMatch[1]!

  return label.split(' ').slice(0, 3).join(' ')
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildSummary(row: RawMemoryRow, sourceType: MemorySourceType): string {
  const statusLabel = {
    approved: 'was approved',
    executed: 'was executed',
    rejected: 'was rejected',
    modified: 'was modified and approved',
    expired: 'expired without decision',
    failed: 'failed during execution',
  }[row.status] ?? `has status: ${row.status}`

  let summary = `${row.actionLabel} — ${statusLabel}.`

  if (row.reviewerNotes) {
    summary += ` Director noted: "${row.reviewerNotes}".`
  }

  if (row.rejectionReason) {
    summary += ` Rejection reason: "${row.rejectionReason}".`
  }

  if (sourceType === 'director_override') {
    summary += ' The original DONNA proposal was modified before approval.'
  }

  return summary
}

// ── Evidence builder ──────────────────────────────────────────────────────────

function buildEvidence(row: RawMemoryRow): string[] {
  const evidence: string[] = []

  if (row.riskLevel !== 'low') {
    evidence.push(`Risk level: ${row.riskLevel}`)
  }
  if (row.riskNotes && row.riskNotes.length > 0) {
    evidence.push(...row.riskNotes.slice(0, 3))
  }
  if (row.reviewerNotes) {
    evidence.push(`Director note: ${row.reviewerNotes}`)
  }

  return evidence
}

// ── Data gaps ────────────────────────────────────────────────────────────────

function buildDataGaps(row: RawMemoryRow, sourceType: MemorySourceType): string[] {
  const gaps: string[] = []

  if (!row.targetObjectId) {
    gaps.push('Entity ID not recorded — cannot link to player/coach profile directly')
  }

  if (sourceType === 'promotion_decision' && !row.reviewerNotes) {
    gaps.push('No director notes recorded at time of promotion')
  }

  if (sourceType === 'assessment_result') {
    gaps.push('Assessment scores not stored in this memory layer — check assessment records directly')
  }

  if (sourceType === 'coach_wrap_up') {
    gaps.push('Wrap-up content not stored — only approval status is available')
  }

  return gaps
}

// ── Confidence ────────────────────────────────────────────────────────────────

function inferConfidence(row: RawMemoryRow): MemoryConfidence {
  if (row.targetObjectId && (row.approvedAt || row.rejectedAt)) return 'high'
  if (row.approvedAt || row.rejectedAt) return 'medium'
  return 'low'
}

// ── Occurred at ──────────────────────────────────────────────────────────────

function resolveOccurredAt(row: RawMemoryRow): string {
  return row.approvedAt ?? row.rejectedAt ?? row.createdAt
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildMemoryFromRow(row: RawMemoryRow): AcademyMemory {
  const sourceType = inferSourceType(row)
  const entityLinks = buildEntityLinks(row)
  const evidence = buildEvidence(row)
  const dataGaps = buildDataGaps(row, sourceType)
  const confidence = inferConfidence(row)
  const summary = buildSummary(row, sourceType)
  const occurredAt = resolveOccurredAt(row)

  const importance = scoreMemoryImportance({
    sourceType,
    riskLevel: row.riskLevel,
    isDirectorOverride: row.modifiedPayload !== null,
    hasReviewerNotes: row.reviewerNotes !== null,
    confidence,
    entityLinked: entityLinks.length > 0,
  })

  return {
    id: row.id,
    sourceType,
    headline: row.actionLabel,
    summary,
    evidence,
    entityLinks,
    importance,
    confidence,
    occurredAt,
    overrideReason: row.modifiedPayload !== null ? (row.reviewerNotes ?? 'Director modified proposal') : null,
    reviewerNotes: row.reviewerNotes,
    dataGaps,
  }
}

export function buildMemoriesFromRows(rows: RawMemoryRow[]): AcademyMemory[] {
  return rows.map(buildMemoryFromRow)
}
