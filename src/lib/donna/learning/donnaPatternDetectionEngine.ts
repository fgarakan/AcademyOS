// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Pattern detection: identifies recurring patterns across AcademyMemory[].
// Pure observation — no causation claims. Strict confidence thresholds enforced.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type {
  MemoryLearningSignal,
  PatternDetectionResult,
  PatternType,
  LearningConfidence,
} from './donnaAcademyLearningTypes'
import { signalsInLastDays } from './donnaLearningSignalExtractor'

// ── Thresholds ────────────────────────────────────────────────────────────────

const CLUSTER_WINDOW_DAYS  = 21    // short window for cluster/burst detection
const CLUSTER_MIN          = 3     // minimum occurrences for a cluster
const OVERRIDE_MIN         = 3     // minimum overrides to flag override_frequency
const CHURN_MIN            = 3     // minimum coach assignment changes for churn
const ASSESSMENT_MAX_RATIO = 0.10  // <10% assessments in total = assessment gap
const PARENT_MAX_RATIO     = 0.15  // <15% parent updates in total = parent gap
const MIN_TOTAL_FOR_RATIO  = 5     // minimum total signals to apply ratio checks

// ── Pattern builder ───────────────────────────────────────────────────────────

function makePattern(
  type:            PatternType,
  headline:        string,
  observation:     string,
  evidence:        string[],
  frequency:       number,
  sourceMemoryIds: string[],
  confidence:      LearningConfidence,
  monitorFlag:     boolean,
): PatternDetectionResult {
  return {
    id: `pat-${type}-${Date.now()}`,
    patternType: type,
    headline,
    observation,
    evidence,
    frequency,
    sourceMemoryIds,
    confidence,
    monitorFlag,
  }
}

// ── Promotion cluster ─────────────────────────────────────────────────────────

function detectPromotionCluster(signals: MemoryLearningSignal[]): PatternDetectionResult | null {
  const recent = signalsInLastDays(
    signals.filter(s => s.signalType === 'promotion_decision'),
    CLUSTER_WINDOW_DAYS,
  )
  if (recent.length < CLUSTER_MIN) return null

  const confidence: LearningConfidence = recent.length >= 5 ? 'medium' : 'low'
  return makePattern(
    'promotion_cluster',
    `${recent.length} promotions in the last ${CLUSTER_WINDOW_DAYS} days`,
    `${recent.length} promotion decisions occurred within a ${CLUSTER_WINDOW_DAYS}-day window. This is a frequency observation — not a confirmation that all decisions were appropriate.`,
    recent.slice(0, 3).map(s => s.headline),
    recent.length,
    recent.map(s => s.sourceMemoryIds[0]),
    confidence,
    true,
  )
}

// ── Rejection repeat ──────────────────────────────────────────────────────────

function detectRejectionRepeat(memories: AcademyMemory[]): PatternDetectionResult | null {
  const rejected = memories.filter(m =>
    m.headline.toLowerCase().includes('reject') ||
    (m.reviewerNotes !== null && m.reviewerNotes.toLowerCase().includes('reject'))
  )
  if (rejected.length < 2) return null

  const confidence: LearningConfidence = rejected.length >= 4 ? 'low' : 'insufficient'
  if (confidence === 'insufficient') return null

  return makePattern(
    'rejection_repeat',
    `${rejected.length} rejected actions in current memory`,
    `${rejected.length} memory records show repeated rejection of proposed actions. Whether these share a root cause is not determinable from frequency counts.`,
    rejected.slice(0, 3).map(m => m.headline),
    rejected.length,
    rejected.map(m => m.id),
    confidence,
    false,
  )
}

// ── Override frequency ────────────────────────────────────────────────────────

function detectOverrideFrequency(signals: MemoryLearningSignal[]): PatternDetectionResult | null {
  const overrides = signals.filter(s => s.signalType === 'director_override')
  if (overrides.length < OVERRIDE_MIN) return null

  const confidence: LearningConfidence = overrides.length >= 5 ? 'medium' : 'low'
  return makePattern(
    'override_frequency',
    `${overrides.length} director overrides in current memory`,
    `The director modified ${overrides.length} DONNA proposals before approving. Whether this reflects systematic disagreement or one-off adjustments cannot be determined from counts alone.`,
    overrides.slice(0, 3).map(s => s.headline),
    overrides.length,
    overrides.map(s => s.sourceMemoryIds[0]),
    confidence,
    true,
  )
}

// ── Assessment gap ────────────────────────────────────────────────────────────

