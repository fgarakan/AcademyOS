// Mega Sprint 1505–1534 — DONNA Coach Intelligence V1
// Pure TypeScript — no DB, no React, no side effects.
// Answers: How is Coach X doing? Which coaches are overloaded? Which coach
// has the most promotion-ready players? Which coach has stalled players?
// Which coach needs support? Which players are assigned to this coach?
// Which coach relationships are missing?

import type { CoachEntity } from '@/lib/donna/entities/donnaAcademyEntityModel'
import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'
import { evaluatePlayerPromotion } from '@/lib/donna/promotion/donnaPlayerPromotionEngine'
import type { PlayerEntity } from '@/lib/donna/entities/donnaAcademyEntityModel'

// ── Output types ──────────────────────────────────────────────────────────────

export type CoachRiskLevel = 'none' | 'low' | 'medium' | 'high'

export interface CoachPlayerBreakdown {
  playerId:    string
  playerName:  string
  status:      'ready' | 'review_required' | 'blocked' | 'missing_evidence' | 'enrolled'
}

export interface CoachIntelligenceResult {
  coachId:            string
  coachName:          string
  role:               string
  playerCount:        number
  promotionReadyCount: number
  reviewRequiredCount: number
  blockedCount:        number
  missingEvidenceCount: number
  players:            CoachPlayerBreakdown[]
  riskLevel:          CoachRiskLevel
  headline:           string
  synthesis:          string
  recommendedAction:  string | null
  dataGaps:           string[]
  confidence:         'high' | 'medium' | 'low'
}

