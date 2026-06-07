// Mega Sprint 784–813 — DONNA COO Intelligence Engine V1
//
// Pure TypeScript. No DB. No side effects.
// Takes loaded AcademyOS data, returns structured COO insights with
// evidence, confidence, recommended action, and data-gap disclosure.
//
// Rules:
//   - Never invents data. If data is missing, discloses the gap.
//   - Every insight has evidence[], confidence, and recommendedAction.
//   - Parent confidence disclosures are honest about schema gaps.
//   - Coach progression claims are low confidence without direct linkage.

import type { DirectorAttentionItem, DirectorAcademyRisk } from '@/lib/donna/directorDonnaContext'
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'
import type { PlayerCurriculumStateSummary } from '@/lib/donna/extendedContextLoaders'
import type { CoachSupportSummary } from '@/lib/donna/coachSupportLoader'
import type { PlayerAttentionRisk } from '@/lib/donna/playerAttentionRiskLoader'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Core insight types ────────────────────────────────────────────────────────

export type COOCategory =
  | 'program_health'
  | 'player_intelligence'
  | 'coach_intelligence'
  | 'parent_confidence'
  | 'director_decision'

export type COOConfidence = 'high' | 'medium' | 'low'

export interface COOInsight {
  category: COOCategory
  title: string
  finding: string
  evidence: string[]
  confidence: COOConfidence
  recommendedAction: string
  missingData?: string[]
  actionRoute?: string
}

// ── Group capacity (combined from groups + group_memberships + groupHealthLoader) ──

export interface GroupCapacity {
  groupId: string
  groupName: string
  maxPlayers: number | null
  currentPlayerCount: number
  attendanceRate: number | null
  sessionsLast30: number
  healthSignal: 'healthy' | 'at_risk' | 'insufficient_data'
}

// ── Combined input ────────────────────────────────────────────────────────────

export interface COOIntelligenceInput {
  // From DirectorDonnaContext
  pendingReviews: number
  oldestPendingReviewAgeDays: number | null
  missingWrapUps: number
  highRiskPlayerCount: number
  mediumRiskPlayerCount: number
  attentionItems: DirectorAttentionItem[]
  academyRisks: DirectorAcademyRisk[]
  playerProgressStalls: PlayerProgressStall[]
  advancementEligibleCount: number
  playerCurriculumStateSummaries: PlayerCurriculumStateSummary[]
  curriculumGaps: string[]
  assessmentCount: number
  recentAssessmentCount: number
  playerCount: number
  coachCount: number
  // Assembled in server action: groups + group_memberships + groupHealthLoader
  groupCapacities: GroupCapacity[]
  groupCapacityStatus: COOFieldStatus
  // From coachSupportLoader
  coachSupport: CoachSupportSummary[]
  coachSupportStatus: COOFieldStatus
  // From playerAttentionRiskLoader
  playerAttentionRisks: PlayerAttentionRisk[]
  playerAttentionRiskStatus: COOFieldStatus
  // From parentTrustLoader
  totalActivePlayers: number
  parentActionsProposed: number
  parentActionsPending: number
  parentCoverageAvailable: boolean
  parentBlockReason: string
  parentStatus: COOFieldStatus
}

// ── Report type ───────────────────────────────────────────────────────────────

export interface COOIntelligenceReport {
  generatedAt: string
  programHealth: COOInsight[]
  playerIntelligence: COOInsight[]
  coachIntelligence: COOInsight[]
  parentConfidence: COOInsight[]
  directorDecision: COOInsight[]
  allInsights: COOInsight[]
  readinessScore: number
  dataGaps: string[]
}

// ── Program Health ────────────────────────────────────────────────────────────

