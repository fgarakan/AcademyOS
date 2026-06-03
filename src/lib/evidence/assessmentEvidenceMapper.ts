// Assessment Evidence Mapper V1
// Pure TypeScript — no DB calls, no side effects.
// Maps a completed assessment's ScoresDetail into structured EvidenceWriteInput records:
//   1. One summary record for the whole assessment
//   2. One record per scored section
// Used by assessmentEvidenceWriter.ts.

import type { EvidenceWriteInput, EvidencePathway, EvidenceStrength } from './playerEvidenceTypes'
import type { ScoresDetail } from '@/lib/assessment/assessmentTemplateTypes'
import type { AssessmentPurpose } from '@/lib/assessment/assessmentTemplateResolver'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface AssessmentEvidenceMappingInput {
  academyId:           string
  playerId:            string
  assessmentId:        string
  scoresDetail:        ScoresDetail
  assessmentPurpose:   AssessmentPurpose
  assessmentLabel:     string       // human-readable label e.g. "Development Assessment"
  assessmentView:      string       // e.g. "orange_ball"
  overallScore:        number | null
  curriculumLevelId:   string | null
  curriculumLevelName: string | null
  createdBy:           string
  isReassessment:      boolean
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface AssessmentEvidenceMapping {
  summaryRecord:  EvidenceWriteInput
  sectionRecords: EvidenceWriteInput[]
  expiresAt:      string
  evidenceCount:  number
}

// ─── Section → pathway / category mapping ────────────────────────────────────

interface SectionClassification {
  pathway:           EvidencePathway
  evidenceCategory:  string
}

function classifySection(sectionKey: string): SectionClassification {
  const k = sectionKey.toLowerCase()
  if (k.includes('technical') || k.includes('stroke') || k.includes('forehand') || k.includes('backhand') || k.includes('serve') || k.includes('ball_tracking')) {
    return { pathway: 'skill', evidenceCategory: 'skill' }
  }
  if (k.includes('movement') || k.includes('fitness') || k.includes('motor')) {
    return { pathway: 'fitness', evidenceCategory: 'movement' }
  }
  if (k.includes('tactical')) {
    return { pathway: 'competition', evidenceCategory: 'tactical' }
  }
  if (k.includes('competition')) {
    return { pathway: 'competition', evidenceCategory: 'competition' }
  }
  if (k.includes('mental') || k.includes('confidence') || k.includes('resilience')) {
    return { pathway: 'mental_performance', evidenceCategory: 'mental_performance' }
  }
  if (k.includes('behavior') || k.includes('behaviour') || k.includes('learning')) {
    return { pathway: 'general', evidenceCategory: 'behavior' }
  }
  return { pathway: 'general', evidenceCategory: 'assessment' }
}

// ─── Score → readable label ───────────────────────────────────────────────────

function scoreToBandLabel(score: number): string {
  if (score <= 2.5) return 'Needs Support'
  if (score <= 5.0) return 'Developing'
  if (score <= 7.5) return 'Solid'
  return 'Strong'
}

function scoreToStrength(score: number): EvidenceStrength {
  if (score >= 7.5) return 'strong'
  if (score >= 5.0) return 'moderate'
  return 'weak'
}

function scoreToConfidence(score: number): number {
  return Math.min(100, Math.round((score / 10) * 100))
}

// ─── Expiry by purpose ────────────────────────────────────────────────────────

export function computeExpiresAt(purpose: AssessmentPurpose): string {
  const daysMap: Record<AssessmentPurpose, number> = {
    quick_placement_snapshot:   30,
    development_assessment:     90,
    level_readiness_assessment: 45,
    evaluation_assessment:      60,
  }
  const days = daysMap[purpose] ?? 90
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// ─── Evidence freshness ───────────────────────────────────────────────────────

export function isEvidenceStale(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export function evidenceAgeLabel(expiresAt: string | null, createdAt: string): string {
  const now = Date.now()
  const created = new Date(createdAt).getTime()
  const daysOld = Math.floor((now - created) / (1000 * 60 * 60 * 24))

  if (daysOld < 7)  return 'Fresh'
  if (daysOld < 30) return `${daysOld} days old`
  if (daysOld < 90) return `${Math.floor(daysOld / 7)} weeks old`
  return `${Math.floor(daysOld / 30)} months old`
}

// ─── Section summary builder ──────────────────────────────────────────────────

function buildSectionSummary(
  sectionKey: string,
  sectionDisplayName: string,
  sectionScore: number,
  skills: Record<string, { score: number | null; not_assessed: boolean }>,
): string {
  const bandLabel = scoreToBandLabel(sectionScore)
  const skillLines: string[] = []

  for (const [skillKey, skillState] of Object.entries(skills)) {
    if (skillState.not_assessed || skillState.score === null) continue
    const readableSkill = skillKey.replace(/_/g, ' ')
    skillLines.push(`${readableSkill}: ${scoreToBandLabel(skillState.score)}`)
  }

  const skillClause = skillLines.length > 0
    ? ` Skills: ${skillLines.slice(0, 4).join(', ')}.`
    : ''

  return `${sectionDisplayName}: ${sectionScore.toFixed(1)}/10 (${bandLabel}).${skillClause}`
}

// ─── Summary record builder ───────────────────────────────────────────────────

function buildSummarySummary(
  assessmentLabel: string,
  assessmentView: string,
  overallScore: number | null,
  sections: ScoresDetail['sections'],
  isReassessment: boolean,
): string {
  const labelDisplay = assessmentLabel.replace(/_/g, ' ')
  const viewDisplay = assessmentView.replace(/_/g, ' ')
  const prefix = isReassessment ? 'Reassessment' : 'Assessment'

  const scoredSections = Object.entries(sections)
    .filter(([, s]) => s.section_score !== null && !s.not_assessed)
    .map(([k, s]) => ({ key: k, score: s.section_score as number }))
    .sort((a, b) => b.score - a.score)

  const strengths = scoredSections.filter(s => s.score >= 7.0).map(s => s.key.replace(/_/g, ' '))
  const attention = scoredSections.filter(s => s.score < 5.0).map(s => s.key.replace(/_/g, ' '))

  const overallClause = overallScore !== null ? ` Overall: ${overallScore.toFixed(1)}/10.` : ''
  const strengthClause = strengths.length > 0 ? ` Strengths: ${strengths.slice(0, 3).join(', ')}.` : ''
  const attentionClause = attention.length > 0 ? ` Needs attention: ${attention.slice(0, 3).join(', ')}.` : ''

  return `${prefix}: ${labelDisplay} (${viewDisplay}).${overallClause}${strengthClause}${attentionClause}`.trim()
}

// ─── Main mapper ──────────────────────────────────────────────────────────────

export function mapAssessmentToEvidenceRecords(
  input: AssessmentEvidenceMappingInput,
): AssessmentEvidenceMapping {
  const {
    academyId, playerId, assessmentId, scoresDetail,
    assessmentPurpose, assessmentLabel, assessmentView,
    overallScore, curriculumLevelId, curriculumLevelName, createdBy, isReassessment,
  } = input

  const expiresAt = computeExpiresAt(assessmentPurpose)
  const sourceTypeForSummary = isReassessment ? 'reassessment_change' : 'assessment_score'
  const overallStrength: EvidenceStrength =
    overallScore !== null ? scoreToStrength(overallScore) : 'moderate'
  const overallConfidence =
    overallScore !== null ? scoreToConfidence(overallScore) : 50

  // ── Summary record ────────────────────────────────────────────────────────
  const summarySummaryText = buildSummarySummary(
    assessmentLabel, assessmentView, overallScore, scoresDetail.sections, isReassessment,
  )

  const summaryRecord: EvidenceWriteInput = {
    academyId,
    playerId,
    sourceType:          sourceTypeForSummary,
    sourceId:            assessmentId,
    pathway:             'skill',
    curriculumLevelId,
    curriculumLevelName,
    confidence:          overallConfidence,
    evidenceStrength:    overallStrength,
    evidenceSummary:     summarySummaryText,
    evidenceCategory:    'assessment',
    evidenceWeight:      isReassessment ? 1.5 : 1.0,
    expiresAt,
    createdBy,
    visibleToCoach:      true,
    visibleToParent:     false,
    visibleToPlayer:     false,
  }

  // ── Section records ───────────────────────────────────────────────────────
  const sectionRecords: EvidenceWriteInput[] = []

  for (const [sectionKey, sectionState] of Object.entries(scoresDetail.sections)) {
    if (sectionState.not_assessed || sectionState.section_score === null) continue

    const classification = classifySection(sectionKey)
    const score = sectionState.section_score
    const displayName = sectionKey.replace(/_/g, ' ')
    const summary = buildSectionSummary(
      sectionKey,
      displayName,
      score,
      sectionState.skills as Record<string, { score: number | null; not_assessed: boolean }>,
    )

    sectionRecords.push({
      academyId,
      playerId,
      sourceType:          'assessment_score',
      sourceId:            `${assessmentId}_s_${sectionKey}`,
      pathway:             classification.pathway,
      curriculumLevelId,
      curriculumLevelName,
      confidence:          scoreToConfidence(score),
      evidenceStrength:    scoreToStrength(score),
      evidenceSummary:     summary,
      evidenceCategory:    `assessment_snapshot`,
      evidenceWeight:      0.8,
      expiresAt,
      createdBy,
      visibleToCoach:      true,
      visibleToParent:     false,
      visibleToPlayer:     false,
    })
  }

  return {
    summaryRecord,
    sectionRecords,
    expiresAt,
    evidenceCount: 1 + sectionRecords.length,
  }
}

// ─── Quick assessment mapper (no ScoresDetail — domain scores only) ───────────

export interface QuickAssessmentEvidenceMappingInput {
  academyId:      string
  playerId:       string
  assessmentId:   string
  overallScore:   number | null
  technicalScore: number | null
  tacticalScore:  number | null
  movementScore:  number | null
  competitionScore: number | null
  behavioralScore:  number | null
  createdBy:      string
}

export function mapQuickAssessmentToEvidence(
  input: QuickAssessmentEvidenceMappingInput,
): EvidenceWriteInput {
  const scores = [
    input.technicalScore, input.tacticalScore, input.movementScore,
    input.competitionScore, input.behavioralScore,
  ].filter((s): s is number => s !== null)

  const avg = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null

  const parts: string[] = ['Quick Placement Snapshot recorded.']
  if (avg !== null) parts.push(`Domain avg: ${avg.toFixed(1)}/10.`)
  if (input.technicalScore !== null) parts.push(`Technical: ${scoreToBandLabel(input.technicalScore)}.`)
  if (input.movementScore !== null)  parts.push(`Movement: ${scoreToBandLabel(input.movementScore)}.`)

  return {
    academyId:        input.academyId,
    playerId:         input.playerId,
    sourceType:       'assessment_score',
    sourceId:         input.assessmentId,
    pathway:          'skill',
    confidence:       avg !== null ? scoreToConfidence(avg) : 40,
    evidenceStrength: avg !== null ? scoreToStrength(avg) : 'weak',
    evidenceSummary:  parts.join(' '),
    evidenceCategory: 'assessment',
    evidenceWeight:   0.6,
    expiresAt:        computeExpiresAt('quick_placement_snapshot'),
    createdBy:        input.createdBy,
    visibleToCoach:   true,
    visibleToParent:  false,
    visibleToPlayer:  false,
  }
}
