// DONNA Post-Assessment Placement Recommendation Engine V1
//
// Generates a structured placement recommendation from assessment scores,
// player context, and available group data.
//
// Design:
//   - Deterministic — no AI, no LLM, no side effects
//   - All logic is transparent and auditable
//   - Confidence score reflects data completeness + signal consistency
//   - Alternative placements always provided (one level below, one above, adjacent stage)
//   - Risk notes flag unusual score patterns that could affect placement success
//
// Inputs:   assessment scores + player context + available groups
// Outputs:  recommended stage/level/group, confidence, reasons, risk notes,
//           alternatives, DONNA explanation, reassessment timing
//
// Pure TypeScript — no DB, no API, no mutations.

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurriculumStage =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'

export interface AssessmentScoreInput {
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
}

export interface LevelOption {
  id: string
  display_name: string
  stage: CurriculumStage
  level_number: number
  sort_order: number
}

export interface GroupOption {
  id: string
  name: string
  track: string | null
  level_id: string | null
  min_age: number | null
  max_age: number | null
  max_players: number | null
  is_active?: boolean
  current_player_count?: number
}

export interface PlacementContext {
  playerAgeYears?: number | null
  currentLevelId?: string | null
  currentLevelName?: string | null
  currentStage?: string | null
  gatesMet?: number
  gatesTotal?: number
  availableLevels: LevelOption[]
  availableGroups: GroupOption[]
}

export interface AlternativePlacement {
  stage: string
  levelName: string
  levelId: string | null
  groupName: string | null
  groupId: string | null
  rationale: string
  trialRecommended: boolean
}

export interface PlacementRecommendationResult {
  recommendedStage: CurriculumStage
  recommendedLevelId: string | null
  recommendedLevelName: string
  recommendedGroupId: string | null
  recommendedGroupName: string | null
  confidenceScore: number // 0–100
  confidenceTier: 'high' | 'medium' | 'low'
  topReasons: string[]
  limitingFactors: string[]
  riskNotes: string[]
  alternativePlacements: AlternativePlacement[]
  evidenceUsed: string[]
  donnaExplanation: string
  checkAfter4to6Weeks: string[]
  recommendedReassessmentWeeks: number
  computedOverallAvg: number | null
}

// ── Stage / level mapping ─────────────────────────────────────────────────────

const STAGE_ORDER: CurriculumStage[] = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
]

const STAGE_LABELS: Record<CurriculumStage, string> = {
  red_foundation:     'Red Ball Foundation',
  orange_development: 'Orange Ball Development',
  green_performance:  'Green Ball Performance',
  yellow_competitive: 'Yellow Ball Competitive',
  high_performance:   'High Performance',
}