function detectAssessmentGap(signals: MemoryLearningSignal[], total: number): PatternDetectionResult | null {
  if (total < MIN_TOTAL_FOR_RATIO) return null
  const assessments = signals.filter(s => s.signalType === 'assessment_result')
  const ratio = assessments.length / total
  if (ratio >= ASSESSMENT_MAX_RATIO) return null

  return makePattern(
    'assessment_gap',
    `Low assessment volume — ${assessments.length} of ${total} records`,
    `Assessment records account for ${Math.round(ratio * 100)}% of loaded memory. This may indicate infrequent formal assessment or assessments recorded outside this window.`,
    [
      `${assessments.length} assessment records found`,
      `${total} total memory records loaded`,
    ],
    total - assessments.length,
    assessments.map(s => s.sourceMemoryIds[0]),
    'low',
    false,
  )
}

// ── Curriculum change burst ───────────────────────────────────────────────────

function detectCurriculumChangeBurst(signals: MemoryLearningSignal[]): PatternDetectionResult | null {
  const recent = signalsInLastDays(
    signals.filter(s => s.signalType === 'curriculum_change'),
    CLUSTER_WINDOW_DAYS,
  )
  if (recent.length < CLUSTER_MIN) return null

  return makePattern(
    'curriculum_change_burst',
    `${recent.length} curriculum changes in the last ${CLUSTER_WINDOW_DAYS} days`,
    `${recent.length} curriculum change decisions occurred within a ${CLUSTER_WINDOW_DAYS}-day window. Whether this is a planned review cycle or reactive adjustment is not determinable from counts.`,
    recent.slice(0, 3).map(s => s.headline),
    recent.length,
    recent.map(s => s.sourceMemoryIds[0]),
    'low',
    true,
  )
}

// ── Coach assignment churn ────────────────────────────────────────────────────

function detectCoachAssignmentChurn(signals: MemoryLearningSignal[]): PatternDetectionResult | null {
  const assignments = signals.filter(s => s.signalType === 'coach_assignment')
  if (assignments.length < CHURN_MIN) return null

  return makePattern(
    'coach_assignment_churn',
    `${assignments.length} coach assignment changes in current memory`,
    `${assignments.length} coach assignment records appear in the loaded memory. Frequency alone does not indicate instability — context for each change is not available.`,
    assignments.slice(0, 3).map(s => s.headline),
    assignments.length,
    assignments.map(s => s.sourceMemoryIds[0]),
    'low',
    false,
  )
}

// ── Parent update gap ─────────────────────────────────────────────────────────

function detectParentUpdateGap(signals: MemoryLearningSignal[], total: number): PatternDetectionResult | null {
  if (total < MIN_TOTAL_FOR_RATIO * 2) return null  // require at least 10 total records
  const parentUpdates = signals.filter(s => s.signalType === 'parent_update')
  const ratio = parentUpdates.length / total
  if (ratio >= PARENT_MAX_RATIO) return null

  return makePattern(
    'parent_update_gap',
    `Low parent communication — ${parentUpdates.length} of ${total} records`,
    `Parent update records account for ${Math.round(ratio * 100)}% of loaded memory. Whether this reflects low communication need or a gap in parent engagement cannot be confirmed from frequency alone.`,
    [
      `${parentUpdates.length} parent update records`,
      `${total} total records loaded`,
    ],
    total - parentUpdates.length,
    parentUpdates.map(s => s.sourceMemoryIds[0]),
    'low',
    false,
  )
}

// ── Placement velocity ────────────────────────────────────────────────────────

function detectPlacementVelocity(signals: MemoryLearningSignal[]): PatternDetectionResult | null {
  const recent = signalsInLastDays(
    signals.filter(s => s.signalType === 'placement_decision'),
    CLUSTER_WINDOW_DAYS,
  )
  if (recent.length < CLUSTER_MIN) return null

  return makePattern(
    'placement_velocity',
    `${recent.length} player placements in the last ${CLUSTER_WINDOW_DAYS} days`,
    `${recent.length} placement decisions occurred within a ${CLUSTER_WINDOW_DAYS}-day window. This may indicate an active onboarding period.`,
    recent.slice(0, 3).map(s => s.headline),
    recent.length,
    recent.map(s => s.sourceMemoryIds[0]),
    'low',
    true,
  )
}

// ── Main detector ─────────────────────────────────────────────────────────────

export function detectPatterns(
  signals: MemoryLearningSignal[],
  memories: AcademyMemory[],
): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = []
  const push = (r: PatternDetectionResult | null) => { if (r) results.push(r) }

  const total = signals.length

  push(detectPromotionCluster(signals))
  push(detectRejectionRepeat(memories))
  push(detectOverrideFrequency(signals))
  push(detectAssessmentGap(signals, total))
  push(detectCurriculumChangeBurst(signals))
  push(detectCoachAssignmentChurn(signals))
  push(detectParentUpdateGap(signals, total))
  push(detectPlacementVelocity(signals))

  return results
}