function buildProgramHealthInsights(input: COOIntelligenceInput): COOInsight[] {
  const insights: COOInsight[] = []
  const { groupCapacities, groupCapacityStatus, advancementEligibleCount, playerProgressStalls, playerCount } = input

  if (groupCapacityStatus === 'insufficient_data' || groupCapacities.length === 0) {
    insights.push({
      category: 'program_health',
      title: 'Program health data unavailable',
      finding: 'No active group or session data found.',
      evidence: ['No groups or sessions detected in the last 30 days'],
      confidence: 'low',
      recommendedAction: 'Ensure coaches are assigned to groups and sessions are being scheduled.',
      missingData: ['Active group session history'],
    })
    return insights
  }

  // Over-capacity groups
  const overCapacity = groupCapacities.filter(g => g.maxPlayers !== null && g.currentPlayerCount > g.maxPlayers)
  if (overCapacity.length > 0) {
    insights.push({
      category: 'program_health',
      title: `${overCapacity.length} group${overCapacity.length !== 1 ? 's' : ''} over capacity`,
      finding: `${overCapacity.map(g => `${g.groupName} (${g.currentPlayerCount}/${g.maxPlayers})`).join(', ')} exceed${overCapacity.length === 1 ? 's' : ''} the maximum player limit.`,
      evidence: overCapacity.map(g => `${g.groupName}: ${g.currentPlayerCount} players vs max ${g.maxPlayers ?? 'unset'}`),
      confidence: 'high',
      recommendedAction: 'Create a new group or increase the capacity limit. Do not leave groups over capacity — it affects coach quality and player experience.',
      actionRoute: '/director',
    })
  }

  // Under-capacity groups (≤50% of max_players, or ≤2 players with no cap but sessions exist)
  const underCapacity = groupCapacities.filter(g => {
    if (g.maxPlayers !== null) return g.currentPlayerCount <= Math.floor(g.maxPlayers * 0.5)
    return g.currentPlayerCount <= 2 && g.sessionsLast30 > 0
  })
  if (underCapacity.length > 0) {
    insights.push({
      category: 'program_health',
      title: `${underCapacity.length} group${underCapacity.length !== 1 ? 's' : ''} with low enrollment`,
      finding: `${underCapacity.map(g => g.groupName).join(', ')} ${underCapacity.length === 1 ? 'has' : 'have'} low player counts relative to capacity.`,
      evidence: underCapacity.map(g =>
        g.maxPlayers !== null
          ? `${g.groupName}: ${g.currentPlayerCount}/${g.maxPlayers} players (${Math.round(g.currentPlayerCount / g.maxPlayers * 100)}% full)`
          : `${g.groupName}: ${g.currentPlayerCount} player${g.currentPlayerCount !== 1 ? 's' : ''} (no capacity limit set)`
      ),
      confidence: underCapacity.some(g => g.maxPlayers !== null) ? 'high' : 'medium',
      recommendedAction: 'Investigate whether these groups need enrollment support or should be merged. Check if low numbers reflect positive progression (players moved up) or actual enrollment weakness.',
      missingData: underCapacity.some(g => g.maxPlayers === null) ? ['max_players not set for some groups — capacity comparison limited'] : undefined,
      actionRoute: '/director',
    })
  }

  // Low-engagement groups (at_risk health signal)
  const atRiskGroups = groupCapacities.filter(g => g.healthSignal === 'at_risk')
  if (atRiskGroups.length > 0) {
    insights.push({
      category: 'program_health',
      title: `${atRiskGroups.length} group${atRiskGroups.length !== 1 ? 's' : ''} with low attendance or missing wrap-ups`,
      finding: `${atRiskGroups.map(g => g.groupName).join(', ')} show${atRiskGroups.length === 1 ? 's' : ''} at-risk health signals in the last 30 days.`,
      evidence: atRiskGroups.map(g =>
        `${g.groupName}: ${g.attendanceRate !== null ? `${Math.round(g.attendanceRate * 100)}% attendance` : 'attendance unknown'} across ${g.sessionsLast30} session${g.sessionsLast30 !== 1 ? 's' : ''}`
      ),
      confidence: 'medium',
      recommendedAction: 'Determine whether this is a player attendance problem or a coach wrap-up gap — the fix is different for each.',
      actionRoute: '/director/sessions',
    })
  }

  // Enrollment vs positive progression analysis
  const advancingSignal = advancementEligibleCount > 0
  const stalledSignal = playerProgressStalls.length > 0
  if (advancingSignal || stalledSignal) {
    const parts: string[] = []
    const evidence: string[] = []
    if (advancingSignal) {
      parts.push(`${advancementEligibleCount} player${advancementEligibleCount !== 1 ? 's are' : ' is'} ready to advance`)
      evidence.push(`${advancementEligibleCount} player${advancementEligibleCount !== 1 ? 's' : ''} flagged as advancement-eligible`)
    }
    if (stalledSignal) {
      parts.push(`${playerProgressStalls.length} player${playerProgressStalls.length !== 1 ? 's are' : ' is'} stalled`)
      evidence.push(`${playerProgressStalls.length} player${playerProgressStalls.length !== 1 ? 's' : ''} at the same level for 90+ days`)
    }
    const isProgressionDriven = advancingSignal && playerCount > 0 && advancementEligibleCount / playerCount > 0.15

    insights.push({
      category: 'program_health',
      title: isProgressionDriven
        ? 'Group changes appear to be driven by positive progression'
        : 'Mixed enrollment and progression signals',
      finding: `${parts.join('; ')}.${isProgressionDriven ? ' Enrollment changes in smaller groups may reflect players advancing — not attrition.' : ''}`,
      evidence,
      confidence: advancingSignal && stalledSignal ? 'high' : 'medium',
      recommendedAction: isProgressionDriven
        ? 'Confirm receiving groups have capacity before approving advancement cohort.'
        : 'Review stalled players individually before drawing enrollment conclusions.',
      actionRoute: '/director/players',
    })
  }

  return insights
}

