// Sprint 1112 — DONNA Player Blueprint Context V1
//
// Provides blueprint-aware answer functions for DONNA.
// DONNA answers key post-onboarding questions by reading from the blueprint.
//
// Questions answered:
//   - Why was this player placed here?
//   - What should the coach focus on first?
//   - What are the player's biggest strengths?
//   - What are the biggest development areas?
//   - What should the parent know?
//   - What should the player work on at home?
//   - What is the 30-day plan?
//   - What missions has this player been assigned?
//
// Safety:
//   - Never invents answers — returns honest "blueprint not available" if data missing
//   - Parent-facing answers reference parentSummary only — never coach brief
//   - DONNA cannot activate missions — they remain in pending_review until director approves
//   - No DB calls in this file — caller passes blueprint data as input
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlueprintContextInput {
  playerFirstName: string
  playerLastName: string
  curriculumLevelName: string
  curriculumStageKey: string
  strengths: string[]
  gaps: string[]
  coachBrief: string | null
  coachFocusAreas: string[]
  parentSummary: string | null
  parentDevelopmentFocus: string | null
  parentNextSteps: string[]
  parentThirtyDayPreview: string | null
  donnaBrief: string | null
  thirtyDayPlan: {
    skillFocus: string
    competitionFocus: string
    fitnessFocus: string
    mentalFocus: string
    rationale: string
  } | null
  placementRationale: string | null
  assessmentOverallScore: number | null
  pendingMissionCount: number
}

export type BlueprintQuestionIntent =
  | 'why_placed_here'
  | 'coach_first_focus'
  | 'player_strengths'
  | 'player_gaps'
  | 'parent_summary'
  | 'player_home_practice'
  | 'thirty_day_plan'
  | 'mission_status'
  // Sprint 1113-1120: Development intelligence questions
  | 'is_ready_for_reassessment'
  | 'is_ready_for_level_review'
  | 'what_improved_since_last_assessment'
  | 'what_missions_should_stay_active'
  | 'what_is_blocking_level_movement'
  // Placement recommendation intelligence
  | 'explain_placement_recommendation'

// ── Helpers ───────────────────────────────────────────────────────────────────

function noBlueprintFallback(playerName: string): string {
  return `I don't have a development blueprint loaded for ${playerName} yet. ` +
    `The blueprint is generated automatically when a player is placed. ` +
    `If ${playerName} has been placed, the blueprint should appear shortly.`
}

// ── Answer builders ───────────────────────────────────────────────────────────

export function donnaAnswerWhyPlacedHere(input: BlueprintContextInput): string {
  const { playerFirstName, curriculumLevelName, curriculumStageKey, placementRationale, assessmentOverallScore } = input

  if (!curriculumLevelName) return noBlueprintFallback(playerFirstName)

  const stageParts: Record<string, string> = {
    red_foundation:     'Red Ball Foundation — the entry level for new players building fundamental skills',
    orange_development: 'Orange Ball Development — the stage where core strokes and competition foundations are built',
    green_performance:  'Green Ball Performance — where technique becomes consistent and tactical play develops',
    yellow_competitive: 'Yellow Ball Competitive — full competition development and tournament preparation',
    high_performance:   'High Performance — advanced competitive development',
  }

  const stageDescription = stageParts[curriculumStageKey] ?? curriculumStageKey

  let answer = `${playerFirstName} was placed at ${curriculumLevelName} (${stageDescription}). `

  if (placementRationale) {
    answer += `The placement rationale was: "${placementRationale}". `
  }

  if (assessmentOverallScore !== null) {
    answer += `The initial assessment overall score was ${assessmentOverallScore.toFixed(1)}. `
  }

  answer += `This placement reflects the level where ${playerFirstName} can develop confidently while being appropriately challenged.`

  return answer
}

export function donnaAnswerCoachFirstFocus(input: BlueprintContextInput): string {
  const { playerFirstName, coachFocusAreas, coachBrief, thirtyDayPlan } = input

  if (!coachBrief && coachFocusAreas.length === 0) {
    return noBlueprintFallback(playerFirstName)
  }

  if (coachFocusAreas.length > 0) {
    const areas = coachFocusAreas.slice(0, 3).map(a => `• ${a}`).join('\n')
    let answer = `For ${playerFirstName}, the coach's first focus areas are:\n${areas}`
    if (thirtyDayPlan) {
      answer += `\n\nFirst 30 days: Skill — ${thirtyDayPlan.skillFocus} | Mental — ${thirtyDayPlan.mentalFocus}`
    }
    return answer
  }

  return coachBrief ?? noBlueprintFallback(playerFirstName)
}

