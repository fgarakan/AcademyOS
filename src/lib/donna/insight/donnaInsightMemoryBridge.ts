// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
//
// Insight Memory Bridge — closes the intelligence loop.
//
// Architecture:
//   Memory → Learning → Insight → Investigation → Decision → Outcome → Memory
//
// Purpose:
//   Every accepted insight that gets investigated must be capable of becoming
//   future memory. Without this bridge, insight is a dead-end observation.
//   With it, DONNA eventually learns:
//     "We investigated this insight. The conclusion was correct."
//     "We investigated this insight. The conclusion was wrong."
//
// V1 scope: defines the data contract. DB persistence is V2.
// V1 outputs: AcademyMemory records ready to be ingested by the memory engine.
// V2 will write these to a `insight_outcomes` table and include them in
//    loadAcademyMemories() so the learning engine picks them up naturally.

import type { AcademyMemory, MemoryConfidence } from '../memory/donnaAcademyMemoryTypes'
import type { AcademyInsight, InsightType, EvidenceStrength, InsightConfidence } from './donnaInsightTypes'

// ── Investigation status ───────────────────────────────────────────────────────

export type InsightInvestigationStatus =
  | 'pending'              // insight accepted, investigation not started
  | 'in_progress'          // investigation is active
  | 'concluded_correct'    // investigation confirmed the insight was valid
  | 'concluded_incorrect'  // investigation found the insight was wrong
  | 'inconclusive'         // investigation ran but could not confirm or deny
  | 'dismissed'            // director decided not to investigate

// ── Investigation outcome ──────────────────────────────────────────────────────

export interface InsightInvestigationOutcome {
  insightId:         string
  insightTitle:      string
  insightType:       InsightType
  status:            InsightInvestigationStatus
  conclusion:        string | null       // director's written conclusion
  investigatedAt:    string              // ISO date when investigation concluded
  reviewerNotes:     string | null       // director notes added during investigation
  actionsTaken:      string[]            // what the director did in response
  evidenceStrength:  EvidenceStrength    // how much data backed the original insight
  originalConfidence: InsightConfidence  // DONNA's original confidence in this insight
}

// ── Memory confidence from investigation ──────────────────────────────────────
// Concluded outcomes produce higher-confidence memories than inconclusive ones.

function deriveMemoryConfidence(status: InsightInvestigationStatus): MemoryConfidence {
  switch (status) {
    case 'concluded_correct':   return 'high'
    case 'concluded_incorrect': return 'high'     // high confidence that insight was wrong — equally valuable
    case 'inconclusive':        return 'medium'
    case 'in_progress':         return 'low'
    case 'dismissed':           return 'low'
    case 'pending':             return 'inferred'
  }
}

// ── Headline builder ──────────────────────────────────────────────────────────
// Future memory should read naturally: "DONNA insight investigated — [result]."

function buildHeadline(outcome: InsightInvestigationOutcome): string {
  switch (outcome.status) {
    case 'concluded_correct':
      return `DONNA insight confirmed correct: ${outcome.insightTitle}`
    case 'concluded_incorrect':
      return `DONNA insight found incorrect: ${outcome.insightTitle}`
    case 'inconclusive':
      return `DONNA insight investigation inconclusive: ${outcome.insightTitle}`
    case 'dismissed':
      return `DONNA insight dismissed without investigation: ${outcome.insightTitle}`
    case 'in_progress':
      return `DONNA insight under investigation: ${outcome.insightTitle}`
    case 'pending':
      return `DONNA insight accepted, investigation pending: ${outcome.insightTitle}`
  }
}

// ── Summary builder ───────────────────────────────────────────────────────────
// Produces the narrative that future DONNA will read when this memory loads.

