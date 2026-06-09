// Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
// Promotion recommendation formatter: formats a PromotionDecision into
// a structured DONNA answer and a UnifiedAnswer shape for the brain pipeline.
// buildPromotionRecommendation(decision, entityName) → formatted text
// promotionDecisionToUnifiedAnswer(decision, entityName, routeTarget) → UnifiedAnswer
// Pure TypeScript — no DB, no React, no side effects.

import type { PromotionDecision } from './donnaPromotionFramework'
import type { UnifiedAnswer, TimelineHighlight, RelationshipSummary } from '@/lib/donna/intelligence/donnaUnifiedAnswerBuilder'
import { createTrace, finalizeTrace } from '@/lib/donna/intelligence/donnaIntelligenceTrace'

// ── Status display labels ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  READY:            'Ready to advance',
  REVIEW_REQUIRED:  'Eligible — review needed',
  NOT_READY:        'Not ready',
  MISSING_EVIDENCE: 'Insufficient evidence',
  BLOCKED:          'Possible stall — review needed',
}

// ── Text formatter ────────────────────────────────────────────────────────────

export function buildPromotionRecommendation(
  decision: PromotionDecision,
  entityName: string,
): string {
  const statusLabel = STATUS_LABELS[decision.status] ?? decision.status
  const lines: string[] = []

  lines.push(`**${entityName} — ${statusLabel}**`)
  lines.push('')
  lines.push(decision.detail)

  if (decision.evidence.length > 0) {
    lines.push('')
    lines.push('**Evidence:**')
    for (const e of decision.evidence) {
      const marker = e.strength === 'supports' ? '✓' : e.strength === 'contradicts' ? '✗' : '·'
      lines.push(`${marker} ${e.claim}`)
    }
  }

  if (decision.contradictions.length > 0) {
    lines.push('')
    lines.push('**Contradicting signals:**')
    for (const c of decision.contradictions) {
      lines.push(`• ${c}`)
    }
  }

  if (decision.recommendedActions.length > 0) {
    lines.push('')
    lines.push('**Recommended actions:**')
    for (const r of decision.recommendedActions) {
      lines.push(`• ${r}`)
    }
  }

  if (decision.missingEvidence.length > 0) {
    lines.push('')
    lines.push('**Not available in current context:**')
    for (const m of decision.missingEvidence) {
      lines.push(`• ${m}`)
    }
  }

  if (decision.dataQualityNote) {
    lines.push('')
    lines.push(`*Note: ${decision.dataQualityNote}*`)
  }

  return lines.join('\n')
}

// ── UnifiedAnswer converter ───────────────────────────────────────────────────

export function promotionDecisionToUnifiedAnswer(
  decision: PromotionDecision,
  entityName: string,
  routeTarget: string | null,
): UnifiedAnswer {
  let trace = createTrace({
    entityKind:       'player',
    entityId:         null,
    entityName,
    confidenceSource: decision.confidence === 'high' ? 'high_confidence_entity' : 'medium_confidence_entity',
  })
  trace = finalizeTrace(trace)

  const timelineHighlights: TimelineHighlight[] = []
  const relationships: RelationshipSummary[]    = []
  const statusLabel = STATUS_LABELS[decision.status] ?? decision.status

  return {
    headline:              `${entityName} — ${statusLabel} (${decision.confidence} confidence)`,
    detail:                buildPromotionRecommendation(decision, entityName),
    evidence:              decision.evidence.map(e => e.claim),
    timelineHighlights,
    relationships,
    confidence:            decision.confidence,
    missingInformation:    decision.missingEvidence,
    recommendations:       decision.recommendedActions,
    recommendedNextAction: decision.recommendedActions[0] ?? null,
    routeTarget,
    trace,
  }
}