export function donnaAnswerPlayerStrengths(input: BlueprintContextInput): string {
  const { playerFirstName, strengths } = input

  if (strengths.length === 0) {
    return `The assessment for ${playerFirstName} did not record specific strengths yet. ` +
      `These are typically added during the assessment session and will appear in the blueprint when available.`
  }

  const top = strengths.slice(0, 5)
  return `${playerFirstName}'s key strengths identified at placement are:\n${top.map(s => `• ${s}`).join('\n')}\n\n` +
    `These are the foundation to build on in the first development phase.`
}

export function donnaAnswerPlayerGaps(input: BlueprintContextInput): string {
  const { playerFirstName, gaps, thirtyDayPlan } = input

  if (gaps.length === 0) {
    return `Development areas for ${playerFirstName} will be identified and updated as the coaching relationship develops. ` +
      `The initial blueprint uses assessment scores to generate priorities even when specific gap labels are not yet defined.`
  }

  const top = gaps.slice(0, 4)
  let answer = `${playerFirstName}'s primary development areas identified at placement:\n${top.map(g => `• ${g}`).join('\n')}`

  if (thirtyDayPlan) {
    answer += `\n\nThe 30-day plan addresses these by focusing on: ${thirtyDayPlan.skillFocus} (skill) and ${thirtyDayPlan.mentalFocus} (mental performance).`
  }

  return answer
}

export function donnaAnswerParentSummary(
  input: BlueprintContextInput,
  requestingRole: 'academy_director' | 'head_coach' | 'coach' | 'parent' | 'player',
): string {
  const { playerFirstName, parentSummary, parentDevelopmentFocus, parentThirtyDayPreview } = input

  // Coaches and directors get the full summary
  if (requestingRole === 'academy_director' || requestingRole === 'head_coach' || requestingRole === 'coach') {
    if (!parentSummary) return noBlueprintFallback(playerFirstName)
    return `Here is the parent-safe summary for ${playerFirstName}:\n\n${parentSummary}\n\n` +
      (parentDevelopmentFocus ? `Development focus: ${parentDevelopmentFocus}\n\n` : '') +
      (parentThirtyDayPreview ? `30-day preview: ${parentThirtyDayPreview}` : '')
  }

  // Parents get the parent summary only
  if (requestingRole === 'parent') {
    return parentSummary ?? `The development summary for your child will be available once their director has approved it for sharing.`
  }

  // Players get the preview
  if (requestingRole === 'player') {
    return parentThirtyDayPreview ??
      `Your development focus will be shared with you by your coach during your first session.`
  }

  return noBlueprintFallback(playerFirstName)
}

export function donnaAnswerHomePractice(input: BlueprintContextInput): string {
  const { playerFirstName, thirtyDayPlan, coachFocusAreas } = input

  if (!thirtyDayPlan) {
    return `Home practice recommendations for ${playerFirstName} will be available once the development blueprint is loaded.`
  }

  return [
    `For home practice, ${playerFirstName} should focus on:`,
    ``,
    `• **Skill:** ${thirtyDayPlan.skillFocus} — try shadow swings, ball bounce practice, or wall work.`,
    `• **Mental:** ${thirtyDayPlan.mentalFocus} — use a brief reset routine between practice reps.`,
    ``,
    `Keep home practice short and positive — 10–15 minutes with full focus is better than 45 minutes going through the motions.`,
    coachFocusAreas.length > 0
      ? `\nYour coach's current focus area is: ${coachFocusAreas[0]} — this is a good home practice target.`
      : '',
  ].filter(Boolean).join('\n')
}

export function donnaAnswerThirtyDayPlan(input: BlueprintContextInput): string {
  const { playerFirstName, thirtyDayPlan } = input

  if (!thirtyDayPlan) return noBlueprintFallback(playerFirstName)

  return [
    `**${playerFirstName}'s First 30-Day Plan:**`,
    ``,
    `Skill focus:       ${thirtyDayPlan.skillFocus}`,
    `Competition focus: ${thirtyDayPlan.competitionFocus}`,
    `Fitness focus:     ${thirtyDayPlan.fitnessFocus}`,
    `Mental focus:      ${thirtyDayPlan.mentalFocus}`,
    ``,
    `**Why these were selected:**`,
    thirtyDayPlan.rationale,
  ].join('\n')
}