// ── Player Intelligence ───────────────────────────────────────────────────────

function buildPlayerIntelligenceInsights(input: COOIntelligenceInput): COOInsight[] {
  const insights: COOInsight[] = []
  const {
    playerCurriculumStateSummaries,
    advancementEligibleCount,
    playerProgressStalls,
    attentionItems,
    playerAttentionRisks,
    playerAttentionRiskStatus,
    recentAssessmentCount,
    assessmentCount,
  } = input

  // Ready to move up
  if (advancementEligibleCount > 0) {
    const eligible = playerCurriculumStateSummaries.filter(p => p.advancementEligible)
    insights.push({
      category: 'player_intelligence',
      title: `${advancementEligibleCount} player${advancementEligibleCount !== 1 ? 's' : ''} ready to advance`,
      finding: `${advancementEligibleCount} player${advancementEligibleCount !== 1 ? 's have' : ' has'} met advancement criteria and ${advancementEligibleCount !== 1 ? 'are' : 'is'} waiting for director approval.`,
      evidence: eligible.slice(0, 5).map(p =>
        `${p.playerName} — eligible from ${p.currentLevelDisplayName ?? 'current level'}`
      ),
      confidence: 'high',
      recommendedAction: 'Review advancement candidates. Approving level changes maintains player momentum and trust.',
      actionRoute: '/director/players',
    })
  } else if (playerCurriculumStateSummaries.length > 0) {
    insights.push({
      category: 'player_intelligence',
      title: 'No players currently advancement-eligible',
      finding: 'No enrolled players have been flagged as ready to advance at this time.',
      evidence: [`${playerCurriculumStateSummaries.length} player curriculum state${playerCurriculumStateSummaries.length !== 1 ? 's' : ''} reviewed`],
      confidence: 'high',
      recommendedAction: 'No advancement action needed. Continue monitoring assessment results.',
    })
  }

  // Stalled players
  if (playerProgressStalls.length > 0) {
    const highStalls = playerProgressStalls.filter(s => s.stallSeverity === 'high')
    const mediumStalls = playerProgressStalls.filter(s => s.stallSeverity === 'medium')
    insights.push({
      category: 'player_intelligence',
      title: `${playerProgressStalls.length} stalled player${playerProgressStalls.length !== 1 ? 's' : ''}`,
      finding: `${highStalls.length > 0 ? `${highStalls.length} critical (180+ days at current level)` : ''}${highStalls.length > 0 && mediumStalls.length > 0 ? ', ' : ''}${mediumStalls.length > 0 ? `${mediumStalls.length} moderate (90–180 days)` : ''} detected.`,
      evidence: playerProgressStalls.slice(0, 5).map(s =>
        `${s.playerName} — ${s.daysAtCurrentLevel} days at ${s.currentLevelDisplayName ?? 'current level'} (${s.stallSeverity} severity)`
      ),
      confidence: highStalls.length > 0 ? 'high' : 'medium',
      recommendedAction: 'Review each stalled player with their coach. Determine if the block is curriculum fit, attendance pattern, or engagement — the fix is different for each.',
      actionRoute: '/director/players',
    })
  }

  // Accelerating (proxy: recent assessments — direct velocity signal does not exist)
  if (recentAssessmentCount > 0) {
    const pct = assessmentCount > 0 ? Math.round(recentAssessmentCount / assessmentCount * 100) : 0
    insights.push({
      category: 'player_intelligence',
      title: `${recentAssessmentCount} recent assessment${recentAssessmentCount !== 1 ? 's' : ''} — active progression cycle`,
      finding: `${recentAssessmentCount} assessment${recentAssessmentCount !== 1 ? 's were' : ' was'} completed recently (${pct}% of total assessments). Players being assessed are likely in an active advancement cycle.`,
      evidence: [
        `${recentAssessmentCount} assessment${recentAssessmentCount !== 1 ? 's' : ''} in recent period`,
        `${assessmentCount} total assessments on record`,
      ],
      confidence: 'medium',
      recommendedAction: 'Check recently assessed players for advancement eligibility. A high assessment rate often precedes level changes.',
      missingData: ['Per-player improvement velocity — direct acceleration signal not available in current schema'],
      actionRoute: '/director/players',
    })
  }

  // Needs attention
  const highRiskItems = attentionItems.filter(i => i.risk === 'high')
  if (attentionItems.length > 0) {
    insights.push({
      category: 'player_intelligence',
      title: `${attentionItems.length} player${attentionItems.length !== 1 ? 's need' : ' needs'} attention`,
      finding: `${highRiskItems.length > 0 ? `${highRiskItems.length} high-risk, ` : ''}${attentionItems.length - highRiskItems.length} medium-risk player signal${attentionItems.length !== 1 ? 's' : ''} flagged.`,
      evidence: attentionItems.slice(0, 5).map(i =>
        `${i.playerName ?? 'Player'} — ${i.reason} (${i.risk} risk)`
      ),
      confidence: highRiskItems.length > 0 ? 'high' : 'medium',
      recommendedAction: 'Prioritize high-risk players. Consider drafting parent updates for ongoing concerns.',
      actionRoute: '/director/players',
    })
  }

  // Attendance risk
  if (playerAttentionRiskStatus !== 'blocked_by_rls' && playerAttentionRiskStatus !== 'blocked_by_schema') {
    const highRisk = playerAttentionRisks.filter(p => p.riskLevel === 'high')
    if (playerAttentionRisks.length > 0) {
      insights.push({
        category: 'player_intelligence',
        title: `${playerAttentionRisks.length} player${playerAttentionRisks.length !== 1 ? 's' : ''} with attendance risk`,
        finding: `${highRisk.length > 0 ? `${highRisk.length} high-risk (concern observations + recent absences). ` : ''}${playerAttentionRisks.length} total players flagged in the last 30 days.`,
        evidence: playerAttentionRisks.slice(0, 5).map(p =>
          `${p.playerName} — ${p.factors.map(f => f.detail).join(', ')}`
        ),
        confidence: playerAttentionRiskStatus === 'partial' ? 'medium' : 'high',
        recommendedAction: 'Contact coaches for context on each at-risk player. Ongoing attendance gaps warrant a parent communication.',
        missingData: playerAttentionRiskStatus === 'partial' ? ['Some attendance or observation data may be incomplete'] : undefined,
        actionRoute: '/director/players',
      })
    } else {
      insights.push({
        category: 'player_intelligence',
        title: 'No attendance risk flags',
        finding: 'No players flagged with concern observations or recent absences in the last 30 days.',
        evidence: ['Attendance and observation data reviewed (last 30 days)'],
        confidence: 'medium',
        recommendedAction: 'Continue monitoring. Ensure coaches are submitting wrap-ups so attendance signals stay accurate.',
      })
    }
  }

  return insights
}

