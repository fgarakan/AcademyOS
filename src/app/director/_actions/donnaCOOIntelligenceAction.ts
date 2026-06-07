'use server'

// Mega Sprint 784–813 — DONNA COO Intelligence Server Action V1
//
// Loads live academy data from existing loaders, assembles COOIntelligenceInput,
// calls the pure-TS intelligence engine, and returns a formatted COO answer.
//
// Rules:
//   - RLS-scoped: all queries include academy_id
//   - Director and head_coach roles only
//   - Read-only: no mutations, no proposed_actions created
//   - No LLM: all calculations are deterministic
//   - If data is missing, disclose the gap — never invent

import { getSupabaseServer } from '@/lib/supabase/server'
import { loadDirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { loadGroupHealth } from '@/lib/donna/groupHealthLoader'
import { loadCoachSupport } from '@/lib/donna/coachSupportLoader'
import { loadPlayerAttentionRisk } from '@/lib/donna/playerAttentionRiskLoader'
import { loadParentTrust } from '@/lib/donna/parentTrustLoader'
import {
  buildCOOIntelligenceReport,
} from '@/lib/donna/coo/donnaCOOIntelligenceEngine'
import type {
  COOIntelligenceInput,
  COOInsight,
  COOCategory,
  GroupCapacity,
} from '@/lib/donna/coo/donnaCOOIntelligenceEngine'

// ── Result type ───────────────────────────────────────────────────────────────

export interface COOIntelligenceActionResult {
  ok: boolean
  category: COOCategory | 'all'
  insights: COOInsight[]
  formatted: string
  readinessScore: number
  dataGaps: string[]
  error?: string
}

// ── Question → category mapping ───────────────────────────────────────────────

function detectCOOCategory(question: string): COOCategory | 'all' {
  const lower = question.toLowerCase()

  // Program health
  if (
    lower.includes('over capacity') || lower.includes('under capacity') ||
    lower.includes('group light') || lower.includes('group growing') ||
    lower.includes('why is') || lower.includes('enrollment') ||
    lower.includes('progression problem') || lower.includes('enrollment problem') ||
    lower.includes('group enrollment') || lower.includes('group size') ||
    lower.includes('which group') || lower.includes('group capacity')
  ) return 'program_health'

  // Player intelligence
  if (
    lower.includes('ready to move') || lower.includes('ready to advance') ||
    lower.includes('who is stalled') || lower.includes('stalled player') ||
    lower.includes('who is accelerating') || lower.includes('accelerating player') ||
    lower.includes('attendance risk') || lower.includes('who has attendance') ||
    lower.includes('player risk') || lower.includes('who needs attention') ||
    lower.includes('which player') || lower.includes('player intelligence') ||
    lower.includes('who is ready')
  ) return 'player_intelligence'

  // Coach intelligence
  if (
    lower.includes('coach') && (
      lower.includes('need support') || lower.includes('needs support') ||
      lower.includes('following up') || lower.includes('follow up') ||
      lower.includes('missing notes') || lower.includes('missing wrap') ||
      lower.includes('driving progression') || lower.includes('coach ownership') ||
      lower.includes('unclear coach') || lower.includes('reliable') ||
      lower.includes('which coach') || lower.includes('coach intelligence')
    )
  ) return 'coach_intelligence'

  // Parent confidence
  if (
    lower.includes('parent') || lower.includes('famil') ||
    lower.includes('communication gap') || lower.includes('check-in') ||
    lower.includes('check in') || lower.includes('parent confidence')
  ) return 'parent_confidence'

  // Director decision
  if (
    lower.includes('biggest risk') || lower.includes('biggest opportunity') ||
    lower.includes('what would you do') || lower.includes('coo recommendation') ||
    lower.includes('as coo') || lower.includes('director decision') ||
    lower.includes('what should i focus') || lower.includes('focus today')
  ) return 'director_decision'

  return 'all'
}

// ── Insight → markdown formatter ─────────────────────────────────────────────

function formatInsightAsMarkdown(insight: COOInsight): string {
  const lines: string[] = []
  const confidenceLabel = insight.confidence === 'high' ? '●●●' : insight.confidence === 'medium' ? '●●○' : '●○○'
  lines.push(`**${insight.title}**`)
  lines.push(`_Confidence: ${confidenceLabel} ${insight.confidence.toUpperCase()}_`)
  lines.push('')
  lines.push(insight.finding)
  if (insight.evidence.length > 0) {
    lines.push('')
    lines.push('**Evidence:**')
    for (const e of insight.evidence) {
      lines.push(`• ${e}`)
    }
  }
  lines.push('')
  lines.push(`**Recommended action:** ${insight.recommendedAction}`)
  if (insight.missingData && insight.missingData.length > 0) {
    lines.push('')
    lines.push('**Data gaps (disclosed):**')
    for (const gap of insight.missingData) {
      lines.push(`⚠ ${gap}`)
    }
  }
  return lines.join('\n')
}

function formatInsightsResponse(insights: COOInsight[], category: COOCategory | 'all'): string {
  if (insights.length === 0) {
    return 'No intelligence available for this question. Ensure coaches are submitting wrap-ups and sessions are being scheduled.'
  }
  const header = category === 'all'
    ? '**DONNA COO Intelligence**'
    : `**DONNA — ${categoryLabel(category)}**`

  const sections = insights.map(i => formatInsightAsMarkdown(i)).join('\n\n---\n\n')
  return `${header}\n\n${sections}`
}

function categoryLabel(cat: COOCategory | 'all'): string {
  switch (cat) {
    case 'program_health': return 'Program Health'
    case 'player_intelligence': return 'Player Intelligence'
    case 'coach_intelligence': return 'Coach Intelligence'
    case 'parent_confidence': return 'Parent Confidence'
    case 'director_decision': return 'Director Decision Intelligence'
    default: return 'COO Intelligence'
  }
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function runDonnaCOOIntelligenceAction(
  question: string,
): Promise<COOIntelligenceActionResult> {
  const supabase = await getSupabaseServer()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, category: 'all', insights: [], formatted: 'Not authenticated.', readinessScore: 0, dataGaps: [], error: 'unauthenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id
  if (!academyId) {
    return { ok: false, category: 'all', insights: [], formatted: 'Academy context unavailable.', readinessScore: 0, dataGaps: [], error: 'no_academy' }
  }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, category: 'all', insights: [], formatted: 'COO intelligence is available to directors and head coaches only.', readinessScore: 0, dataGaps: [], error: 'unauthorized' }
  }

  // Load all data in parallel
  const [donnaCtx, groupHealthResult, coachSupportResult, playerRiskResult, parentTrustResult] =
    await Promise.all([
      loadDirectorDonnaContext(supabase, academyId),
      loadGroupHealth(supabase, academyId),
      loadCoachSupport(supabase, academyId),
      loadPlayerAttentionRisk(supabase, academyId),
      loadParentTrust(supabase, academyId),
    ])

  // Load group player counts from group_memberships
  // rawDb pattern: avoid TS2589 on complex Supabase generic inference
  const rawDb = supabase as unknown as typeof supabase
  const { data: membershipRows } = await rawDb
    .from('group_memberships')
    .select('group_id, player_id')
    .eq('academy_id', academyId)
    .eq('is_current', true)

  const groupPlayerCounts = new Map<string, number>()
  for (const row of (membershipRows ?? []) as Array<{ group_id: string; player_id: string }>) {
    groupPlayerCounts.set(row.group_id, (groupPlayerCounts.get(row.group_id) ?? 0) + 1)
  }

  // Assemble GroupCapacity[] by merging groups data, health data, and player counts
  // groupSummaries from directorDonnaContext has maxPlayers
  const groupHealthMap = new Map(groupHealthResult.groups.map(g => [g.groupId, g]))

  const groupCapacities: GroupCapacity[] = donnaCtx.groupSummaries.map(gs => {
    const health = groupHealthMap.get(gs.groupId)
    return {
      groupId: gs.groupId,
      groupName: gs.name,
      maxPlayers: gs.maxPlayers,
      currentPlayerCount: groupPlayerCounts.get(gs.groupId) ?? 0,
      attendanceRate: health?.attendanceRate ?? null,
      sessionsLast30: health?.sessionsLast30Days ?? 0,
      healthSignal: health?.healthSignal ?? 'insufficient_data',
    }
  })

  // Build combined input
  const cooInput: COOIntelligenceInput = {
    // From DirectorDonnaContext
    pendingReviews:                      donnaCtx.pendingReviews,
    oldestPendingReviewAgeDays:          donnaCtx.oldestPendingReviewAgeDays,
    missingWrapUps:                      donnaCtx.missingWrapUps,
    highRiskPlayerCount:                 donnaCtx.highRiskPlayerCount,
    mediumRiskPlayerCount:               donnaCtx.mediumRiskPlayerCount,
    attentionItems:                      donnaCtx.attentionItems,
    academyRisks:                        donnaCtx.academyRisks,
    playerProgressStalls:                donnaCtx.playerProgressStalls,
    advancementEligibleCount:            donnaCtx.advancementEligibleCount,
    playerCurriculumStateSummaries:      donnaCtx.playerCurriculumStateSummaries,
    curriculumGaps:                      donnaCtx.curriculumGaps,
    assessmentCount:                     donnaCtx.assessmentCount,
    recentAssessmentCount:               donnaCtx.recentAssessmentCount,
    playerCount:                         donnaCtx.playerCount,
    coachCount:                          donnaCtx.coachCount,
    // Group capacity (assembled above)
    groupCapacities,
    groupCapacityStatus:                 groupHealthResult.fieldStatus,
    // Coach support
    coachSupport:                        coachSupportResult.coaches,
    coachSupportStatus:                  coachSupportResult.fieldStatus,
    // Player attention risk
    playerAttentionRisks:                playerRiskResult.players,
    playerAttentionRiskStatus:           playerRiskResult.fieldStatus,
    // Parent trust
    totalActivePlayers:                  parentTrustResult.totalActivePlayers,
    parentActionsProposed:               parentTrustResult.parentActionsProposed,
    parentActionsPending:                parentTrustResult.parentActionsPending,
    parentCoverageAvailable:             parentTrustResult.coverageAvailable,
    parentBlockReason:                   parentTrustResult.blockReason,
    parentStatus:                        parentTrustResult.fieldStatus,
  }

  const report = buildCOOIntelligenceReport(cooInput)
  const category = detectCOOCategory(question)

  // Select relevant insights for the question
  let insights: COOInsight[]
  if (category === 'all') {
    // Top 3 insights across all dimensions by priority
    const priorityOrder: COOCategory[] = ['director_decision', 'player_intelligence', 'coach_intelligence', 'program_health', 'parent_confidence']
    const allByPriority: COOInsight[] = []
    for (const cat of priorityOrder) {
      allByPriority.push(...report.allInsights.filter(i => i.category === cat))
    }
    insights = allByPriority.slice(0, 3)
  } else {
    switch (category) {
      case 'program_health':     insights = report.programHealth; break
      case 'player_intelligence': insights = report.playerIntelligence; break
      case 'coach_intelligence': insights = report.coachIntelligence; break
      case 'parent_confidence':  insights = report.parentConfidence; break
      case 'director_decision':  insights = report.directorDecision; break
      default:                   insights = report.allInsights.slice(0, 3)
    }
  }

  const formatted = formatInsightsResponse(insights, category)

  return {
    ok: true,
    category,
    insights,
    formatted,
    readinessScore: report.readinessScore,
    dataGaps: report.dataGaps,
  }
}