export function donnaAnswerMissionStatus(input: BlueprintContextInput): string {
  const { playerFirstName, pendingMissionCount } = input

  if (pendingMissionCount === 0) {
    return `No missions are currently pending review for ${playerFirstName}. ` +
      `Initial missions were generated at placement and may have already been approved or assigned. ` +
      `Check the Review Queue for any pending mission approvals.`
  }

  return `${playerFirstName} has ${pendingMissionCount} initial mission${pendingMissionCount > 1 ? 's' : ''} ` +
    `waiting for your approval in the Review Queue. ` +
    `These were generated automatically at placement and reflect the top priorities from the development blueprint. ` +
    `Review and approve them to make them visible to the coach and player.`
}

// ── Sprint 1113-1120: Development intelligence answer functions ──────────────

export interface DevelopmentIntelligenceInput extends BlueprintContextInput {
  /** Days since last assessment (null if no previous assessment) */
  daysSinceLastAssessment: number | null
  /** Number of active missions */
  activeMissionCount: number
  /** Level gates met (completed) */
  gatesMet: number
  /** Total level gates required */
  gatesTotal: number
  /** Has any recent session data (last 30 days) */
  hasRecentSessions: boolean
  /** Assessment comparison summary from assessmentComparisonEngine (null if only one assessment) */
  comparisonSummary: string | null
}

export function donnaAnswerIsReadyForReassessment(input: DevelopmentIntelligenceInput): string {
  const { playerFirstName, daysSinceLastAssessment } = input

  if (daysSinceLastAssessment === null) {
    return `No previous assessment found for ${playerFirstName}. The initial onboarding placement serves as the baseline. ` +
      `A first reassessment is typically recommended 4–6 weeks after placement.`
  }

  if (daysSinceLastAssessment < 28) {
    return `${playerFirstName} was last assessed ${daysSinceLastAssessment} days ago. ` +
      `A reassessment is generally most valuable after at least 4 weeks of training. ` +
      `No reassessment is recommended yet.`
  }

  if (daysSinceLastAssessment >= 28 && daysSinceLastAssessment < 84) {
    return `${playerFirstName} was last assessed ${daysSinceLastAssessment} days ago. ` +
      `This is a good time to consider a reassessment — 4–12 weeks of training typically produces measurable changes. ` +
      `A standard reassessment is recommended.`
  }

  return `${playerFirstName} has not been assessed for ${daysSinceLastAssessment} days. ` +
    `A reassessment is overdue. Consider scheduling one soon to update the development blueprint.`
}

export function donnaAnswerIsReadyForLevelReview(input: DevelopmentIntelligenceInput): string {
  const { playerFirstName, gatesMet, gatesTotal, activeMissionCount } = input

  if (gatesTotal === 0) {
    return `No level gate requirements are configured for ${playerFirstName}'s current level. ` +
      `Contact the curriculum administrator or set up level gates to enable automated level readiness assessment.`
  }

  const gateCompletionPct = Math.round((gatesMet / gatesTotal) * 100)

  if (gateCompletionPct < 50) {
    return `${playerFirstName} has completed ${gatesMet} of ${gatesTotal} level gate requirements (${gateCompletionPct}%). ` +
      `A level review is not recommended yet. Continue focusing on the active missions and current development priorities.`
  }

  if (gateCompletionPct >= 50 && gateCompletionPct < 80) {
    return `${playerFirstName} has completed ${gatesMet} of ${gatesTotal} level gate requirements (${gateCompletionPct}%). ` +
      `Progress is solid but not yet at the readiness threshold. ` +
      `${activeMissionCount > 0 ? `${activeMissionCount} active mission${activeMissionCount > 1 ? 's' : ''} are still in progress.` : ''} ` +
      `A level review in the next 4–6 weeks would be worth planning.`
  }

  return `${playerFirstName} has completed ${gatesMet} of ${gatesTotal} level gate requirements (${gateCompletionPct}%). ` +
    `This player may be approaching readiness for a level review. ` +
    `Recommend initiating a level readiness review — no movement happens without your explicit approval.`
}

export function donnaAnswerWhatImprovedSinceLastAssessment(input: DevelopmentIntelligenceInput): string {
  const { playerFirstName, comparisonSummary, daysSinceLastAssessment } = input

  if (!comparisonSummary) {
    if (daysSinceLastAssessment === null) {
      return `No previous assessment exists for ${playerFirstName} to compare against. The next assessment will produce a comparison.`
    }
    return `A comparison is not available yet. Complete a new assessment and the system will generate a comparison automatically.`
  }

  return `Here is the development comparison for ${playerFirstName}:\n\n${comparisonSummary}`
}