// ── Coach Intelligence ────────────────────────────────────────────────────────

function buildCoachIntelligenceInsights(input: COOIntelligenceInput): COOInsight[] {
  const insights: COOInsight[] = []
  const { coachSupport, coachSupportStatus, missingWrapUps } = input

  if (coachSupportStatus === 'insufficient_data' || coachSupport.length === 0) {
    insights.push({
      category: 'coach_intelligence',
      title: 'Coach intelligence unavailable',
      finding: 'No coach session data found in the last 30 days.',
      evidence: ['Insufficient session data for coach analysis'],
      confidence: 'low',
      recommendedAction: 'Ensure coaches are scheduling and completing sessions so support signals can be generated.',
      missingData: ['Session history', 'Coach wrap-up records'],
    })
    return insights
  }

  // Coaches needing support
  const needingSupport = coachSupport.filter(c => c.supportSignal === 'needs_support')
  const monitoring = coachSupport.filter(c => c.supportSignal === 'monitor')
  if (needingSupport.length > 0 || monitoring.length > 0) {
    const all = [...needingSupport, ...monitoring]
    insights.push({
      category: 'coach_intelligence',
      title: `${all.length} coach${all.length !== 1 ? 'es' : ''} may need director support`,
      finding: `${needingSupport.length > 0 ? `${needingSupport.length} requiring active support` : ''}${needingSupport.length > 0 && monitoring.length > 0 ? ', ' : ''}${monitoring.length > 0 ? `${monitoring.length} to monitor` : ''}.`,
      evidence: all.slice(0, 5).map(c => `${c.coachName} — ${c.reasons.join('; ')}`),
      confidence: needingSupport.length > 0 ? 'high' : 'medium',
      recommendedAction: 'Schedule a brief check-in with coaches who are behind on wrap-ups. This is a supportive conversation — not a performance review.',
      actionRoute: '/director',
    })
  }

  // Reliably following up
  const onTrack = coachSupport.filter(c => c.supportSignal === 'on_track')
  if (onTrack.length > 0) {
    insights.push({
      category: 'coach_intelligence',
      title: `${onTrack.length} coach${onTrack.length !== 1 ? 'es are' : ' is'} following up reliably`,
      finding: `${onTrack.map(c => c.coachName).join(', ')} ${onTrack.length === 1 ? 'is' : 'are'} submitting wrap-ups consistently.`,
      evidence: onTrack.map(c =>
        `${c.coachName}: ${c.wrapUpsSubmitted}/${c.sessionsLast30Days} sessions wrapped up`
      ),
      confidence: 'high',
      recommendedAction: 'No action needed. Acknowledge reliable coaches — positive reinforcement sustains the behavior.',
    })
  }

  // Missing notes (wrapUpGap > 0)
  const missingNotes = coachSupport.filter(c => c.wrapUpGap > 0).sort((a, b) => b.wrapUpGap - a.wrapUpGap)
  if (missingNotes.length > 0) {
    insights.push({
      category: 'coach_intelligence',
      title: `${missingNotes.length} coach${missingNotes.length !== 1 ? 'es have' : ' has'} sessions without wrap-ups`,
      finding: `${missingWrapUps > 0 ? `${missingWrapUps} sessions overall are missing wrap-ups. ` : ''}Coaches with gaps: ${missingNotes.slice(0, 4).map(c => c.coachName).join(', ')}.`,
      evidence: missingNotes.slice(0, 5).map(c =>
        `${c.coachName}: ${c.wrapUpGap} session${c.wrapUpGap !== 1 ? 's' : ''} without wrap-up`
      ),
      confidence: 'high',
      recommendedAction: 'Ask coaches to complete missing wrap-ups. Without them, DONNA cannot provide accurate player or attendance intelligence.',
      actionRoute: '/director/sessions',
    })
  }

  // Driving progression (proxy: observation count — low confidence, no direct linkage)
  const byObservations = [...coachSupport].sort((a, b) => b.observationsLast30Days - a.observationsLast30Days)
  const topObservers = byObservations.filter(c => c.observationsLast30Days > 0)
  if (topObservers.length > 0) {
    insights.push({
      category: 'coach_intelligence',
      title: 'Coach observation activity — progression proxy',
      finding: `${topObservers[0].coachName} leads with ${topObservers[0].observationsLast30Days} observations in the last 30 days. Higher observation counts are a proxy for active player development engagement.`,
      evidence: topObservers.slice(0, 4).map(c =>
        `${c.coachName}: ${c.observationsLast30Days} observation${c.observationsLast30Days !== 1 ? 's' : ''} (last 30 days)`
      ),
      confidence: 'low',
      recommendedAction: 'Use observation count as a soft engagement signal. Cross-reference with player advancement rates for a full picture — this proxy does not confirm direct progression impact.',
      missingData: ['Direct coach-to-player advancement linkage not available — observation count used as proxy only'],
    })
  }

  // Groups with unclear coach ownership (coaches with 0 sessions = possible gap)
  const noSessions = coachSupport.filter(c => c.sessionsLast30Days === 0)
  if (noSessions.length > 0) {
    insights.push({
      category: 'coach_intelligence',
      title: `${noSessions.length} coach${noSessions.length !== 1 ? 'es have' : ' has'} no sessions in 30 days`,
      finding: `Groups where ${noSessions.map(c => c.coachName).join(', ')} ${noSessions.length === 1 ? 'is' : 'are'} assigned may have unclear ownership if sessions were expected.`,
      evidence: noSessions.map(c => `${c.coachName}: 0 sessions in the last 30 days`),
      confidence: 'medium',
      recommendedAction: 'Verify these coaches are still active and their group assignments are current.',
      missingData: ['Explicit group-coach assignment table not available — ownership gap inferred from session absence'],
      actionRoute: '/director',
    })
  }

  return insights
}

