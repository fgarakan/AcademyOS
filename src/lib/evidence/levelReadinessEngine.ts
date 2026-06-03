// Level Readiness Engine V1
// Pure TypeScript — no DB calls, no side effects.
// Takes player evidence records and produces a level readiness signal
// that DONNA can explain and directors can act on.
//
// Core rule: no automatic level movement.
// Output is a recommendation requiring director approval.

import type { EvidenceRecord, EvidenceAnswer, ProgressRollup } from './playerEvidenceTypes'
import { isEvidenceStale } from './assessmentEvidenceMapper'

// ─── Result types ─────────────────────────────────────────────────────────────

export type ReadinessStatus =
  | 'ready'                // Strong signal — director review recommended now
  | 'close'                // Good signal — a few gaps remain
  | 'not_ready'            // Clear blockers or weak signal
  | 'insufficient_evidence' // Not enough data to determine

export const READINESS_STATUS_LABELS: Record<ReadinessStatus, string> = {
  ready:                'Ready for Review',
  close:                'Close',
  not_ready:            'Not Ready',
  insufficient_evidence: 'Insufficient Evidence',
}

export const READINESS_STATUS_COLORS: Record<ReadinessStatus, string> = {
  ready:                'text-status-green bg-status-green/10 border-status-green/30',
  close:                'text-lime bg-lime/10 border-lime/30',
  not_ready:            'text-status-orange bg-status-orange/10 border-status-orange/30',
  insufficient_evidence: 'text-text-muted bg-surface-raised border-border',
}

export interface LevelReadinessResult {
  readinessStatus:      ReadinessStatus
  readinessScore:       number           // 0–100 composite
  confidence:           number           // 0–100
  supportingEvidence:   EvidenceRecord[] // strong records that support promotion
  blockingEvidence:     EvidenceRecord[] // weak records that block promotion
  staleEvidence:        EvidenceRecord[] // expired records that need refresh
  missingCategories:    string[]         // pathways with no evidence
  totalEvidenceCount:   number
  categoriesRepresented: string[]
  donnaExplanation:     string
  recommendedNextAction: string
  isDirectorReviewRecommended: boolean
  computedAt:           string
}

// ─── Category requirements ────────────────────────────────────────────────────

const REQUIRED_CATEGORIES = ['skill', 'competition', 'movement', 'mental_performance', 'behavior']
const CRITICAL_CATEGORIES = ['skill', 'competition'] // must have strong signal for 'ready'
const MIN_CATEGORIES_FOR_READY = 3
const MIN_CATEGORIES_FOR_CLOSE  = 2
const MIN_EVIDENCE_COUNT = 2

// ─── Score helpers ────────────────────────────────────────────────────────────

