// Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
// Player promotion engine: evaluates a single player's promotion readiness
// from signals available in AcademyEntityContext (no DB calls).
// evaluatePlayerPromotion(entity, ctx) → PromotionDecision
// Pure TypeScript — no DB, no React, no side effects.

import type { PlayerEntity } from '@/lib/donna/entities/donnaAcademyEntityModel'
import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'
import type { AssessmentSummary } from '@/lib/donna/extendedContextLoaders'
import type { PromotionDecision, PromotionEvidenceItem } from './donnaPromotionFramework'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(dateString: string): number {
  const then = new Date(dateString).getTime()
  if (isNaN(then)) return 0
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000))
}

// ── Main function ─────────────────────────────────────────────────────────────

export function evaluatePlayerPromotion(
  entity: PlayerEntity,
  ctx: AcademyEntityContext,
): PromotionDecision {
  const playerAssessments: AssessmentSummary[] = ctx.assessments.filter(
    a => a.playerId === entity.id,
  )
  const readyAssessments    = playerAssessments.filter(a => a.promotionReady)
  const notReadyAssessments = playerAssessments.filter(a => !a.promotionReady)

  const daysAtLevel = entity.enrolledAt ? daysAgo(entity.enrolledAt) : 0

  const mostRecentAssessmentDate = playerAssessments
    .map(a => a.assessedDate)
    .sort()
    .at(-1) ?? null
  const daysSinceLastAssessment = mostRecentAssessmentDate ? daysAgo(mostRecentAssessmentDate) : null

  const levelName = entity.currentLevelDisplayName ?? 'current level'

  // ── Build evidence array ───────────────────────────────────────────────────

  const evidence: PromotionEvidenceItem[] = []

  evidence.push({
    source:     'advancement_eligible_flag',
    claim:      entity.advancementEligible
      ? `Director/coach has marked ${entity.displayName} as advancement-eligible`
      : `${entity.displayName} is not currently marked as advancement-eligible`,
    strength:   entity.advancementEligible ? 'supports' : 'contradicts',
    confidence: 'high',
  })

  if (readyAssessments.length > 0) {
    const latest = readyAssessments.at(-1)!
    evidence.push({
      source:     'assessment',
      claim:      `Assessment on ${latest.assessedDate} marked promotion-ready${latest.overallScore !== null ? ` (score: ${latest.overallScore})` : ''}`,
      strength:   'supports',
      confidence: 'high',
    })
  } else if (notReadyAssessments.length > 0) {
    const latest = notReadyAssessments.at(-1)!
    evidence.push({
      source:     'assessment',
      claim:      `Most recent assessment (${latest.assessedDate}) did not indicate promotion readiness`,
      strength:   'contradicts',
      confidence: 'medium',
    })
  }

  evidence.push({
    source:     'enrollment_duration',
    claim:      `${entity.displayName} has been at ${levelName} for ${daysAtLevel} days`,
    strength:   'neutral',
    confidence: 'high',
  })

  // ── Base missing evidence (always disclosed) ───────────────────────────────

  const baseMissingEvidence: string[] = [
    'Gate criteria thresholds (advance_min_assessment_score, advance_min_domains_complete) — not in current context',
    'Per-gate evidence counts from player_gate_status — not in current context',
    'Curriculum history (previous level changes) — not in current context',
  ]

  // ── READY: eligible + assessment confirms ──────────────────────────────────

  if (entity.advancementEligible && readyAssessments.length > 0) {
    return {
      status:             'READY',
      confidence:         'high',
      reason:             `${entity.displayName} is marked advancement-eligible with at least one promotion-ready assessment.`,
      detail:             `${entity.displayName} has been flagged as advancement-eligible (director/coach confirmed) and has ${readyAssessments.length} promotion-ready assessment${readyAssessments.length > 1 ? 's' : ''} on record. This is strong evidence for advancement. DONNA cannot verify gate criteria thresholds — director review of the full gate evidence is required before approving.`,
      evidence,
      contradictions:     [],
      missingEvidence:    baseMissingEvidence,
      recommendedActions: [
        `Review ${entity.displayName}'s full gate evidence, then approve or defer advancement`,
        'Confirm all gate criteria are met before approving level change',
      ],
      dataQualityNote:    'Gate criteria thresholds and per-gate evidence counts are not available in the current context snapshot. Director must verify full gate completion before approving.',
    }
  }

  // ── REVIEW_REQUIRED: eligible but no confirming assessment ─────────────────

  if (entity.advancementEligible && readyAssessments.length === 0) {
    const missingEvidence = [...baseMissingEvidence]
    const contradictions: string[] = []
    const recommendedActions: string[] = []

    if (playerAssessments.length === 0) {
      missingEvidence.push('No assessment records on file — promotion readiness cannot be confirmed')
      recommendedActions.push(`Schedule a formal assessment for ${entity.displayName} to confirm advancement readiness`)
    } else {
      contradictions.push('Advancement-eligible but no assessment explicitly marks promotion-ready')
      recommendedActions.push(`Review ${entity.displayName}'s existing assessments to determine if an update is needed`)
      recommendedActions.push('Consider scheduling a formal promotion assessment')
    }

    return {
      status:             'REVIEW_REQUIRED',
      confidence:         'medium',
      reason:             `${entity.displayName} is marked advancement-eligible but no promotion-ready assessment corroborates this.`,
      detail:             `${entity.displayName} has been flagged as advancement-eligible, but ${playerAssessments.length === 0 ? 'no assessments are on record' : 'no assessment has been marked promotion-ready'}. Director should review whether a formal assessment is needed before approving advancement.`,
      evidence,
      contradictions,
      missingEvidence,
      recommendedActions,
      dataQualityNote:    'Advancement-eligible flag is set, but assessment evidence is missing or does not confirm promotion readiness.',
    }
  }

  // ── Not eligible paths ─────────────────────────────────────────────────────

  const missingEvidence = [...baseMissingEvidence]
  const contradictions: string[] = ['Not marked advancement-eligible']
  const recommendedActions: string[] = []

  // MISSING_EVIDENCE: no assessments at all
  if (playerAssessments.length === 0) {
    missingEvidence.push('No assessment records on file')
    missingEvidence.push('No evaluation date recorded — last_evaluated_at is null')
    recommendedActions.push(`Schedule a formal assessment for ${entity.displayName}`)
    recommendedActions.push('After assessment, coach or director can update the advancement-eligible flag')
    return {
      status:             'MISSING_EVIDENCE',
      confidence:         'medium',
      reason:             `${entity.displayName} has no assessment records — promotion readiness cannot be evaluated.`,
      detail:             `${entity.displayName} is not marked advancement-eligible and has no assessment records in the system. DONNA cannot evaluate promotion readiness without assessment evidence. A formal assessment should be scheduled.`,
      evidence,
      contradictions,
      missingEvidence,
      recommendedActions,
      dataQualityNote:    'No assessments on file. Promotion evaluation requires at least one assessment record.',
    }
  }

  // MISSING_EVIDENCE: last assessment is stale (> 90 days)
  if (daysSinceLastAssessment !== null && daysSinceLastAssessment > 90) {
    missingEvidence.push(`Most recent assessment is ${daysSinceLastAssessment} days old — evidence is stale`)
    recommendedActions.push(`Schedule a reassessment for ${entity.displayName} (last assessed ${daysSinceLastAssessment} days ago)`)
    return {
      status:             'MISSING_EVIDENCE',
      confidence:         'medium',
      reason:             `${entity.displayName} has not been assessed in ${daysSinceLastAssessment} days — evidence is too stale to evaluate.`,
      detail:             `${entity.displayName} is not marked advancement-eligible. The most recent assessment is ${daysSinceLastAssessment} days old, exceeding the 90-day recency threshold. DONNA cannot reliably evaluate current promotion readiness from stale evidence.`,
      evidence,
      contradictions,
      missingEvidence,
      recommendedActions,
      dataQualityNote:    `Assessment evidence is ${daysSinceLastAssessment} days old. Reassessment recommended for accurate promotion evaluation.`,
    }
  }

  // BLOCKED: not eligible + long stall (>180 days) + multiple failed assessments
  if (daysAtLevel > 180 && notReadyAssessments.length >= 2) {
    contradictions.push(`${entity.displayName} has been at ${levelName} for ${daysAtLevel} days without advancing`)
    contradictions.push(`${notReadyAssessments.length} assessments on record — none indicate promotion readiness`)
    recommendedActions.push(`Review ${entity.displayName}'s development plan with their coach`)
    recommendedActions.push('Consider whether the curriculum level is an appropriate fit')
    recommendedActions.push('Check for attendance or engagement factors contributing to the stall')
    return {
      status:             'BLOCKED',
      confidence:         'medium',
      reason:             `${entity.displayName} has been at ${levelName} for ${daysAtLevel} days with ${notReadyAssessments.length} not-ready assessments — possible long-term stall.`,
      detail:             `${entity.displayName} is not advancement-eligible and has ${notReadyAssessments.length} assessments on record, none indicating promotion readiness. With ${daysAtLevel} days at the current level, this pattern is consistent with a blocked advancement situation. Note: DONNA cannot read specific blocker flags (advancement_blocked_by) from the current context — a full player review is recommended.`,
      evidence,
      contradictions,
      missingEvidence: [...missingEvidence, 'Specific blocker strings (advancement_blocked_by) — not available in current context'],
      recommendedActions,
      dataQualityNote:    'Specific blocker strings (advancement_blocked_by) are not available in the current context. Status is inferred from heuristic — review the full player record for explicit blockers.',
    }
  }

  // NOT_READY: not eligible + has recent assessments but none promotion-ready
  if (notReadyAssessments.length > 0) {
    contradictions.push(`${notReadyAssessments.length} assessment${notReadyAssessments.length > 1 ? 's' : ''} without promotion-ready flag`)
  }
  recommendedActions.push('Continue current curriculum work and schedule next assessment')
  recommendedActions.push(`Check with ${entity.displayName}'s coach on development milestones`)

  return {
    status:             'NOT_READY',
    confidence:         'medium',
    reason:             `${entity.displayName} is not marked advancement-eligible and current assessment evidence does not indicate promotion readiness.`,
    detail:             `${entity.displayName} is not currently advancement-eligible. ${notReadyAssessments.length > 0 ? `${notReadyAssessments.length} assessment${notReadyAssessments.length > 1 ? 's are' : ' is'} on record but ${notReadyAssessments.length > 1 ? 'none indicate' : 'it does not indicate'} promotion readiness.` : 'No promotion-ready assessments are on record.'} The player is actively enrolled at ${levelName} (${daysAtLevel} days).`,
    evidence,
    contradictions,
    missingEvidence,
    recommendedActions,
    dataQualityNote:    null,
  }
}
