// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Main insight engine — composes all insight sub-engines.
// Input:  AcademyMemory[]  (Sprint 1595 memory engine)
//         MemoryLearningReport  (Sprint 1625 learning engine)
// Output: AcademyInsightReport — the answer to "What are we missing?"
//
// Insight chain:
//   Memory → Learning → Insight → [Memory Bridge] → V2 DB persistence

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningReport } from '../learning/donnaAcademyLearningTypes'
import type {
  AcademyInsightReport,
  AcademyInsight,
  BlindSpot,
  Contradiction,
  AlternativeExplanation,
  PerspectiveShift,
  HiddenOpportunity,
  InsightType,
  InsightConfidence,
  EvidenceStrength,
} from './donnaInsightTypes'
import { detectBlindSpots }                   from './donnaBlindSpotDetector'
import { detectContradictions }               from './donnaContradictionDetector'
import { generateAlternativeExplanations }    from './donnaAlternativeExplanationEngine'
import { generatePerspectiveShifts }          from './donnaPerspectiveShiftEngine'
import { detectHiddenOpportunities }          from './donnaOpportunityDetector'
import {
  scoreReportInsightConfidence,
  buildInsightLimitations,
  buildEvidenceStrengthDisclosure,
} from './donnaInsightConfidenceEngine'

// ── Top insight assembly ──────────────────────────────────────────────────────
// Converts the individual insight objects into unified AcademyInsight records.
// Blind spots and contradictions are elevated to top insights by confidence.

