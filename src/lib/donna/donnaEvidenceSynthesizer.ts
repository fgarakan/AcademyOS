// DONNA Evidence Synthesizer V1
//
// For each intent, assembles the evidence points that support or qualify the answer.
// The evidence layer ensures DONNA never invents facts — every claim has a source.
//
// If evidence is missing, the synthesizer returns explicit gaps and proposes
// what would resolve them ("missing evidence is...").
//
// Design:
//   - EvidencePoint: what is known, how strong it is, where it came from
//   - MissingEvidence: what would resolve the gap, what action to take
//   - Deterministic — no LLM — evidence comes from data passed by the caller
//
// Pure TypeScript — no DB, no API.

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvidenceStrength = 'strong' | 'moderate' | 'weak' | 'missing'
export type EvidenceSource =
  | 'assessment'
  | 'blueprint'
  | 'mission'
  | 'curriculum_gate'
  | 'coach_note'
  | 'parent_summary'
  | 'placement_recommendation'
  | 'session_data'
  | 'audit_log'

export interface EvidencePoint {
  source: EvidenceSource
  label: string
  detail: string
  strength: EvidenceStrength
  date?: string | null
}

export interface MissingEvidence {
  what: string
  whyItMatters: string
  /** Action to resolve: 'start_assessment' | 'assign_mission' | 'add_coach_note' | 'configure_gates' */
  resolveAction: string
}

export interface EvidenceSummary {
  points: EvidencePoint[]
  missing: MissingEvidence[]
  overallStrength: EvidenceStrength
  /** Summary sentence about evidence quality */
  evidenceNote: string
}

// ── Evidence input data types ─────────────────────────────────────────────────

export interface PlayerEvidenceData {
  playerFirstName?: string
  currentLevelName?: string | null
  nextLevelName?: string | null
  latestAssessmentDate?: string | null
  latestAssessmentOverallScore?: number | null
  latestAssessmentAgeDays?: number | null
  activeMissionCount?: number
  pendingMissionCount?: number
  activeMissionLabels?: string[]
  gatesMet?: number
  gatesTotal?: number
  topStrengths?: string[]
  topGaps?: string[]
  hasCoachNotes?: boolean
  latestCoachNoteSnippet?: string | null
  latestCoachNoteDate?: string | null
  hasBlueprint?: boolean
  blueprintGeneratedAt?: string | null
  placementConfidenceScore?: number | null
  placementTopReasons?: string[]
  placementRiskNotes?: string[]
  parentSummaryEnabled?: boolean
}

// ── Evidence builders by intent ───────────────────────────────────────────────

export function buildPlayerReadinessEvidence(data: PlayerEvidenceData): EvidenceSummary {
  const points: EvidencePoint[] = []
  const missing: MissingEvidence[] = []

  // Gate completion
  if (data.gatesTotal !== undefined && data.gatesTotal > 0) {
    const pct = data.gatesMet !== undefined ? Math.round((data.gatesMet / data.gatesTotal) * 100) : 0
    points.push({
      source: 'curriculum_gate',
      label: 'Level Gate Progress',
      detail: `${data.gatesMet ?? 0}/${data.gatesTotal} gates met (${pct}%)`,
      strength: pct >= 80 ? 'strong' : pct >= 50 ? 'moderate' : 'weak',
    })
  } else {
    missing.push({
      what: 'Level gate requirements',
      whyItMatters: 'Gates show exactly which skills are confirmed vs still developing.',
      resolveAction: 'configure_gates',
    })
  }

  // Assessment
  if (data.latestAssessmentDate) {
    const age = data.latestAssessmentAgeDays ?? 0
    const strength: EvidenceStrength = age <= 30 ? 'strong' : age <= 60 ? 'moderate' : 'weak'
    const score = data.latestAssessmentOverallScore
    points.push({
      source: 'assessment',
      label: 'Latest Assessment',
      detail: score !== null && score !== undefined
        ? `Overall score: ${score.toFixed(1)}/10 (${age} days ago)`
        : `Completed ${age} days ago (no overall score)`,
      strength,
      date: data.latestAssessmentDate,
    })
  } else {
    missing.push({
      what: 'Recent assessment',
      whyItMatters: 'Assessment scores are the primary evidence for level readiness.',
      resolveAction: 'start_assessment',
    })
  }

  // Active missions
  if ((data.activeMissionCount ?? 0) > 0) {
    const labels = (data.activeMissionLabels ?? []).slice(0, 2).join(', ')
    points.push({
      source: 'mission',
      label: 'Active Missions',
      detail: `${data.activeMissionCount} active: ${labels || 'in progress'}`,
      strength: 'moderate',
    })
  }

  // Coach notes
  if (data.hasCoachNotes && data.latestCoachNoteSnippet) {
    points.push({
      source: 'coach_note',
      label: 'Coach Observation',
      detail: `"${data.latestCoachNoteSnippet.slice(0, 80)}${data.latestCoachNoteSnippet.length > 80 ? '…' : ''}"`,
      strength: 'moderate',
      date: data.latestCoachNoteDate ?? undefined,
    })
  }

  const strongCount = points.filter(p => p.strength === 'strong').length
  const moderateCount = points.filter(p => p.strength === 'moderate').length
  const overallStrength: EvidenceStrength =
    strongCount >= 2 ? 'strong'
    : (strongCount + moderateCount) >= 2 ? 'moderate'
    : points.length > 0 ? 'weak'
    : 'missing'

  const evidenceNote = missing.length === 0
    ? `${points.length} evidence point${points.length !== 1 ? 's' : ''} support this assessment.`
    : `${points.length} evidence point${points.length !== 1 ? 's' : ''} available. ${missing.length} gap${missing.length !== 1 ? 's' : ''} remain.`

  return { points, missing, overallStrength, evidenceNote }
}