// ── Parent Confidence ─────────────────────────────────────────────────────────

function buildParentConfidenceInsights(input: COOIntelligenceInput): COOInsight[] {
  const {
    parentStatus,
    parentBlockReason,
    parentActionsProposed,
    parentActionsPending,
    totalActivePlayers,
    attentionItems,
    highRiskPlayerCount,
  } = input

  const insights: COOInsight[] = []
  const isBlocked = parentStatus === 'blocked_by_schema' || parentStatus === 'blocked_by_rls'

  // Disclose schema block first — never hide this
  if (isBlocked) {
    insights.push({
      category: 'parent_confidence',
      title: 'Parent communication coverage — schema limited',
      finding: 'Per-parent communication history is not available in the current schema. Only aggregate signals can be reported.',
      evidence: [
        `${totalActivePlayers} active player${totalActivePlayers !== 1 ? 's' : ''} enrolled`,
        `${parentActionsProposed} parent-related proposed action${parentActionsProposed !== 1 ? 's' : ''} on record`,
        `${parentActionsPending} parent action${parentActionsPending !== 1 ? 's' : ''} pending approval`,
      ],
      confidence: 'low',
      recommendedAction: 'Use the "Draft Parent Update" workflow to generate and review communications. Full per-parent history requires a future schema addition.',
      missingData: [parentBlockReason],
    })
  }

  // Players with attention flags = families most likely to need outreach
  const highRisk = attentionItems.filter(i => i.risk === 'high' && i.playerName)
  const allFlagged = attentionItems.filter(i => i.playerName)
  if (allFlagged.length > 0) {
    insights.push({
      category: 'parent_confidence',
      title: `${allFlagged.length} player${allFlagged.length !== 1 ? 's' : ''} whose families may need an update`,
      finding: `Players with active attention flags are the highest-priority candidates for parent outreach.${isBlocked ? ' Direct contact history is unavailable — risk inferred from player signals.' : ''}`,
      evidence: [
        ...highRisk.slice(0, 4).map(i => `${i.playerName} — ${i.reason} (${i.risk} risk)`),
        ...(allFlagged.length > 4 ? [`…and ${allFlagged.length - 4} more`] : []),
      ],
      confidence: 'medium',
      recommendedAction: 'Draft parent updates for high-risk players via DONNA. All communications require director approval before sending.',
      missingData: isBlocked ? ['Per-family last-contact date — blocked_by_schema'] : undefined,
      actionRoute: '/director/players',
    })
  }

  // Pending parent actions in review queue
  if (parentActionsPending > 0) {
    insights.push({
      category: 'parent_confidence',
      title: `${parentActionsPending} parent communication${parentActionsPending !== 1 ? 's' : ''} awaiting approval`,
      finding: `${parentActionsPending} parent-related proposed action${parentActionsPending !== 1 ? 's are' : ' is'} in the review queue and require director approval before any message can be sent.`,
      evidence: [
        `${parentActionsPending} parent action${parentActionsPending !== 1 ? 's' : ''} in pending_review`,
        `${parentActionsProposed} total parent-related actions proposed`,
      ],
      confidence: 'high',
      recommendedAction: 'Open the review queue and approve or reject pending parent communications.',
      actionRoute: '/director/review',
    })
  }

  // Communication gap — no parent actions at all for active academy
  if (totalActivePlayers > 0 && parentActionsProposed === 0) {
    insights.push({
      category: 'parent_confidence',
      title: 'No parent communications have been drafted',
      finding: `No parent-related proposed actions found across ${totalActivePlayers} active player${totalActivePlayers !== 1 ? 's' : ''}.`,
      evidence: ['0 parent communications proposed', `${totalActivePlayers} active players enrolled`],
      confidence: 'medium',
      recommendedAction: 'Consider drafting periodic parent updates, especially for players with attention flags. Use the "Draft Parent Update" command.',
      actionRoute: '/director/players',
    })
  }

  // Families likely at risk (proxy: high attention risk players)
  if (highRiskPlayerCount > 0) {
    insights.push({
      category: 'parent_confidence',
      title: `${highRiskPlayerCount} famil${highRiskPlayerCount !== 1 ? 'ies' : 'y'} flagged as potentially at risk`,
      finding: 'Players with high-risk observation flags often have families who are unaware of concerns or disengaged from the academy.',
      evidence: highRisk.slice(0, 5).map(i => `${i.playerName} — ${i.reason}`),
      confidence: 'medium',
      recommendedAction: 'Schedule proactive communication for each high-risk player family. DONNA will draft it; you approve before it sends.',
      missingData: ['Direct parent engagement data not available — risk inferred from player attention flags'],
      actionRoute: '/director/players',
    })
  }

  return insights
}

