// Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
// Curriculum level promotion engine: evaluates whether a curriculum level
// is ready for group advancement or needs curriculum review.
// evaluateCurriculumLevel(entity, ctx) → PromotionDecision
// Pure TypeScript — no DB, no React, no side effects.

import type { CurriculumLevelEntity } from '@/lib/donna/entities/donnaAcademyEntityModel'
import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'
import type { PlayerCurriculumStateSummary } from '@/lib/donna/extendedContextLoaders'
import type { PromotionDecision, PromotionEvidenceItem } from './donnaPromotionFramework'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(dateString: string): number {
  const then = new Date(dateString).getTime()
  if (isNaN(then)) return 0
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000))
}

// ── Main function ─────────────────────────────────────────────────────────────

export function evaluateCurriculumLevel(
  entity: CurriculumLevelEntity,
  ctx: AcademyEntityContext,
): PromotionDecision {
  const levelPlayers: PlayerCurriculumStateSummary[] = ctx.players.filter(
    p => p.currentLevelId === entity.id || p.currentLevelDisplayName === entity.displayName,
  )

  const baseMissingEvidence: string[] = [
    'Level advancement thresholds (advance_min_assessment_score, advance_min_domains_complete) — not in current context',
    'Gate criteria definitions from curriculum_gates — not in current context',
    'Per-player gate evidence counts — not in current context',
  ]

  const evidence: PromotionEvidenceItem[] = []

  if (levelPlayers.length === 0) {
    evidence.push({
      source:     'player_count',
      claim:      `No players are currently enrolled at ${entity.displayName}`,
      strength:   'neutral',
      confidence: 'high',
    })
    return {
      status:             'MISSING_EVIDENCE',
      confidence:         'medium',
      reason:             `No players are enrolled at ${entity.displayName} — cannot evaluate advancement readiness.`,
      detail:             `There are no players currently at the ${entity.displayName} level in the context snapshot. DONNA cannot evaluate whether this level is ready for group advancement without player enrollment data.`,
      evidence,
      contradictions:     [],
      missingEvidence:    baseMissingEvidence,
      recommendedActions: [`Check if ${entity.displayName} is an active level with enrolled players`],
      dataQualityNote:    'No players at this level in the current context snapshot.',
    }
  }

  const eligiblePlayers    = levelPlayers.filter(p => p.advancementEligible)
  const playerAssessments  = ctx.assessments.filter(a =>
    levelPlayers.some(p => p.playerId === a.playerId),
  )
  const readyAssessments   = playerAssessments.filter(a => a.promotionReady)
  const stalledPlayers     = levelPlayers.filter(p => daysAgo(p.enrolledAt) > 90)
  const templates          = ctx.templates.filter(t => t.curriculumLevelId === entity.id)
  const majorityThreshold  = Math.ceil(levelPlayers.length / 2)
  const eligiblePct        = Math.round(eligiblePlayers.length / levelPlayers.length * 100)

  const contradictions: string[]     = []
  const recommendedActions: string[] = []

  evidence.push({
    source:     'player_count',
    claim:      `${levelPlayers.length} player${levelPlayers.length !== 1 ? 's' : ''} enrolled at ${entity.displayName}`,
    strength:   'neutral',
    confidence: 'high',
  })

  evidence.push({
    source:     'advancement_eligible',
    claim:      `${eligiblePlayers.length} of ${levelPlayers.length} players are marked advancement-eligible (${eligiblePct}%)`,
    strength:   eligiblePlayers.length >= majorityThreshold ? 'supports' : 'contradicts',
    confidence: 'high',
  })

  if (readyAssessments.length > 0) {
    evidence.push({
      source:     'assessment',
      claim:      `${readyAssessments.length} promotion-ready assessment${readyAssessments.length !== 1 ? 's' : ''} across level players`,
      strength:   'supports',
      confidence: 'high',
    })
  }

  if (templates.length === 0) {
    evidence.push({
      source:     'template_coverage',
      claim:      `No class templates are linked to ${entity.displayName}`,
      strength:   'contradicts',
      confidence: 'high',
    })
    contradictions.push('No class templates found for this level — coaching structure may be incomplete')
    recommendedActions.push(`Create class templates for ${entity.displayName}`)
  } else {
    evidence.push({
      source:     'template_coverage',
      claim:      `${templates.length} class template${templates.length !== 1 ? 's are' : ' is'} linked to ${entity.displayName}`,
      strength:   'supports',
      confidence: 'high',
    })
  }

  if (stalledPlayers.length > 0) {
    evidence.push({
      source:     'stall_rate',
      claim:      `${stalledPlayers.length} of ${levelPlayers.length} players have been at ${entity.displayName} for 90+ days`,
      strength:   stalledPlayers.length > Math.floor(levelPlayers.length / 2) ? 'contradicts' : 'neutral',
      confidence: 'medium',
    })
  }

  // READY: majority eligible + assessment evidence
  if (eligiblePlayers.length >= majorityThreshold && readyAssessments.length > 0) {
    recommendedActions.push(`Review advancement-eligible players at ${entity.displayName} and confirm gate completion`)
    recommendedActions.push('Approve advancement for ready players via the players section')
    return {
      status:             'READY',
      confidence:         'medium',
      reason:             `${eligiblePlayers.length} of ${levelPlayers.length} players at ${entity.displayName} are advancement-eligible with assessment support.`,
      detail:             `A majority (${eligiblePlayers.length}/${levelPlayers.length}) of players at ${entity.displayName} are marked advancement-eligible, and ${readyAssessments.length} promotion-ready assessment${readyAssessments.length > 1 ? 's' : ''} corroborate this. The level appears ready for group advancement review. Director approval is required before any level changes.`,
      evidence,
      contradictions,
      missingEvidence:    baseMissingEvidence,
      recommendedActions,
      dataQualityNote:    'Level advancement thresholds and gate criteria are not available in the current context. Director must verify full gate completion.',
    }
  }

  // REVIEW_REQUIRED: majority eligible but no confirming assessments
  if (eligiblePlayers.length >= majorityThreshold && readyAssessments.length === 0) {
    contradictions.push('Majority eligible but no promotion-ready assessments corroborate eligibility')
    recommendedActions.push(`Schedule formal promotion assessments for ${eligiblePlayers.length} eligible players at ${entity.displayName}`)
    return {
      status:             'REVIEW_REQUIRED',
      confidence:         'medium',
      reason:             `${eligiblePlayers.length} of ${levelPlayers.length} players at ${entity.displayName} are advancement-eligible but no assessments confirm readiness.`,
      detail:             `A majority of players at ${entity.displayName} are flagged as advancement-eligible, but no assessment records confirm promotion readiness. Formal assessments should be scheduled before advancing this group.`,
      evidence,
      contradictions,
      missingEvidence:    baseMissingEvidence,
      recommendedActions,
      dataQualityNote:    'Eligibility flags are set but assessment corroboration is missing.',
    }
  }

  // BLOCKED: high stall rate + no eligibility
  const highStallRate = stalledPlayers.length > Math.floor(levelPlayers.length / 2)
  if (highStallRate && eligiblePlayers.length === 0) {
    contradictions.push(`${stalledPlayers.length} of ${levelPlayers.length} players have been at this level for 90+ days`)
    contradictions.push('No players are currently marked advancement-eligible')
    recommendedActions.push(`Review curriculum fit for ${entity.displayName} with head coach`)
    recommendedActions.push('Check if level expectations and gate criteria are calibrated correctly')
    return {
      status:             'BLOCKED',
      confidence:         'medium',
      reason:             `${entity.displayName} has a high stall rate and no advancement-eligible players — possible curriculum bottleneck.`,
      detail:             `${stalledPlayers.length} of ${levelPlayers.length} players at ${entity.displayName} have been enrolled for 90+ days and no players are currently advancement-eligible. This is consistent with a curriculum bottleneck. Director should review whether the level criteria, coaching approach, or player fit is causing the stall.`,
      evidence,
      contradictions,
      missingEvidence:    [...baseMissingEvidence, 'Stall rate inferred from enrollment dates — specific blockers not available'],
      recommendedActions,
      dataQualityNote:    'Stall rate is inferred from enrollment dates. Gate criteria compliance is not available in current context.',
    }
  }

  // NOT_READY: minority eligible
  if (eligiblePlayers.length < majorityThreshold) {
    contradictions.push(`Only ${eligiblePlayers.length} of ${levelPlayers.length} players are advancement-eligible (below 50%)`)
  }
  recommendedActions.push(`Continue curriculum work at ${entity.displayName}`)
  recommendedActions.push('Schedule assessments for players approaching advancement readiness')

  return {
    status:             'NOT_READY',
    confidence:         'medium',
    reason:             `${entity.displayName} has ${eligiblePlayers.length} of ${levelPlayers.length} advancement-eligible players — not yet ready for group advancement.`,
    detail:             `At ${entity.displayName}, ${eligiblePlayers.length} of ${levelPlayers.length} players are marked advancement-eligible (${eligiblePct}%). This is below the 50% threshold DONNA uses as a group-advancement signal. Players should continue current curriculum work before advancement review.`,
    evidence,
    contradictions,
    missingEvidence:    baseMissingEvidence,
    recommendedActions,
    dataQualityNote:    null,
  }
}