function evidenceToReadinessScore(records: EvidenceRecord[]): number {
  if (records.length === 0) return 0
  const weightedSum = records.reduce((sum, r) => sum + (r.confidence * (r.evidence_weight ?? 1)), 0)
  const totalWeight = records.reduce((sum, r) => sum + (r.evidence_weight ?? 1), 0)
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

function categorizePath(record: EvidenceRecord): string {
  const cat = record.evidence_category ?? record.pathway ?? 'general'
  if (cat === 'assessment' || cat === 'assessment_snapshot') return record.pathway ?? 'skill'
  return cat
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export interface LevelReadinessInput {
  evidenceRecords:  EvidenceRecord[]
  currentLevelName: string | null
  targetLevelName:  string | null
  playerFirstName:  string | null
}

export function calculateLevelReadiness(input: LevelReadinessInput): LevelReadinessResult {
  const { evidenceRecords, currentLevelName, targetLevelName, playerFirstName } = input
  const name = playerFirstName ?? 'This player'
  const now = new Date().toISOString()

  const assessmentRecords = evidenceRecords.filter(r =>
    r.source_type === 'assessment_score' || r.source_type === 'reassessment_change'
  )

  // Categorise records
  const supporting: EvidenceRecord[] = []
  const blocking:   EvidenceRecord[] = []
  const stale:      EvidenceRecord[] = []

  for (const r of evidenceRecords) {
    if (isEvidenceStale(r.expires_at)) {
      stale.push(r)
      continue
    }
    if (r.evidence_strength === 'strong' && r.confidence >= 70) {
      supporting.push(r)
    } else if (r.evidence_strength === 'weak' || r.confidence < 40) {
      blocking.push(r)
    }
  }

  // Categories represented (non-stale records)
  const freshRecords = evidenceRecords.filter(r => !isEvidenceStale(r.expires_at))
  const categoriesSet = new Set(freshRecords.map(categorizePath))
  const categoriesRepresented = Array.from(categoriesSet)

  const missingCategories = REQUIRED_CATEGORIES.filter(c => !categoriesSet.has(c))

  const criticalCategoriesMet = CRITICAL_CATEGORIES.every(c => categoriesSet.has(c))
  const hasCriticalSupport = supporting.some(r =>
    CRITICAL_CATEGORIES.includes(categorizePath(r))
  )

  const readinessScore = evidenceToReadinessScore(freshRecords)
  const avgConfidence = freshRecords.length > 0
    ? Math.round(freshRecords.reduce((s, r) => s + r.confidence, 0) / freshRecords.length)
    : 0

  const highBlockerCount = blocking.filter(r =>
    CRITICAL_CATEGORIES.includes(categorizePath(r))
  ).length

  // ── Status determination ──────────────────────────────────────────────────
  let readinessStatus: ReadinessStatus

  if (freshRecords.length < MIN_EVIDENCE_COUNT || categoriesRepresented.length < 1) {
    readinessStatus = 'insufficient_evidence'
  } else if (
    readinessScore >= 75 &&
    categoriesRepresented.length >= MIN_CATEGORIES_FOR_READY &&
    criticalCategoriesMet &&
    hasCriticalSupport &&
    highBlockerCount === 0 &&
    stale.length === 0
  ) {
    readinessStatus = 'ready'
  } else if (
    readinessScore >= 60 &&
    categoriesRepresented.length >= MIN_CATEGORIES_FOR_CLOSE &&
    highBlockerCount <= 1
  ) {
    readinessStatus = 'close'
  } else {
    readinessStatus = 'not_ready'
  }

  // ── Confidence in the readiness assessment itself ─────────────────────────
  const confidence = Math.min(100, Math.round(
    avgConfidence * 0.6 +
    Math.min(categoriesRepresented.length / REQUIRED_CATEGORIES.length, 1) * 30 +
    (stale.length === 0 ? 10 : 0)
  ))

  // ── DONNA explanation ─────────────────────────────────────────────────────
  const levelClause = currentLevelName ? ` at ${currentLevelName}` : ''
  const targetClause = targetLevelName ? ` to ${targetLevelName}` : ' up'
  const donnaExplanation = buildReadinessExplanation(
    name, readinessStatus, levelClause, targetClause,
    supporting, blocking, stale, missingCategories,
  )

  // ── Recommended next action ───────────────────────────────────────────────
  const recommendedNextAction = buildRecommendedAction(readinessStatus, missingCategories, stale)

  const isDirectorReviewRecommended =
    readinessStatus === 'ready' || readinessStatus === 'close'

  return {
    readinessStatus,
    readinessScore,
    confidence,
    supportingEvidence:   supporting.slice(0, 5),
    blockingEvidence:     blocking.slice(0, 5),
    staleEvidence:        stale.slice(0, 3),
    missingCategories,
    totalEvidenceCount:   evidenceRecords.length,
    categoriesRepresented,
    donnaExplanation,
    recommendedNextAction,
    isDirectorReviewRecommended,
    computedAt:           now,
  }
}

// ─── DONNA explanation builder ────────────────────────────────────────────────

function buildReadinessExplanation(
  name: string,
  status: ReadinessStatus,
  levelClause: string,
  targetClause: string,
  supporting: EvidenceRecord[],
  blocking: EvidenceRecord[],
  stale: EvidenceRecord[],
  missing: string[],
): string {
  const supportClause = supporting.length > 0
    ? ` Supporting: ${supporting.slice(0, 2).map(r => r.evidence_summary.slice(0, 60)).join('; ')}.`
    : ''
  const blockClause = blocking.length > 0
    ? ` Blocking: ${blocking.slice(0, 2).map(r => r.evidence_summary.slice(0, 60)).join('; ')}.`
    : ''
  const staleClause = stale.length > 0
    ? ` ${stale.length} evidence record${stale.length !== 1 ? 's' : ''} expired — reassessment needed.`
    : ''
  const missingClause = missing.length > 0
    ? ` Missing evidence: ${missing.slice(0, 3).join(', ')}.`
    : ''

  switch (status) {
    case 'ready':
      return `${name} shows a strong evidence signal${levelClause}. Assessment scores, competition data, and behavior evidence all support moving${targetClause}. Director review is recommended.${supportClause}`

    case 'close':
      return `${name} is close but not yet ready to move${targetClause}. Strong evidence exists in some areas, but gaps remain.${supportClause}${blockClause}${missingClause}${staleClause}`

    case 'not_ready':
      return `${name} is not yet ready to advance${levelClause}. Clear gaps or weak evidence signals are present.${blockClause}${missingClause}${staleClause}`

    case 'insufficient_evidence':
      return `Not enough evidence to assess readiness for ${name}${levelClause}. Run a Development or Level Readiness Assessment first.${missingClause}`
  }
}

function buildRecommendedAction(
  status: ReadinessStatus,
  missing: string[],
  stale: EvidenceRecord[],
): string {
  if (status === 'ready') {
    return 'Initiate a Level Readiness Review and create a promotion draft for director approval.'
  }
  if (status === 'close') {
    if (stale.length > 0) return 'Run a Development Assessment to refresh stale evidence, then schedule a Level Readiness Assessment.'
    if (missing.length > 0) return `Run a Level Readiness Assessment. Focus on missing evidence: ${missing.slice(0, 2).join(', ')}.`
    return 'Run a Level Readiness Assessment to confirm readiness before initiating a promotion review.'
  }
  if (status === 'not_ready') {
    return 'Focus on weak areas in training. Re-run a Development Assessment in 4–6 weeks.'
  }
  return 'Run an initial Development Assessment to generate evidence for readiness evaluation.'
}

// ─── DONNA answer builder (for evidence answer system) ────────────────────────

export function buildIsReadyToMoveUpAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
  currentLevelName: string | null,
  nextLevelName: string | null,
): EvidenceAnswer {
  const result = calculateLevelReadiness({
    evidenceRecords: records,
    currentLevelName,
    targetLevelName: nextLevelName,
    playerFirstName,
  })

  return {
    intent:              'is_ready_to_move_up',
    answer:              result.donnaExplanation,
    citedEvidenceIds:    result.supportingEvidence.map(r => r.id),
    missingEvidenceNote: result.missingCategories.length > 0
      ? result.missingCategories.join(', ')
      : null,
    confidence:          result.confidence,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}