function toAcademyInsight(
  type:             InsightType,
  title:            string,
  summary:          string,
  evidence:         string[],
  evidenceStrength: EvidenceStrength,
  confidence:       InsightConfidence,
  limitations:      string[],
  recommendation:   string | null,
  investigation:    string | null,
): AcademyInsight {
  return {
    id:                     `insight-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    insightType:            type,
    title,
    summary,
    evidence,
    evidenceStrength,
    confidence,
    limitations,
    recommendation,
    suggestedInvestigation: investigation,
    createdAt:              new Date().toISOString(),
  }
}

function blindSpotToInsight(b: BlindSpot): AcademyInsight {
  return toAcademyInsight(
    'blind_spot',
    b.headline,
    `Potential blind spot detected: ${b.headline}`,
    b.evidence,
    b.evidenceStrength,
    b.confidence,
    b.limitations,
    null,
    b.suggestedInvestigation,
  )
}

function contradictionToInsight(c: Contradiction): AcademyInsight {
  return toAcademyInsight(
    'contradiction',
    c.headline,
    `Possible contradiction: ${c.observedBehavior} — but — ${c.conflictingSignal}`,
    c.evidence,
    c.evidenceStrength,
    c.confidence,
    c.limitations,
    null,
    c.suggestedReview,
  )
}

// ── Top insight selector ──────────────────────────────────────────────────────
// Selects up to 3 insights ranked by confidence then evidence strength.
// Blind spots and contradictions take priority over softer insights.

const CONFIDENCE_RANK: Record<InsightConfidence, number> = {
  high: 4, medium: 3, low: 2, insufficient_data: 0,
}

const EVIDENCE_RANK: Record<EvidenceStrength, number> = {
  strong: 3, moderate: 2, weak: 1,
}

function selectTopInsights(
  blindSpots:    BlindSpot[],
  contradictions: Contradiction[],
): AcademyInsight[] {
  const candidates: AcademyInsight[] = [
    ...blindSpots.filter(b => b.confidence !== 'insufficient_data').map(blindSpotToInsight),
    ...contradictions.filter(c => c.confidence !== 'insufficient_data').map(contradictionToInsight),
  ]

  return candidates
    .sort((a, b) => {
      const confDiff = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]
      if (confDiff !== 0) return confDiff
      return EVIDENCE_RANK[b.evidenceStrength] - EVIDENCE_RANK[a.evidenceStrength]
    })
    .slice(0, 3)
}

// ── Top investigations ────────────────────────────────────────────────────────
// Collects the highest-value suggested investigations across all insight types.
// Max 3 — low cognitive load rule.

function extractTopInvestigations(
  blindSpots:     BlindSpot[],
  contradictions: Contradiction[],
  perspectives:   PerspectiveShift[],
  opportunities:  HiddenOpportunity[],
): string[] {
  const investigations: Array<{ text: string; rank: number }> = []

  for (const b of blindSpots.filter(b => b.confidence !== 'insufficient_data')) {
    investigations.push({ text: b.suggestedInvestigation, rank: CONFIDENCE_RANK[b.confidence] })
  }
  for (const c of contradictions.filter(c => c.confidence !== 'insufficient_data')) {
    investigations.push({ text: c.suggestedReview, rank: CONFIDENCE_RANK[c.confidence] })
  }
  for (const p of perspectives.filter(p => p.confidence !== 'insufficient_data')) {
    investigations.push({ text: p.suggestedInvestigation, rank: CONFIDENCE_RANK[p.confidence] })
  }
  for (const o of opportunities.filter(o => o.confidence !== 'insufficient_data')) {
    investigations.push({ text: o.suggestedAction, rank: CONFIDENCE_RANK[o.confidence] })
  }

  return investigations
    .sort((a, b) => b.rank - a.rank)
    .map(i => i.text)
    .slice(0, 3)
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function buildAcademyInsightReport(
  memories: AcademyMemory[],
  report:   MemoryLearningReport,
): AcademyInsightReport {
  const total = memories.length

  const blindSpots             = detectBlindSpots(memories, report)
  const contradictions         = detectContradictions(memories, report)
  const alternativeExplanations = generateAlternativeExplanations(report)
  const perspectiveShifts      = generatePerspectiveShifts(report)
  const hiddenOpportunities    = detectHiddenOpportunities(memories, report)

  const topInsights      = selectTopInsights(blindSpots, contradictions)
  const topInvestigations = extractTopInvestigations(blindSpots, contradictions, perspectiveShifts, hiddenOpportunities)

  const insightCount     = blindSpots.length + contradictions.length
  const opportunityCount = hiddenOpportunities.length
  const confidence       = scoreReportInsightConfidence(total, insightCount, opportunityCount)
  const limitations      = buildInsightLimitations(total, insightCount, opportunityCount)

  return {
    generatedAt:             new Date().toISOString(),
    totalMemoriesAnalyzed:   total,
    topInsights,
    blindSpots,
    contradictions,
    alternativeExplanations,
    perspectiveShifts,
    hiddenOpportunities,
    topInvestigations,
    confidence,
    limitations,
  }
}

// ── Formatter ─────────────────────────────────────────────────────────────────
// Renders the insight report as a DONNA response message.
// Follows the same pattern as formatMemoryLearningReportAsMessage from Sprint 1625.

export function formatAcademyInsightReportAsMessage(report: AcademyInsightReport): string {
  if (report.totalMemoriesAnalyzed === 0) {
    return "No memory is loaded yet. Once the academy has recorded decisions, I can identify patterns you may not have noticed."
  }

  const lines: string[] = []
  const total = report.totalMemoriesAnalyzed

  lines.push(`Analysed ${total} decision${total !== 1 ? 's' : ''} in academy memory.\n`)

  // ── Blind spots ───────────────────────────────────────────────────────────
  if (report.blindSpots.length > 0) {
    lines.push('**Blind Spots**')
    for (const b of report.blindSpots) {
      const disc = buildEvidenceStrengthDisclosure(b.evidenceStrength, b.confidence)
      lines.push(`• ${b.headline}`)
      lines.push(`  ${disc}`)
      lines.push(`  → ${b.suggestedInvestigation}`)
    }
    lines.push('')
  }

  // ── Contradictions ─────────────────────────────────────────────────────────
  if (report.contradictions.length > 0) {
    lines.push('**Possible Contradictions**')
    for (const c of report.contradictions) {
      const disc = buildEvidenceStrengthDisclosure(c.evidenceStrength, c.confidence)
      lines.push(`• ${c.headline}`)
      lines.push(`  ${c.observedBehavior} — but — ${c.conflictingSignal}`)
      lines.push(`  ${disc}`)
      lines.push(`  → ${c.suggestedReview}`)
    }
    lines.push('')
  }

  // ── Alternative explanations ───────────────────────────────────────────────
  if (report.alternativeExplanations.length > 0) {
    lines.push('**Alternative Explanations**')
    for (const a of report.alternativeExplanations) {
      lines.push(`• ${a.observedIssue}`)
      lines.push(`  A: ${a.explanationA}`)
      lines.push(`  B: ${a.explanationB}`)
      if (a.explanationC) lines.push(`  C: ${a.explanationC}`)
    }
    lines.push('')
  }

  // ── Perspective shifts ─────────────────────────────────────────────────────
  if (report.perspectiveShifts.length > 0) {
    lines.push('**Perspective Shifts**')
    for (const p of report.perspectiveShifts) {
      lines.push(`• Current: ${p.currentPerspective}`)
      lines.push(`  Alternative: ${p.alternativePerspective}`)
      lines.push(`  → ${p.suggestedInvestigation}`)
    }
    lines.push('')
  }

  // ── Hidden opportunities ───────────────────────────────────────────────────
  if (report.hiddenOpportunities.length > 0) {
    lines.push('**Opportunities**')
    for (const o of report.hiddenOpportunities) {
      const disc = buildEvidenceStrengthDisclosure(o.evidenceStrength, o.confidence)
      lines.push(`• ${o.headline}`)
      lines.push(`  ${o.observation}`)
      lines.push(`  ${disc}`)
      lines.push(`  → ${o.suggestedAction}`)
    }
    lines.push('')
  }

  // ── Top investigations ─────────────────────────────────────────────────────
  if (report.topInvestigations.length > 0) {
    lines.push('**Suggested Investigations**')
    for (const inv of report.topInvestigations) {
      lines.push(`→ ${inv}`)
    }
    lines.push('')
  }

  // ── Confidence and limitations ─────────────────────────────────────────────
  const confLine = `Insight confidence: ${report.confidence}`
  const limLine  = report.limitations.length > 0
    ? `Limitations: ${report.limitations.join(' | ')}`
    : ''

  lines.push(confLine)
  if (limLine) lines.push(limLine)

  return lines.join('\n')
}
