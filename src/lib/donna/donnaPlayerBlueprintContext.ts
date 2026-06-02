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

// ── Router ────────────────────────────────────────────────────────────────────

/**
 * Route a DONNA question about a player's blueprint to the appropriate answer.
 * Caller is responsible for fetching blueprint data and passing it in.
 * DONNA never invents answers — returns honest fallback when data is missing.
 */
export function donnaBlueprintAnswer(
  intent: BlueprintQuestionIntent,
  input: BlueprintContextInput,
  requestingRole: 'academy_director' | 'head_coach' | 'coach' | 'parent' | 'player' = 'academy_director',
): string {
  switch (intent) {
    case 'why_placed_here':    return donnaAnswerWhyPlacedHere(input)
    case 'coach_first_focus':  return donnaAnswerCoachFirstFocus(input)
    case 'player_strengths':   return donnaAnswerPlayerStrengths(input)
    case 'player_gaps':        return donnaAnswerPlayerGaps(input)
    case 'parent_summary':     return donnaAnswerParentSummary(input, requestingRole)
    case 'player_home_practice': return donnaAnswerHomePractice(input)
    case 'thirty_day_plan':    return donnaAnswerThirtyDayPlan(input)
    case 'mission_status':     return donnaAnswerMissionStatus(input)
    default:                   return `Blueprint question not recognised. Available topics: placement rationale, coach focus, strengths, development areas, parent summary, home practice, 30-day plan, mission status.`
  }
}