// ── Director Decision ─────────────────────────────────────────────────────────

function buildDirectorDecisionInsights(input: COOIntelligenceInput): COOInsight[] {
  const insights: COOInsight[] = []
  const {
    pendingReviews,
    oldestPendingReviewAgeDays,
    missingWrapUps,
    highRiskPlayerCount,
    advancementEligibleCount,
    academyRisks,
    playerProgressStalls,
    curriculumGaps,
    playerCount,
    coachCount,
    coachSupport,
  } = input

  // Today's focus
  const focusItems: string[] = []
  const focusEvidence: string[] = []
  if (pendingReviews > 0) {
    focusItems.push(`Clear ${pendingReviews} pending review item${pendingReviews !== 1 ? 's' : ''}`)
    focusEvidence.push(`${pendingReviews} proposed action${pendingReviews !== 1 ? 's' : ''} awaiting decision${oldestPendingReviewAgeDays !== null ? ` (oldest: ${oldestPendingReviewAgeDays} days)` : ''}`)
  }
  if (highRiskPlayerCount > 0) {
    focusItems.push(`Address ${highRiskPlayerCount} high-risk player flag${highRiskPlayerCount !== 1 ? 's' : ''}`)
    focusEvidence.push(`${highRiskPlayerCount} player${highRiskPlayerCount !== 1 ? 's' : ''} with high-risk signals`)
  }
  if (missingWrapUps > 0) {
    focusItems.push(`Follow up on ${missingWrapUps} missing wrap-up${missingWrapUps !== 1 ? 's' : ''}`)
    focusEvidence.push(`${missingWrapUps} session${missingWrapUps !== 1 ? 's are' : ' is'} missing coach notes`)
  }

  insights.push({
    category: 'director_decision',
    title: focusItems.length > 0 ? "Today's top priorities" : 'No urgent items today',
    finding: focusItems.length > 0
      ? `${focusItems.length} action area${focusItems.length !== 1 ? 's' : ''} identified: ${focusItems.join('; ')}.`
      : 'Review queue is clear, no high-risk players flagged, and wrap-up coverage appears current.',
    evidence: focusItems.length > 0 ? focusEvidence : ['0 pending reviews', '0 high-risk players flagged', '0 missing wrap-ups'],
    confidence: 'high',
    recommendedAction: focusItems.length > 0
      ? (focusItems[0] ?? 'Review the items above in priority order.')
      : 'Use this time to review curriculum progress or check in with a coach.',
    actionRoute: pendingReviews > 0 ? '/director/review' : '/director',
  })

  // Biggest risk
  const topRisk = academyRisks.length > 0
    ? (academyRisks.find(r => r.urgency === 'high') ?? academyRisks[0])
    : null

  if (topRisk) {
    insights.push({
      category: 'director_decision',
      title: `Biggest risk: ${topRisk.signal}`,
      finding: topRisk.detail,
      evidence: [topRisk.detail, ...academyRisks.slice(1, 3).map(r => `${r.signal}: ${r.detail}`)],
      confidence: topRisk.urgency === 'high' ? 'high' : 'medium',
      recommendedAction: 'Address the highest-urgency risk first. Navigate to the suggested route for context.',
      actionRoute: topRisk.actionHref,
    })
  } else if (highRiskPlayerCount > 0) {
    insights.push({
      category: 'director_decision',
      title: `Biggest risk: ${highRiskPlayerCount} player${highRiskPlayerCount !== 1 ? 's' : ''} at high risk`,
      finding: 'Player-level risk signals are the primary concern — no academy-level structural risks detected.',
      evidence: [`${highRiskPlayerCount} high-risk player flag${highRiskPlayerCount !== 1 ? 's' : ''}`],
      confidence: 'medium',
      recommendedAction: 'Review high-risk player profiles. Consider direct coach communication and parent outreach.',
      actionRoute: '/director/players',
    })
  }

  // Biggest opportunity
  const opParts: string[] = []
  const opEvidence: string[] = []
  if (advancementEligibleCount > 0) {
    opParts.push(`${advancementEligibleCount} player advancement${advancementEligibleCount !== 1 ? 's' : ''} ready to approve`)
    opEvidence.push(`${advancementEligibleCount} player${advancementEligibleCount !== 1 ? 's' : ''} flagged as advancement-eligible`)
  }
  if (curriculumGaps.length > 0) {
    opParts.push(`${curriculumGaps.length} curriculum gap${curriculumGaps.length !== 1 ? 's' : ''} to fill`)
    opEvidence.push(...curriculumGaps.slice(0, 2))
  }
  if (opParts.length > 0) {
    insights.push({
      category: 'director_decision',
      title: `Biggest opportunity: ${opParts[0]}`,
      finding: `${opParts.join(' and ')} represent the highest-value actions to advance academy quality right now.`,
      evidence: opEvidence,
      confidence: advancementEligibleCount > 0 ? 'high' : 'medium',
      recommendedAction: advancementEligibleCount > 0
        ? 'Approve advancement-eligible players and review their next level placement — this builds player confidence.'
        : 'Address curriculum gaps to improve session quality across all groups.',
      actionRoute: '/director/players',
    })
  }

  // COO recommendation synthesis
  insights.push(buildCOOSynthesisRecommendation(input))

  // Decisions waiting
  if (pendingReviews > 0) {
    insights.push({
      category: 'director_decision',
      title: `${pendingReviews} decision${pendingReviews !== 1 ? 's are' : ' is'} waiting`,
      finding: `The review queue has ${pendingReviews} item${pendingReviews !== 1 ? 's' : ''} requiring director decision.${oldestPendingReviewAgeDays !== null && oldestPendingReviewAgeDays > 5 ? ` The oldest has been waiting ${oldestPendingReviewAgeDays} days.` : ''}`,
      evidence: [
        `${pendingReviews} proposed action${pendingReviews !== 1 ? 's' : ''} in pending_review`,
        ...(oldestPendingReviewAgeDays !== null ? [`Oldest item: ${oldestPendingReviewAgeDays} days in queue`] : []),
      ],
      confidence: 'high',
      recommendedAction: 'Open the review queue. Start with the oldest urgent items to prevent queue buildup.',
      actionRoute: '/director/review',
    })
  }

  void playerCount; void coachCount; void playerProgressStalls; void coachSupport

  return insights
}