export function donnaAnswerWhatMissionsShouldStayActive(input: DevelopmentIntelligenceInput): string {
  const { playerFirstName, activeMissionCount, pendingMissionCount, thirtyDayPlan } = input

  if (activeMissionCount === 0 && pendingMissionCount === 0) {
    return `${playerFirstName} has no active or pending missions. ` +
      `Generate a new development blueprint or assign missions manually from the Missions tab.`
  }

  if (pendingMissionCount > 0) {
    return `${playerFirstName} has ${pendingMissionCount} mission${pendingMissionCount > 1 ? 's' : ''} waiting for your review. ` +
      `Approve the ones that align with the current development priorities — reject or skip any that are no longer relevant.`
  }

  let answer = `${playerFirstName} currently has ${activeMissionCount} active mission${activeMissionCount > 1 ? 's' : ''}. `

  if (thirtyDayPlan) {
    answer += `Based on the current 30-day plan, missions focused on **${thirtyDayPlan.skillFocus}** ` +
      `and **${thirtyDayPlan.mentalFocus}** are the highest-priority ones to keep active. ` +
      `Any mission not connected to the current development priorities can be archived to reduce cognitive load.`
  } else {
    answer += `Review the missions in the Missions tab and keep those that align with the player's current development focus.`
  }

  return answer
}

export function donnaAnswerWhatIsBlockingLevelMovement(input: DevelopmentIntelligenceInput): string {
  const { playerFirstName, gatesMet, gatesTotal, gaps, thirtyDayPlan } = input

  const parts: string[] = []

  if (gatesTotal > 0) {
    const remaining = gatesTotal - gatesMet
    if (remaining > 0) {
      parts.push(`${remaining} level gate requirement${remaining > 1 ? 's' : ''} not yet met (${gatesMet}/${gatesTotal} complete).`)
    } else {
      parts.push(`All ${gatesTotal} level gate requirements are met.`)
    }
  }

  if (gaps.length > 0) {
    const topGaps = gaps.slice(0, 3)
    parts.push(`Current development gaps: ${topGaps.join(', ')}.`)
  }

  if (thirtyDayPlan) {
    parts.push(`Current 30-day focus: ${thirtyDayPlan.skillFocus} (skill), ${thirtyDayPlan.competitionFocus} (competition).`)
  }

  if (parts.length === 0) {
    return `No specific blockers identified for ${playerFirstName}. Review the level gate requirements and recent assessments for a complete picture.`
  }

  return `For ${playerFirstName}, the following are blocking or delaying level movement:\n\n` +
    parts.map(p => `• ${p}`).join('\n') + `\n\n` +
    `No level movement happens automatically — a level readiness review is required and you must approve any change.`
}

// ── Placement recommendation context ─────────────────────────────────────────

export interface PlacementRecommendationContextInput {
  recommendedLevelName: string
  recommendedGroupName: string | null
  confidenceScore: number
  confidenceTier: 'high' | 'medium' | 'low'
  topReasons: string[]
  limitingFactors: string[]
  riskNotes: string[]
  donnaExplanation: string | null
  checkAfter4to6Weeks: string[]
  recommendedReassessmentWeeks: number | null
  decision: string | null // 'accepted' | 'overridden' | 'trial' | 'deferred' | null
  overrideReason: string | null
  directorNote: string | null
  finalLevelName: string | null
}

