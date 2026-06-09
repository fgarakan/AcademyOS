// Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
// Group promotion engine: evaluates whether a training group's level cohort
// is ready for a group-level advancement action.
// evaluateGroupPromotion(entity, ctx) → PromotionDecision
// Pure TypeScript — no DB, no React, no side effects.

import type { GroupEntity } from '@/lib/donna/entities/donnaAcademyEntityModel'
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

export function evaluateGroupPromotion(
  entity: GroupEntity,
  ctx: AcademyEntityContext,
): PromotionDecision {
  const baseMissingEvidence: string[] = [
    'Group member list (group_players) — not in current context; DONNA uses level-based proxy',
    'Level advancement thresholds — not in current context',
    'Per-gate evidence counts — not in current context',
  ]

  const evidence: PromotionEvidenceItem[] = []

  // Cannot evaluate without a level
  if (!entity.levelId) {
    evidence.push({
      source:     'group_level',
      claim:      `Group "${entity.displayName}" has no curriculum level assigned`,
      strength:   'neutral',
      confidence: 'high',
    })
    return {
      status:             'MISSING_EVIDENCE',
      confidence:         'low',
      reason:             `Group "${entity.displayName}" has no curriculum level — promotion cannot be evaluated.`,
      detail:             `Group "${entity.displayName}" does not have a curriculum level assigned. DONNA cannot evaluate group advancement readiness without a level association.`,
      evidence,
      contradictions:     [],
      missingEvidence:    baseMissingEvidence,
      recommendedActions: [`Assign a curriculum level to group "${entity.displayName}"`],
      dataQualityNote:    'Group has no levelId — assign a curriculum level first.',
    }
  }

  // Find players at the group's curriculum level (proxy for group membership)
  const levelPlayers: PlayerCurriculumStateSummary[] = ctx.players.filter(
    p => p.currentLevelId === entity.levelId,
  )

  if (levelPlayers.length === 0) {
    evidence.push({
      source:     'player_count',
      claim:      `No players found at the level associated with group "${entity.displayName}"`,
      strength:   'neutral',
      confidence: 'medium',
    })
    return {
      status:             'MISSING_EVIDENCE',
      confidence:         'low',
      reason:             `No players found at the level associated with group "${entity.displayName}".`,
      detail:             `DONNA uses curriculum level as a proxy for group membership (actual group membership data is not in the current context snapshot). No players were found at the level associated with "${entity.displayName}".`,
      evidence,
      contradictions:     [],
      missingEvidence:    baseMissingEvidence,
      recommendedActions: [`Check player enrollments at ${entity.displayName}'s curriculum level`],
      dataQualityNote:    'Group membership not available in context — using level-based proxy. Actual group roster may differ.',
    }
  }

  const eligiblePlayers    = levelPlayers.filter(p => p.advancementEligible)
  const playerAssessments  = ctx.assessments.filter(a =>
    levelPlayers.some(p => p.playerId === a.playerId),
  )
  const readyAssessments   = playerAssessments.filter(a => a.promotionReady)
  const stalledPlayers     = levelPlayers.filter(p => daysAgo(p.enrolledAt) > 90)
  const majorityThreshold  = Math.ceil(levelPlayers.length / 2)
  const eligiblePct        = Math.round(eligiblePlayers.length / levelPlayers.length * 100)

  const contradictions: string[]     = []
  const recommendedActions: string[] = []

  evidence.push({
    source:     'player_count',
    claim:      `${levelPlayers.length} player${levelPlayers.length !== 1 ? 's' : ''} at the level associated with "${entity.displayName}" (proxy — actual roster may differ)`,
    strength:   'neutral',
    confidence: 'medium',
  })

  evidence.push({
    source:     'advancement_eligible',
    claim:      `${eligiblePlayers.length} of ${levelPlayers.length} players are advancement-eligible (${eligiblePct}%)`,
    strength:   eligiblePlayers.length >= majorityThreshold ? 'supports' : 'contradicts',
    confidence: 'high',
  })

  if (readyAssessments.length > 0) {
    evidence.push({
      source:     'assessment',
      claim:      `${readyAssessments.length} promotion-ready assessment${readyAssessments.length !== 1 ? 's' : ''} among level players`,
      strength:   'supports',
      confidence: 'high',
    })
  }

  if (entity.maxPlayers !== null) {
    const isOverCapacity = levelPlayers.length > entity.maxPlayers
    evidence.push({
      source:     'group_capacity',
      claim:      `${levelPlayers.length} players vs max capacity of ${entity.maxPlayers}${isOverCapacity ? ' — over capacity' : ''}`,
      strength:   'neutral',
      confidence: 'medium',
    })
  }

  // READY: majority eligible + assessment support
  if (eligiblePlayers.length >= majorityThreshold && readyAssessments.length > 0) {
    recommendedActions.push(`Review advancement candidates in group "${entity.displayName}"`)
    recommendedActions.push('Approve individual advancements via the players section — do not move groups automatically')
    return {
      status:             'READY',
      confidence:         'medium',
      reason:             `${eligiblePlayers.length} of ${levelPlayers.length} players at "${entity.displayName}"'s level are advancement-eligible with assessment support.`,
      detail:             `A majority of players at the level associated with group "${entity.displayName}" are marked advancement-eligible and ${readyAssessments.length} promotion-ready assessment${readyAssessments.length > 1 ? 's' : ''} corroborate this. The group is a candidate for advancement review. All individual level changes require director approval.`,
      evidence,
      contradictions,
      missingEvidence:    baseMissingEvidence,
      recommendedActions,
      dataQualityNote:    'Uses level-based proxy for group membership. Gate criteria details not available in current context.',
    }
  }

  // REVIEW_REQUIRED: majority eligible, no confirming assessments
  if (eligiblePlayers.length >= majorityThreshold && readyAssessments.length === 0) {
    contradictions.push('Majority eligible but no promotion-ready assessments corroborate eligibility')
    recommendedActions.push(`Schedule formal assessments for eligible players in group "${entity.displayName}"`)
    return {
      status:             'REVIEW_REQUIRED',
      confidence:         'medium',
      reason:             `${eligiblePlayers.length} of ${levelPlayers.length} players in "${entity.displayName}"'s level are eligible but no assessments confirm readiness.`,
      detail:             `A majority of players at the level associated with group "${entity.displayName}" are advancement-eligible, but no assessments confirm promotion readiness. Formal assessments should be scheduled before advancing this group.`,
      evidence,
      contradictions,
      missingEvidence:    baseMissingEvidence,
      recommendedActions,
      dataQualityNote:    'Assessment corroboration is missing. Schedule assessments before advancing.',
    }
  }

  // BLOCKED: high stall rate + no eligibility
  const highStallRate = stalledPlayers.length > Math.floor(levelPlayers.length / 2)
  if (highStallRate && eligiblePlayers.length === 0) {
    contradictions.push(`${stalledPlayers.length} of ${levelPlayers.length} level players have been enrolled 90+ days`)
    contradictions.push('No players at this level are marked advancement-eligible')
    recommendedActions.push(`Review curriculum approach for group "${entity.displayName}" with head coach`)
    return {
      status:             'BLOCKED',
      confidence:         'medium',
      reason:             `Group "${entity.displayName}" has a high stall rate and no advancement-eligible players.`,
      detail:             `${stalledPlayers.length} of ${levelPlayers.length} players at the level associated with group "${entity.displayName}" have been enrolled for 90+ days and no players are currently advancement-eligible. The director should review the curriculum approach and coaching strategy for this group.`,
      evidence,
      contradictions,
      missingEvidence:    [...baseMissingEvidence, 'Stall rate inferred from enrollment dates — specific blockers not available'],
      recommendedActions,
      dataQualityNote:    'Stall rate is inferred from enrollment dates. Group membership is approximated by curriculum level.',
    }
  }

  // NOT_READY
  contradictions.push(`Only ${eligiblePlayers.length} of ${levelPlayers.length} players are advancement-eligible (below 50%)`)
  recommendedActions.push('Continue curriculum work and schedule assessments as players approach readiness')
  return {
    status:             'NOT_READY',
    confidence:         'medium',
    reason:             `Group "${entity.displayName}" has only ${eligiblePlayers.length} of ${levelPlayers.length} advancement-eligible players — not ready for group advancement.`,
    detail:             `At the level associated with group "${entity.displayName}", ${eligiblePlayers.length} of ${levelPlayers.length} players are marked advancement-eligible (${eligiblePct}%) — below the 50% threshold. The group is not yet ready for group-level advancement review.`,
    evidence,
    contradictions,
    missingEvidence:    baseMissingEvidence,
    recommendedActions,
    dataQualityNote:    'Uses level-based proxy for group membership.',
  }
}