// ── COO synthesis ─────────────────────────────────────────────────────────────

function buildCOOSynthesisRecommendation(input: COOIntelligenceInput): COOInsight {
  const {
    pendingReviews,
    highRiskPlayerCount,
    advancementEligibleCount,
    playerProgressStalls,
    missingWrapUps,
    coachSupport,
  } = input

  const coachesNeedingSupport = coachSupport.filter(c => c.supportSignal === 'needs_support').length

  const signals: Array<{ weight: number; action: string; evidence: string }> = []
  if (pendingReviews > 5)        signals.push({ weight: 4, action: 'Clear the review queue — decisions are stacking up.', evidence: `${pendingReviews} items pending` })
  if (highRiskPlayerCount > 0)   signals.push({ weight: 3, action: `Address ${highRiskPlayerCount} high-risk player${highRiskPlayerCount !== 1 ? 's' : ''} before they escalate.`, evidence: `${highRiskPlayerCount} high-risk flags` })
  if (missingWrapUps > 3)        signals.push({ weight: 2, action: `Chase ${missingWrapUps} missing wrap-ups — DONNA is blind without them.`, evidence: `${missingWrapUps} sessions without notes` })
  if (advancementEligibleCount > 0) signals.push({ weight: 2, action: `Approve ${advancementEligibleCount} advancement-eligible player${advancementEligibleCount !== 1 ? 's' : ''} to maintain momentum.`, evidence: `${advancementEligibleCount} ready to advance` })
  if (coachesNeedingSupport > 0) signals.push({ weight: 1, action: `Check in with ${coachesNeedingSupport} coach${coachesNeedingSupport !== 1 ? 'es' : ''} who may need support.`, evidence: `${coachesNeedingSupport} coaches flagged` })
  if (playerProgressStalls.length > 2) signals.push({ weight: 1, action: `Review ${playerProgressStalls.length} stalled players with their coaches.`, evidence: `${playerProgressStalls.length} players stalled 90+ days` })

  signals.sort((a, b) => b.weight - a.weight)
  const top = signals.slice(0, 3)

  const finding = top.length > 0
    ? `As COO I'd prioritize: ${top.map((s, i) => `${i + 1}. ${s.action}`).join(' ')}`
    : 'No urgent signals. The academy appears operationally stable.'

  return {
    category: 'director_decision',
    title: 'DONNA COO recommendation',
    finding,
    evidence: top.map(s => s.evidence),
    confidence: top.length >= 2 ? 'high' : top.length === 1 ? 'medium' : 'low',
    recommendedAction: top[0]?.action ?? 'Monitor ongoing metrics. No urgent action required.',
    actionRoute: pendingReviews > 0 ? '/director/review' : '/director',
  }
}

