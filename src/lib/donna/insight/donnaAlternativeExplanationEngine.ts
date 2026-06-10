// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Alternative explanation engine: for each detected pattern, generates 2–3
// possible explanations the director may not have considered.
//
// Rules:
//   - Never state "the cause is". Only "possible explanations include".
//   - Every explanation must be plausible from the available evidence.
//   - DONNA offers options; the director investigates and decides.

import type { MemoryLearningReport, PatternType } from '../learning/donnaAcademyLearningTypes'
import type { AlternativeExplanation, EvidenceStrength } from './donnaInsightTypes'
import {
  scoreEvidenceStrength,
  fromLearningConfidence,
} from './donnaInsightConfidenceEngine'

// ── Builder ───────────────────────────────────────────────────────────────────

function makeExplanation(
  observedIssue:    string,
  explanationA:     string,
  explanationB:     string,
  explanationC:     string | null,
  evidence:         string[],
  evidenceStrength: EvidenceStrength,
  sourceMemoryIds:  string[],
  total:            number,
): AlternativeExplanation {
  return {
    id: `altexp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    observedIssue,
    explanationA,
    explanationB,
    explanationC,
    evidence,
    evidenceStrength,
    confidence: fromLearningConfidence('low'),
    limitations: [
      'Alternative explanations are hypothesis-only — none is confirmed.',
      'DONNA does not have direct knowledge of reasons behind director decisions.',
    ],
  }
}

// ── Pattern → explanations map ────────────────────────────────────────────────

const PATTERN_EXPLANATIONS: Record<PatternType, {
  observedIssue: string
  A: string
  B: string
  C: string | null
}> = {
  promotion_cluster: {
    observedIssue: 'Multiple promotions occurring in a short window',
    A: 'A cohort of players naturally reached readiness at the same time.',
    B: 'A periodic batch-review process is releasing accumulated promotion candidates.',
    C: 'Assessment criteria may be applied more loosely during certain periods.',
  },
  rejection_repeat: {
    observedIssue: 'Repeated rejection of proposed actions',
    A: "DONNA's context doesn't reflect the current constraints or priorities.",
    B: 'Director priorities have shifted and proposals have not kept pace.',
    C: null,
  },
  override_frequency: {
    observedIssue: 'Director frequently modifying DONNA proposals',
    A: "DONNA's proposals are too generic and need more granular options.",
    B: "Director reasoning is not yet being captured in reviewer notes — proposals can't self-calibrate.",
    C: 'Workflow constraints require specific action formats that DONNA is not producing.',
  },
  assessment_gap: {
    observedIssue: 'Low assessment volume relative to total decisions',
    A: 'Assessment frequency is intentionally lower than other decision types.',
    B: 'Assessments are being conducted but not formally recorded in the system.',
    C: 'The assessment process is currently informal and relies on coach discretion.',
  },
  curriculum_change_burst: {
    observedIssue: 'Multiple curriculum changes in a short window',
    A: 'A planned curriculum review cycle is in progress.',
    B: 'Recent coach feedback triggered a round of responsive curriculum adjustments.',
    C: 'Performance concerns in a specific cohort are driving targeted curriculum changes.',
  },
  coach_assignment_churn: {
    observedIssue: 'Multiple coach assignment changes in current memory',
    A: 'Deliberate academy restructuring is redistributing coach–player relationships.',
    B: 'Staff changes (new hires, departures) required assignment updates.',
    C: 'The system is being brought up to date from a previously manual state.',
  },
  parent_update_gap: {
    observedIssue: 'Low parent communication relative to academy activity',
    A: 'Parent communication is occurring through channels not captured in the system.',
    B: 'Parent updates are batched and are due to be sent in an upcoming cycle.',
    C: null,
  },
  placement_velocity: {
    observedIssue: 'Multiple player placements in a short window',
    A: 'An active intake season is underway — high placement velocity is expected.',
    B: 'A new cohort has joined the academy and is being processed through onboarding.',
    C: 'A backlog of pending placements is being cleared after a pause.',
  },
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generateAlternativeExplanations(
  report: MemoryLearningReport,
): AlternativeExplanation[] {
  const results: AlternativeExplanation[] = []
  const total = report.totalMemoriesAnalyzed

  for (const pattern of report.patterns) {
    if (pattern.confidence === 'insufficient') continue

    const spec = PATTERN_EXPLANATIONS[pattern.patternType]
    if (!spec) continue

    const strength = scoreEvidenceStrength(pattern.sourceMemoryIds.length, total)

    results.push(makeExplanation(
      spec.observedIssue,
      spec.A,
      spec.B,
      spec.C,
      pattern.evidence,
      strength,
      pattern.sourceMemoryIds,
      total,
    ))
  }

  return results
}