function buildSummary(outcome: InsightInvestigationOutcome): string {
  const base = `DONNA identified a ${outcome.insightType.replace(/_/g, ' ')} — "${outcome.insightTitle}".`

  switch (outcome.status) {
    case 'concluded_correct':
      return `${base} The director investigated and confirmed the insight was valid. ${outcome.conclusion ? `Conclusion: ${outcome.conclusion}` : ''}`

    case 'concluded_incorrect':
      return `${base} The director investigated and found the insight was incorrect or inapplicable. ${outcome.conclusion ? `Finding: ${outcome.conclusion}` : ''} This is valuable calibration data — future similar insights should be held to higher scrutiny.`

    case 'inconclusive':
      return `${base} The director investigated but could not confirm or deny the insight. ${outcome.conclusion ? `Notes: ${outcome.conclusion}` : ''} The question remains open.`

    case 'dismissed':
      return `${base} The director reviewed and dismissed it without investigation. ${outcome.reviewerNotes ? `Reason: ${outcome.reviewerNotes}` : ''}`

    case 'in_progress':
      return `${base} Investigation is in progress. ${outcome.reviewerNotes ? `Current notes: ${outcome.reviewerNotes}` : ''}`

    case 'pending':
      return `${base} Accepted for investigation — no conclusion yet.`
  }
}

// ── Evidence consolidator ──────────────────────────────────────────────────────

function buildEvidence(outcome: InsightInvestigationOutcome): string[] {
  const evidence: string[] = [
    `Original insight type: ${outcome.insightType.replace(/_/g, ' ')}`,
    `Investigation status: ${outcome.status.replace(/_/g, ' ')}`,
    `Original DONNA confidence: ${outcome.originalConfidence}`,
    `Evidence strength at insight time: ${outcome.evidenceStrength}`,
  ]

  if (outcome.actionsTaken.length > 0) {
    evidence.push(`Director actions taken: ${outcome.actionsTaken.join('; ')}`)
  }

  return evidence
}

// ── Core bridge function ──────────────────────────────────────────────────────
// Converts an insight investigation outcome into an AcademyMemory record.
// This record is ready to be ingested by the memory engine in V2.

export function bridgeInsightToMemory(outcome: InsightInvestigationOutcome): AcademyMemory {
  return {
    id:             `insight-outcome-${outcome.insightId}-${Date.now()}`,
    sourceType:     'donna_recommendation',
    headline:       buildHeadline(outcome),
    summary:        buildSummary(outcome),
    evidence:       buildEvidence(outcome),
    entityLinks:    [],
    importance:     outcome.status === 'concluded_correct' || outcome.status === 'concluded_incorrect' ? 'high' : 'medium',
    confidence:     deriveMemoryConfidence(outcome.status),
    occurredAt:     outcome.investigatedAt,
    overrideReason: null,
    reviewerNotes:  outcome.reviewerNotes,
    dataGaps: outcome.status === 'inconclusive'
      ? ['Investigation ran but could not confirm or deny the original insight.']
      : outcome.status === 'pending' || outcome.status === 'in_progress'
        ? ['Investigation not yet complete — outcome unknown.']
        : [],
  }
}

// ── Batch bridge ──────────────────────────────────────────────────────────────
// For V2: converts multiple outcomes at once for bulk memory ingestion.

export function bridgeInsightOutcomesToMemories(
  outcomes: InsightInvestigationOutcome[],
): AcademyMemory[] {
  return outcomes
    .filter(o => o.status !== 'pending')  // pending outcomes have no conclusion yet
    .map(outcome => bridgeInsightToMemory(outcome))
}

// ── V1 mock generator (test/demo use only) ────────────────────────────────────
// Creates a sample outcome from an AcademyInsight. Used in testing.
// V2 will replace this with real director interaction.

export function createPendingOutcome(insight: AcademyInsight): InsightInvestigationOutcome {
  return {
    insightId:          insight.id,
    insightTitle:       insight.title,
    insightType:        insight.insightType,
    status:             'pending',
    conclusion:         null,
    investigatedAt:     new Date().toISOString(),
    reviewerNotes:      null,
    actionsTaken:       [],
    evidenceStrength:   insight.evidenceStrength,
    originalConfidence: insight.confidence,
  }
}