export interface AcademyCoachSummary {
  coaches:             CoachIntelligenceResult[]
  totalCoaches:        number
  unassignedPlayers:   string[]    // player names with no primary_coach_id
  overloadedCoaches:   string[]    // coaches with > threshold player count
  stalledCoachNames:   string[]    // coaches with ≥ 2 blocked/missing_evidence players
  needsSupportNames:   string[]    // coaches flagged high risk
  missingCoachPlayers: number      // count of players without a coach assignment
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OVERLOAD_THRESHOLD = 8   // > 8 players per coach = overloaded
const STALL_THRESHOLD    = 2   // ≥ 2 blocked or missing_evidence = stalled coach

// ── Single coach intelligence ─────────────────────────────────────────────────

export function evaluateCoachIntelligence(
  coach: CoachEntity,
  ctx:   AcademyEntityContext,
): CoachIntelligenceResult {
  const coachPlayers = ctx.players.filter(p => p.primaryCoachId === coach.id)

  const breakdown: CoachPlayerBreakdown[] = coachPlayers.map(p => {
    const pEntity: PlayerEntity = {
      kind:                    'player',
      id:                      p.playerId,
      displayName:             p.playerName,
      confidence:              1.0,
      lastUpdatedAt:           null,
      currentLevelId:          p.currentLevelId,
      currentLevelDisplayName: p.currentLevelDisplayName,
      advancementEligible:     p.advancementEligible,
      enrolledAt:              p.enrolledAt,
      lastEvaluatedAt:         p.lastEvaluatedAt,
      primaryCoachId:          p.primaryCoachId,
    }
    const decision = evaluatePlayerPromotion(pEntity, ctx)
    let status: CoachPlayerBreakdown['status']
    switch (decision.status) {
      case 'READY':            status = 'ready';            break
      case 'REVIEW_REQUIRED':  status = 'review_required';  break
      case 'BLOCKED':          status = 'blocked';          break
      case 'MISSING_EVIDENCE': status = 'missing_evidence'; break
      default:                 status = 'enrolled'
    }
    return { playerId: p.playerId, playerName: p.playerName, status }
  })

  const promotionReadyCount  = breakdown.filter(b => b.status === 'ready').length
  const reviewRequiredCount  = breakdown.filter(b => b.status === 'review_required').length
  const blockedCount         = breakdown.filter(b => b.status === 'blocked').length
  const missingEvidenceCount = breakdown.filter(b => b.status === 'missing_evidence').length
  const playerCount          = breakdown.length

  const dataGaps: string[] = []
  if (playerCount === 0) {
    dataGaps.push('No players currently assigned to this coach')
  }
  if (missingEvidenceCount > 0) {
    dataGaps.push(`${missingEvidenceCount} player${missingEvidenceCount > 1 ? 's' : ''} missing assessment evidence`)
  }

  // Risk scoring
  let riskLevel: CoachRiskLevel = 'none'
  const stallCount = blockedCount + missingEvidenceCount
  if (playerCount === 0) {
    riskLevel = 'low'      // no assignments — unusual but not urgent
  } else if (stallCount >= STALL_THRESHOLD && playerCount > 0) {
    riskLevel = stallCount >= 3 ? 'high' : 'medium'
  } else if (playerCount > OVERLOAD_THRESHOLD) {
    riskLevel = 'medium'
  }

  // Headline
  let headline: string
  if (playerCount === 0) {
    headline = `${coach.displayName} has no assigned players`
  } else if (riskLevel === 'high') {
    headline = `${coach.displayName} needs support — ${stallCount} players stalled or missing evidence`
  } else if (riskLevel === 'medium') {
    headline = `${coach.displayName} has some players needing attention`
  } else if (promotionReadyCount > 0) {
    headline = `${coach.displayName} has ${promotionReadyCount} player${promotionReadyCount > 1 ? 's' : ''} ready to advance`
  } else {
    headline = `${coach.displayName} — ${playerCount} player${playerCount > 1 ? 's' : ''} enrolled, no urgent flags`
  }

  // Synthesis
  const parts: string[] = []
  if (playerCount > 0) {
    parts.push(`${playerCount} player${playerCount > 1 ? 's' : ''} assigned`)
  }
  if (promotionReadyCount > 0) {
    parts.push(`${promotionReadyCount} ready to advance`)
  }
  if (reviewRequiredCount > 0) {
    parts.push(`${reviewRequiredCount} pending review`)
  }
  if (blockedCount > 0) {
    parts.push(`${blockedCount} blocked`)
  }
  if (missingEvidenceCount > 0) {
    parts.push(`${missingEvidenceCount} missing evidence`)
  }
  const synthesis = parts.length > 0 ? parts.join(', ') + '.' : 'No data available.'

  // Recommended action
  let recommendedAction: string | null = null
  if (riskLevel === 'high') {
    recommendedAction = `Review ${coach.displayName}'s blocked players and schedule a check-in`
  } else if (promotionReadyCount > 0) {
    recommendedAction = `Approve advancement for ${coach.displayName}'s ready players`
  } else if (missingEvidenceCount > 0) {
    recommendedAction = `Schedule assessments for ${coach.displayName}'s players missing evidence`
  } else if (playerCount > OVERLOAD_THRESHOLD) {
    recommendedAction = `Consider redistributing players — ${coach.displayName} has ${playerCount} assigned`
  }

  const confidence: CoachIntelligenceResult['confidence'] =
    playerCount === 0 ? 'low' : missingEvidenceCount / Math.max(playerCount, 1) > 0.5 ? 'medium' : 'high'

  return {
    coachId:             coach.id,
    coachName:           coach.displayName,
    role:                coach.role,
    playerCount,
    promotionReadyCount,
    reviewRequiredCount,
    blockedCount,
    missingEvidenceCount,
    players:             breakdown,
    riskLevel,
    headline,
    synthesis,
    recommendedAction,
    dataGaps,
    confidence,
  }
}

// ── Academy-wide coach scan ───────────────────────────────────────────────────

export function evaluateAllCoaches(ctx: AcademyEntityContext): AcademyCoachSummary {
  const coachList = ctx.coaches ?? []

  const results: CoachIntelligenceResult[] = coachList.map(c => {
    const coachEntity: CoachEntity = {
      kind:          'coach',
      id:            c.coachId,
      displayName:   c.displayName,
      confidence:    1.0,
      lastUpdatedAt: null,
      role:          c.role,
    }
    return evaluateCoachIntelligence(coachEntity, ctx)
  })

  const assignedPlayerIds = new Set(
    ctx.players
      .filter(p => p.primaryCoachId !== null && p.primaryCoachId !== undefined)
      .map(p => p.playerId),
  )
  const unassignedPlayers = ctx.players
    .filter(p => !assignedPlayerIds.has(p.playerId))
    .map(p => p.playerName)

  const overloadedCoaches  = results.filter(r => r.playerCount > OVERLOAD_THRESHOLD).map(r => r.coachName)
  const stalledCoachNames  = results.filter(r => (r.blockedCount + r.missingEvidenceCount) >= STALL_THRESHOLD).map(r => r.coachName)
  const needsSupportNames  = results.filter(r => r.riskLevel === 'high').map(r => r.coachName)

  return {
    coaches:             results,
    totalCoaches:        coachList.length,
    unassignedPlayers,
    overloadedCoaches,
    stalledCoachNames,
    needsSupportNames,
    missingCoachPlayers: unassignedPlayers.length,
  }
}

// ── Answer builders ───────────────────────────────────────────────────────────

export function buildSingleCoachAnswer(result: CoachIntelligenceResult): string {
  const lines: string[] = [
    `**${result.headline}**`,
    '',
    result.synthesis,
  ]

  if (result.players.length > 0) {
    lines.push('')
    lines.push('**Player breakdown:**')
    for (const p of result.players) {
      const label =
        p.status === 'ready'            ? '✓ Ready to advance' :
        p.status === 'review_required'  ? '→ Review needed'    :
        p.status === 'blocked'          ? '✗ Blocked'          :
        p.status === 'missing_evidence' ? '? Missing evidence'  :
                                          '· Enrolled'
      lines.push(`• ${p.playerName} — ${label}`)
    }
  }

  if (result.dataGaps.length > 0) {
    lines.push('')
    lines.push('**Data gaps:**')
    result.dataGaps.forEach(g => lines.push(`• ${g}`))
  }

  if (result.recommendedAction) {
    lines.push('')
    lines.push(`**Recommended action:** ${result.recommendedAction}`)
  }

  return lines.join('\n')
}

export function buildCoachSupportAnswer(summary: AcademyCoachSummary): string {
  const lines: string[] = ['**Coach support analysis**', '']

  if (summary.totalCoaches === 0) {
    lines.push('No coaches are currently active in this academy.')
    return lines.join('\n')
  }

  if (summary.needsSupportNames.length > 0) {
    lines.push(`**Needs support:** ${summary.needsSupportNames.join(', ')}`)
  }
  if (summary.stalledCoachNames.length > 0) {
    lines.push(`**Stalled player groups:** ${summary.stalledCoachNames.join(', ')}`)
  }
  if (summary.overloadedCoaches.length > 0) {
    lines.push(`**Potentially overloaded:** ${summary.overloadedCoaches.join(', ')}`)
  }
  if (summary.missingCoachPlayers > 0) {
    lines.push(`**Unassigned players:** ${summary.missingCoachPlayers} player${summary.missingCoachPlayers > 1 ? 's have' : ' has'} no coach assignment`)
    if (summary.unassignedPlayers.length <= 5) {
      lines.push(`  (${summary.unassignedPlayers.join(', ')})`)
    }
  }

  if (
    summary.needsSupportNames.length === 0 &&
    summary.stalledCoachNames.length === 0 &&
    summary.overloadedCoaches.length === 0 &&
    summary.missingCoachPlayers === 0
  ) {
    lines.push('All coaches appear to be in good standing based on available data.')
  }

  lines.push('')
  lines.push('*Coach intelligence is derived from player assignment and assessment data. Check individual coach profiles for full context.*')

  return lines.join('\n')
}

export function buildMissingCoachRelationshipsAnswer(summary: AcademyCoachSummary): string {
  if (summary.missingCoachPlayers === 0) {
    return 'All players have a coach assignment. No missing coach relationships detected.'
  }
  const names = summary.unassignedPlayers.length <= 8
    ? summary.unassignedPlayers.join(', ')
    : `${summary.unassignedPlayers.slice(0, 8).join(', ')} and ${summary.unassignedPlayers.length - 8} more`

  return [
    `**${summary.missingCoachPlayers} player${summary.missingCoachPlayers > 1 ? 's are' : ' is'} missing a coach assignment.**`,
    '',
    names,
    '',
    'Assign a primary coach to each player to unlock coach intelligence and ensure accountability.',
  ].join('\n')
}