// ── Readiness score ───────────────────────────────────────────────────────────

function computeReadinessScore(input: COOIntelligenceInput): number {
  let score = 0
  if (input.groupCapacityStatus !== 'insufficient_data' && input.groupCapacities.length > 0) score += 15
  if (input.playerCurriculumStateSummaries.length > 0) score += 20
  if (input.coachSupportStatus !== 'insufficient_data' && input.coachSupport.length > 0) score += 20
  if (input.playerAttentionRiskStatus !== 'insufficient_data') score += 15
  if (input.parentStatus !== 'blocked_by_schema') score += 10
  if (input.pendingReviews >= 0) score += 10
  if (input.attentionItems.length >= 0) score += 10
  return Math.min(100, score)
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildCOOIntelligenceReport(input: COOIntelligenceInput): COOIntelligenceReport {
  const programHealth     = buildProgramHealthInsights(input)
  const playerIntelligence = buildPlayerIntelligenceInsights(input)
  const coachIntelligence  = buildCoachIntelligenceInsights(input)
  const parentConfidence   = buildParentConfidenceInsights(input)
  const directorDecision   = buildDirectorDecisionInsights(input)

  const allInsights = [...programHealth, ...playerIntelligence, ...coachIntelligence, ...parentConfidence, ...directorDecision]

  const dataGaps: string[] = []
  if (input.groupCapacityStatus === 'insufficient_data') dataGaps.push('Group session data unavailable')
  if (input.parentStatus === 'blocked_by_schema')        dataGaps.push('Parent communication history — blocked_by_schema')
  if (input.coachSupportStatus === 'insufficient_data')  dataGaps.push('Coach session data unavailable')
  if (input.playerAttentionRiskStatus === 'insufficient_data') dataGaps.push('Player attendance data unavailable')
  dataGaps.push('Per-player improvement velocity not tracked in schema')
  dataGaps.push('Direct coach-to-player advancement linkage not available')
  dataGaps.push('Explicit group-coach ownership table not available')

  return {
    generatedAt: new Date().toISOString(),
    programHealth,
    playerIntelligence,
    coachIntelligence,
    parentConfidence,
    directorDecision,
    allInsights,
    readinessScore: computeReadinessScore(input),
    dataGaps,
  }
}