export function donnaAnswerExplainPlacementRecommendation(
  playerFirstName: string,
  rec: PlacementRecommendationContextInput,
  requestingRole: 'academy_director' | 'head_coach' | 'coach' | 'parent' | 'player' = 'academy_director',
): string {
  // Parents and players never see placement recommendation details
  if (requestingRole === 'parent') {
    return `Your academy director is working on ${playerFirstName}'s development placement. You'll be notified when it's finalised.`
  }
  if (requestingRole === 'player') {
    return `Your coach and director are setting up your development journey. More details will be shared with you soon.`
  }

  if (rec.donnaExplanation) return rec.donnaExplanation

  // Fallback if full explanation not available
  const parts: string[] = [
    `**DONNA Placement Recommendation for ${playerFirstName}:**`,
    `Recommended level: ${rec.recommendedLevelName}`,
    rec.recommendedGroupName ? `Recommended group: ${rec.recommendedGroupName}` : '',
    `Confidence: ${rec.confidenceScore}% (${rec.confidenceTier})`,
    '',
    '**Top reasons:**',
    ...rec.topReasons.map(r => `• ${r}`),
  ].filter(Boolean)

  if (rec.limitingFactors.length > 0) {
    parts.push('', '**What could make this wrong:**')
    rec.limitingFactors.forEach(f => parts.push(`• ${f}`))
  }

  if (rec.checkAfter4to6Weeks.length > 0) {
    parts.push('', '**Check after 4–6 weeks:**')
    rec.checkAfter4to6Weeks.forEach(c => parts.push(`• ${c}`))
  }

  if (rec.decision) {
    const decisionLabel = rec.decision.charAt(0).toUpperCase() + rec.decision.slice(1)
    parts.push(``, `**Director decision:** ${decisionLabel}`)
    if (rec.overrideReason) {
      parts.push(`Override reason: ${rec.overrideReason.replace(/_/g, ' ')}`)
    }
    if (rec.directorNote) {
      parts.push(`Director note: ${rec.directorNote}`)
    }
    if (rec.finalLevelName && rec.finalLevelName !== rec.recommendedLevelName) {
      parts.push(`Final level: ${rec.finalLevelName} (different from DONNA recommendation)`)
    }
  } else {
    parts.push(``, `**Status:** Pending director decision.`)
    parts.push(`No placement is official until the director accepts or overrides this recommendation.`)
  }

  return parts.join('\n')
}

// ── Router ────────────────────────────────────────────────────────────────────

/**
 * Route a DONNA question about a player's blueprint to the appropriate answer.
 * Caller is responsible for fetching blueprint data and passing it in.
 * DONNA never invents answers — returns honest fallback when data is missing.
 */
export function donnaBlueprintAnswer(
  intent: BlueprintQuestionIntent,
  input: BlueprintContextInput | DevelopmentIntelligenceInput,
  requestingRole: 'academy_director' | 'head_coach' | 'coach' | 'parent' | 'player' = 'academy_director',
): string {
  switch (intent) {
    case 'why_placed_here':       return donnaAnswerWhyPlacedHere(input)
    case 'coach_first_focus':     return donnaAnswerCoachFirstFocus(input)
    case 'player_strengths':      return donnaAnswerPlayerStrengths(input)
    case 'player_gaps':           return donnaAnswerPlayerGaps(input)
    case 'parent_summary':        return donnaAnswerParentSummary(input, requestingRole)
    case 'player_home_practice':  return donnaAnswerHomePractice(input)
    case 'thirty_day_plan':       return donnaAnswerThirtyDayPlan(input)
    case 'mission_status':        return donnaAnswerMissionStatus(input)
    // Sprint 1113-1120: development intelligence
    case 'is_ready_for_reassessment':
      return 'daysSinceLastAssessment' in input
        ? donnaAnswerIsReadyForReassessment(input as DevelopmentIntelligenceInput)
        : `Development intelligence data not available for this question.`
    case 'is_ready_for_level_review':
      return 'gatesTotal' in input
        ? donnaAnswerIsReadyForLevelReview(input as DevelopmentIntelligenceInput)
        : `Level gate data not available.`
    case 'what_improved_since_last_assessment':
      return 'comparisonSummary' in input
        ? donnaAnswerWhatImprovedSinceLastAssessment(input as DevelopmentIntelligenceInput)
        : `Assessment comparison data not available.`
    case 'what_missions_should_stay_active':
      return 'activeMissionCount' in input
        ? donnaAnswerWhatMissionsShouldStayActive(input as DevelopmentIntelligenceInput)
        : `Mission data not available.`
    case 'what_is_blocking_level_movement':
      return 'gatesTotal' in input
        ? donnaAnswerWhatIsBlockingLevelMovement(input as DevelopmentIntelligenceInput)
        : `Level gate data not available.`
    case 'explain_placement_recommendation':
      return `Placement recommendation explanation requires a PlacementRecommendationContextInput. Use donnaAnswerExplainPlacementRecommendation() directly.`
    default:
      return `Blueprint question not recognised. Available topics: placement rationale, coach focus, strengths, development areas, parent summary, home practice, 30-day plan, mission status, reassessment readiness, level review readiness, improvement since last assessment, mission recommendations, level movement blockers, placement recommendation.`
  }
}