const STAGE_SCORE_RANGES: Record<CurriculumStage, [number, number]> = {
  red_foundation:     [0,   4.49],
  orange_development: [4.5, 6.49],
  green_performance:  [6.5, 7.99],
  yellow_competitive: [8.0, 8.99],
  high_performance:   [9.0, 10.0],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeOverallAvg(scores: AssessmentScoreInput): number | null {
  const values = [
    scores.technical_score,
    scores.tactical_score,
    scores.movement_score,
    scores.competition_score,
    scores.behavioral_score,
  ].filter((v): v is number => v !== null)

  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function determineStage(
  avg: number,
  age: number | null,
): CurriculumStage {
  // Age overrides for very young players
  if (age !== null && age <= 6) return 'red_foundation'
  if (age !== null && age <= 8 && avg < 5.5) return 'red_foundation'

  for (const stage of STAGE_ORDER) {
    const [min, max] = STAGE_SCORE_RANGES[stage]
    if (avg >= min && avg <= max) return stage
  }
  return 'high_performance'
}

function determineLevelNumber(
  scores: AssessmentScoreInput,
  stage: CurriculumStage,
): 1 | 2 | 3 {
  const values = [
    scores.technical_score,
    scores.tactical_score,
    scores.movement_score,
    scores.competition_score,
    scores.behavioral_score,
  ].filter((v): v is number => v !== null)

  if (values.length < 3) return 1 // insufficient data → lower level

  const avg   = values.reduce((a, b) => a + b, 0) / values.length
  const min   = Math.min(...values)
  const spread = avg - min

  // High spread means skill gaps → lower level for catch-up
  if (spread > 2.5 || min < 3.0) return 1

  // Stage-relative level logic
  const [stageMin] = STAGE_SCORE_RANGES[stage]
  const stageProgress = (avg - stageMin) / (STAGE_SCORE_RANGES[stage][1] - stageMin)

  if (stageProgress < 0.35) return 1
  if (stageProgress < 0.70) return 2
  return 3
}

function findBestLevel(
  levels: LevelOption[],
  targetStage: CurriculumStage,
  targetLevelNumber: 1 | 2 | 3,
): LevelOption | null {
  const stageLevels = levels.filter(l => l.stage === targetStage)
  if (stageLevels.length === 0) return null

  // Try exact match first
  const exact = stageLevels.find(l => l.level_number === targetLevelNumber)
  if (exact) return exact

  // Fall back to closest level number
  return stageLevels.sort((a, b) =>
    Math.abs(a.level_number - targetLevelNumber) - Math.abs(b.level_number - targetLevelNumber)
  )[0] ?? null
}

function findBestGroup(
  groups: GroupOption[],
  levelId: string | null,
  age: number | null,
  stage: CurriculumStage,
): GroupOption | null {
  if (groups.length === 0) return null

  const candidates = groups.filter(g => {
    if (!g.is_active && g.is_active !== undefined) return false
    if (levelId && g.level_id && g.level_id !== levelId) return false

    // Age range check
    if (age !== null) {
      if (g.min_age !== null && age < g.min_age) return false
      if (g.max_age !== null && age > g.max_age) return false
    }

    // Capacity check (if current count known)
    if (g.max_players !== null && g.current_player_count !== undefined) {
      if (g.current_player_count >= g.max_players) return false
    }

    return true
  })

  if (candidates.length === 0) return null

  // Prefer level-matched group; then first available
  const levelMatch = candidates.find(g => g.level_id === levelId)
  return levelMatch ?? candidates[0] ?? null
}

// ── Confidence scoring ────────────────────────────────────────────────────────

function computeConfidence(
  scores: AssessmentScoreInput,
  avg: number | null,
  levelFound: boolean,
  groupFound: boolean,
  gatesMet: number,
  gatesTotal: number,
): number {
  let score = 0

  // Data completeness (up to 40 pts)
  const scoredDomains = [
    scores.technical_score, scores.tactical_score,
    scores.movement_score, scores.competition_score, scores.behavioral_score,
  ].filter(v => v !== null).length
  score += Math.round((scoredDomains / 5) * 40)

  // Score consistency — low spread = higher confidence (up to 20 pts)
  if (avg !== null && scoredDomains >= 3) {
    const values = [
      scores.technical_score, scores.tactical_score,
      scores.movement_score, scores.competition_score, scores.behavioral_score,
    ].filter((v): v is number => v !== null)
    const spread = Math.max(...values) - Math.min(...values)
    if (spread <= 1.5) score += 20
    else if (spread <= 3.0) score += 12
    else score += 4
  }

  // Level found (10 pts)
  if (levelFound) score += 10

  // Group found (10 pts)
  if (groupFound) score += 10

  // Gates data (up to 20 pts)
  if (gatesTotal > 0) {
    const gatePct = gatesMet / gatesTotal
    score += Math.round(gatePct * 20)
  }

  return Math.min(100, score)
}

// ── Reason + risk generation ──────────────────────────────────────────────────

function buildTopReasons(
  scores: AssessmentScoreInput,
  avg: number,
  stage: CurriculumStage,
  levelNumber: 1 | 2 | 3,
  gatesMet: number,
  gatesTotal: number,
): string[] {
  const reasons: string[] = []

  const stageLabel = STAGE_LABELS[stage]
  reasons.push(`Overall assessment average of ${avg.toFixed(1)} places the player in the ${stageLabel} score band.`)

  if (scores.technical_score !== null && scores.technical_score >= 6.5) {
    reasons.push(`Technical score of ${scores.technical_score.toFixed(1)} demonstrates readiness for structured stroke development at this level.`)
  }

  if (scores.movement_score !== null && scores.movement_score >= 6.0) {
    reasons.push(`Movement score of ${scores.movement_score.toFixed(1)} supports the physical demands of this curriculum level.`)
  }

  if (gatesTotal > 0 && gatesMet > 0) {
    const pct = Math.round((gatesMet / gatesTotal) * 100)
    reasons.push(`${gatesMet} of ${gatesTotal} curriculum gate requirements met (${pct}%).`)
  }

  if (levelNumber === 1) {
    reasons.push(`Level 1 selected within the stage: skill gaps in one or more domains suggest starting at the foundation of ${stageLabel}.`)
  } else if (levelNumber === 3) {
    reasons.push(`Level 3 selected within the stage: consistent performance across all domains supports placement at the advanced end of ${stageLabel}.`)
  }

  return reasons.slice(0, 4)
}

function buildLimitingFactors(
  scores: AssessmentScoreInput,
  gatesMet: number,
  gatesTotal: number,
): string[] {
  const factors: string[] = []

  const scoredCount = [
    scores.technical_score, scores.tactical_score,
    scores.movement_score, scores.competition_score, scores.behavioral_score,
  ].filter(v => v !== null).length

  if (scoredCount < 5) {
    factors.push(`Only ${scoredCount} of 5 assessment domains scored — recommendation is based on partial data.`)
  }

  if (scores.technical_score !== null && scores.technical_score < 4.0) {
    factors.push(`Technical score (${scores.technical_score.toFixed(1)}) is below the stage threshold — foundational technique needs attention.`)
  }

  if (scores.competition_score !== null && scores.competition_score < 4.0) {
    factors.push(`Competition score (${scores.competition_score.toFixed(1)}) suggests limited match-play experience — placement may feel challenging initially.`)
  }

  if (gatesTotal > 0 && gatesMet < gatesTotal * 0.5) {
    factors.push(`Less than 50% of level gates met — player may need additional time to consolidate before advancing.`)
  }

  return factors.slice(0, 3)
}

function buildRiskNotes(scores: AssessmentScoreInput): string[] {
  const risks: string[] = []

  const tech = scores.technical_score
  const comp = scores.competition_score
  const beh  = scores.behavioral_score
  const mov  = scores.movement_score

  if (tech !== null && comp !== null && comp > tech + 2.5) {
    risks.push('Competition readiness is significantly ahead of technical foundation. Monitor for frustration if technique does not match competitive intensity.')
  }

  if (tech !== null && mov !== null && tech > mov + 2.5) {
    risks.push('Technical scores well ahead of movement scores. Physical development may limit technical expression under match conditions.')
  }

  if (beh !== null && beh < 3.5) {
    risks.push('Low mental performance score. Coach should establish trust and routine before introducing competitive pressure.')
  }

  const values = [tech, scores.tactical_score, mov, comp, beh].filter((v): v is number => v !== null)
  if (values.length >= 4) {
    const spread = Math.max(...values) - Math.min(...values)
    if (spread > 4.0) {
      risks.push('High score spread across domains. This player may appear inconsistent at training — strong in some areas, developing in others. Confirm placement after 3–4 weeks.')
    }
  }

  return risks.slice(0, 3)
}

function buildCheckAfter4to6Weeks(
  stage: CurriculumStage,
  limitingFactors: string[],
): string[] {
  const checks = [
    `Confirm player is working within the ${STAGE_LABELS[stage]} curriculum — not overwhelmed or under-challenged.`,
    'Check that the coach has introduced the top priority from the development blueprint.',
    'Review session attendance and engagement — consistent attendance is the first signal of good fit.',
  ]

  if (limitingFactors.some(f => f.includes('partial data'))) {
    checks.push('Complete the missing assessment domains to improve recommendation confidence.')
  }

  if (limitingFactors.some(f => f.includes('gate'))) {
    checks.push('Review gate progress — target at least 2 gate completions within the first 6 weeks.')
  }

  return checks.slice(0, 4)
}

function buildAlternatives(
  targetStage: CurriculumStage,
  targetLevelNumber: 1 | 2 | 3,
  levels: LevelOption[],
  groups: GroupOption[],
  age: number | null,
): AlternativePlacement[] {
  const alternatives: AlternativePlacement[] = []
  const stageIdx = STAGE_ORDER.indexOf(targetStage)

  // Alternative 1: one level below in same stage
  if (targetLevelNumber > 1) {
    const lowerLevel = findBestLevel(levels, targetStage, (targetLevelNumber - 1) as 1 | 2 | 3)
    if (lowerLevel) {
      const group = findBestGroup(groups, lowerLevel.id, age, targetStage)
      alternatives.push({
        stage: targetStage,
        levelName: lowerLevel.display_name,
        levelId: lowerLevel.id,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
        rationale: 'Conservative placement — builds confidence before advancing.',
        trialRecommended: false,
      })
    }
  }

  // Alternative 2: one level above in same stage (trial)
  if (targetLevelNumber < 3) {
    const upperLevel = findBestLevel(levels, targetStage, (targetLevelNumber + 1) as 1 | 2 | 3)
    if (upperLevel) {
      const group = findBestGroup(groups, upperLevel.id, age, targetStage)
      alternatives.push({
        stage: targetStage,
        levelName: upperLevel.display_name,
        levelId: upperLevel.id,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
        rationale: 'Accelerated placement — suitable if player has shown upside the assessment may not capture.',
        trialRecommended: true,
      })
    }
  }

  // Alternative 3: first level of next stage (if player is at stage level 3)
  if (targetLevelNumber === 3 && stageIdx < STAGE_ORDER.length - 1) {
    const nextStage = STAGE_ORDER[stageIdx + 1] as CurriculumStage
    const nextStageLevel1 = findBestLevel(levels, nextStage, 1)
    if (nextStageLevel1) {
      const group = findBestGroup(groups, nextStageLevel1.id, age, nextStage)
      alternatives.push({
        stage: nextStage,
        levelName: nextStageLevel1.display_name,
        levelId: nextStageLevel1.id,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
        rationale: `Trial at the ${STAGE_LABELS[nextStage]} entry level — only if performance signals are consistently strong.`,
        trialRecommended: true,
      })
    }
  }

  // Alternative 4: previous stage level 3 (if player is at level 1)
  if (targetLevelNumber === 1 && stageIdx > 0) {
    const prevStage = STAGE_ORDER[stageIdx - 1] as CurriculumStage
    const prevStageLevel3 = findBestLevel(levels, prevStage, 3)
    if (prevStageLevel3) {
      const group = findBestGroup(groups, prevStageLevel3.id, age, prevStage)
      alternatives.push({
        stage: prevStage,
        levelName: prevStageLevel3.display_name,
        levelId: prevStageLevel3.id,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
        rationale: `Consolidation at the top of ${STAGE_LABELS[prevStage]} — if current assessment scores reflect a difficult assessment day.`,
        trialRecommended: false,
      })
    }
  }

  return alternatives.slice(0, 3)
}

function buildDonnaExplanation(
  stage: CurriculumStage,
  levelName: string,
  groupName: string | null,
  avg: number,
  confidence: number,
  reasons: string[],
  limiting: string[],
  riskNotes: string[],
  checks: string[],
): string {
  const lines: string[] = [
    `**DONNA Placement Recommendation: ${levelName}**`,
    ``,
    `**Why this placement fits:**`,
    ...reasons.map(r => `• ${r}`),
  ]

  if (groupName) {
    lines.push(``, `**Recommended group:** ${groupName}`)
  }

  lines.push(
    ``,
    `**Confidence:** ${confidence}% (${confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : 'Low'})`,
  )

  if (limiting.length > 0) {
    lines.push(``, `**What could make this recommendation wrong:**`)
    limiting.forEach(l => lines.push(`• ${l}`))
  }

  if (riskNotes.length > 0) {
    lines.push(``, `**Risk notes:**`)
    riskNotes.forEach(r => lines.push(`• ${r}`))
  }

  lines.push(``, `**Check after 4–6 weeks:**`)
  checks.forEach(c => lines.push(`• ${c}`))

  lines.push(
    ``,
    `This is a DONNA recommendation. The director has final authority on all placements.`,
    `No placement is official until the director accepts or overrides.`,
  )

  return lines.join('\n')
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a structured placement recommendation from assessment scores and context.
 * Pure function — deterministic, no side effects.
 */
export function generatePlacementRecommendation(
  scores: AssessmentScoreInput,
  context: PlacementContext,
): PlacementRecommendationResult {
  const avg = computeOverallAvg(scores)

  // Determine recommended stage and level
  const recommendedStage = avg !== null
    ? determineStage(avg, context.playerAgeYears ?? null)
    : 'red_foundation' // safe default when no data

  const levelNumber = avg !== null
    ? determineLevelNumber(scores, recommendedStage)
    : 1

  const recommendedLevel = findBestLevel(context.availableLevels, recommendedStage, levelNumber)
  const recommendedGroup = findBestGroup(
    context.availableGroups,
    recommendedLevel?.id ?? null,
    context.playerAgeYears ?? null,
    recommendedStage,
  )

  const gatesMet   = context.gatesMet ?? 0
  const gatesTotal = context.gatesTotal ?? 0

  // Build supporting content
  const topReasons       = buildTopReasons(scores, avg ?? 0, recommendedStage, levelNumber, gatesMet, gatesTotal)
  const limitingFactors  = buildLimitingFactors(scores, gatesMet, gatesTotal)
  const riskNotes        = buildRiskNotes(scores)
  const checks           = buildCheckAfter4to6Weeks(recommendedStage, limitingFactors)
  const alternatives     = buildAlternatives(
    recommendedStage, levelNumber,
    context.availableLevels, context.availableGroups, context.playerAgeYears ?? null,
  )

  // Confidence
  const confidenceScore = computeConfidence(
    scores, avg, !!recommendedLevel, !!recommendedGroup, gatesMet, gatesTotal,
  )
  const confidenceTier: PlacementRecommendationResult['confidenceTier'] =
    confidenceScore >= 80 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low'

  // Evidence sources
  const evidenceUsed: string[] = []
  if (avg !== null) evidenceUsed.push(`Assessment scores (${Object.values(scores).filter(Boolean).length}/5 domains)`)
  if (gatesTotal > 0) evidenceUsed.push(`Level gate completion (${gatesMet}/${gatesTotal})`)
  if (context.playerAgeYears) evidenceUsed.push(`Player age (${context.playerAgeYears} years)`)
  if (context.currentLevelName) evidenceUsed.push(`Current level (${context.currentLevelName})`)
  if (context.availableGroups.length > 0) evidenceUsed.push(`${context.availableGroups.length} available group(s)`)

  const levelName = recommendedLevel?.display_name ?? `${STAGE_LABELS[recommendedStage]} Level ${levelNumber}`

  const donnaExplanation = buildDonnaExplanation(
    recommendedStage, levelName, recommendedGroup?.name ?? null,
    avg ?? 0, confidenceScore,
    topReasons, limitingFactors, riskNotes, checks,
  )

  // Reassessment timing: sooner for low confidence, longer for high
  const reassessmentWeeks = confidenceScore >= 80 ? 8 : confidenceScore >= 60 ? 6 : 4

  return {
    recommendedStage,
    recommendedLevelId:    recommendedLevel?.id ?? null,
    recommendedLevelName:  levelName,
    recommendedGroupId:    recommendedGroup?.id ?? null,
    recommendedGroupName:  recommendedGroup?.name ?? null,
    confidenceScore,
    confidenceTier,
    topReasons,
    limitingFactors,
    riskNotes,
    alternativePlacements: alternatives,
    evidenceUsed,
    donnaExplanation,
    checkAfter4to6Weeks:   checks,
    recommendedReassessmentWeeks: reassessmentWeeks,
    computedOverallAvg:    avg,
  }
}