export function buildPlacementEvidence(data: PlayerEvidenceData): EvidenceSummary {
  const points: EvidencePoint[] = []
  const missing: MissingEvidence[] = []

  if (data.placementConfidenceScore !== null && data.placementConfidenceScore !== undefined) {
    const tier = data.placementConfidenceScore >= 80 ? 'high' : data.placementConfidenceScore >= 60 ? 'medium' : 'low'
    points.push({
      source: 'placement_recommendation',
      label: 'DONNA Placement Confidence',
      detail: `${data.placementConfidenceScore}% confidence (${tier})`,
      strength: data.placementConfidenceScore >= 80 ? 'strong' : data.placementConfidenceScore >= 60 ? 'moderate' : 'weak',
    })
  }

  for (const reason of (data.placementTopReasons ?? []).slice(0, 3)) {
    points.push({
      source: 'placement_recommendation',
      label: 'Placement Reason',
      detail: reason,
      strength: 'moderate',
    })
  }

  if (data.latestAssessmentDate && data.latestAssessmentOverallScore !== null) {
    const age = data.latestAssessmentAgeDays ?? 0
    points.push({
      source: 'assessment',
      label: 'Assessment Score',
      detail: `${data.latestAssessmentOverallScore?.toFixed(1)}/10 (${age} days ago)`,
      strength: age <= 30 ? 'strong' : 'moderate',
      date: data.latestAssessmentDate,
    })
  } else {
    missing.push({
      what: 'Assessment scores',
      whyItMatters: 'Assessment scores are the foundation of the placement recommendation.',
      resolveAction: 'start_assessment',
    })
  }

  if (data.placementRiskNotes && data.placementRiskNotes.length > 0) {
    points.push({
      source: 'placement_recommendation',
      label: 'Risk Notes',
      detail: data.placementRiskNotes[0],
      strength: 'weak',
    })
  }

  const overallStrength: EvidenceStrength =
    points.filter(p => p.strength === 'strong').length >= 2 ? 'strong'
    : points.length >= 2 ? 'moderate'
    : missing.length > 0 ? 'weak'
    : 'missing'

  return {
    points,
    missing,
    overallStrength,
    evidenceNote: `DONNA placement recommendation based on ${points.length} evidence source${points.length !== 1 ? 's' : ''}.`,
  }
}

/**
 * Build evidence for a generic intent where player evidence data is available.
 * Falls back to basic evidence points when specific intent evidence is not defined.
 */
export function buildGenericPlayerEvidence(data: PlayerEvidenceData): EvidenceSummary {
  const points: EvidencePoint[] = []
  const missing: MissingEvidence[] = []

  if (data.currentLevelName) {
    points.push({
      source: 'blueprint',
      label: 'Current Level',
      detail: data.currentLevelName,
      strength: 'strong',
    })
  }

  if (data.latestAssessmentDate) {
    const age = data.latestAssessmentAgeDays ?? 0
    points.push({
      source: 'assessment',
      label: 'Assessment',
      detail: data.latestAssessmentOverallScore !== null && data.latestAssessmentOverallScore !== undefined
        ? `Score ${data.latestAssessmentOverallScore.toFixed(1)}/10, ${age} days ago`
        : `Completed ${age} days ago`,
      strength: age <= 30 ? 'strong' : 'moderate',
    })
  }

  if (data.topStrengths && data.topStrengths.length > 0) {
    points.push({
      source: 'blueprint',
      label: 'Strengths',
      detail: data.topStrengths.slice(0, 3).join(', '),
      strength: 'moderate',
    })
  }

  if (data.hasBlueprint === false) {
    missing.push({
      what: 'Development blueprint',
      whyItMatters: 'The blueprint provides priorities, missions, and coach focus for this player.',
      resolveAction: 'generate_blueprint',
    })
  }

  const overallStrength: EvidenceStrength =
    points.filter(p => p.strength === 'strong').length >= 2 ? 'strong'
    : points.length >= 2 ? 'moderate'
    : points.length > 0 ? 'weak'
    : 'missing'

  return {
    points,
    missing,
    overallStrength,
    evidenceNote: `Based on ${points.length} data source${points.length !== 1 ? 's' : ''}${missing.length > 0 ? ` (${missing.length} gap${missing.length !== 1 ? 's' : ''})` : ''}.`,
  }
}
