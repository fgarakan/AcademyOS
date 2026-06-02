// Player Development Blueprint Generator V1
//
// Assembles the complete blueprint object from assessment + placement data.
// Pure TypeScript — no DB, no API, no mutations, no side effects.
//
// Outputs:
//   - 4-pathway priorities (from priorityEngine)
//   - First 30-day plan
//   - 3 initial mission definitions (for review queue submission)
//   - Coach brief (under 60 seconds to read)
//   - Parent-safe summary

import {
  generateBlueprintPriorities,
  getTopPriorities,
  type AssessmentScores,
  type CurriculumStage,
  type BlueprintPriorities,
  type DevelopmentPriority,
} from './priorityEngine'

// ── Input types ───────────────────────────────────────────────────────────────

export interface BlueprintInput {
  playerId: string
  academyId: string
  playerFirstName: string
  playerLastName: string

  // Curriculum placement
  curriculumLevelId?: string | null
  curriculumLevelName: string
  curriculumStageKey: CurriculumStage

  // Assessment data
  assessmentId?: string | null
  scores: AssessmentScores
  strengths: string[]
  gaps: string[]

  // Placement metadata
  placementRecommendationId?: string | null
  placementRationale?: string | null

  // Actor
  generatedByUserId: string
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface ThirtyDayPlan {
  skillFocus: string
  competitionFocus: string
  fitnessFocus: string
  mentalFocus: string
  rationale: string
}

export interface InitialMissionDraft {
  missionLabel: string
  description: string
  linkedPriority: string
  linkedPathway: 'skill' | 'competition' | 'fitness' | 'mental'
  curriculumLevelKey: string
}

export interface GeneratedBlueprint {
  // Priorities
  priorities: BlueprintPriorities

  // 30-day plan
  thirtyDayPlan: ThirtyDayPlan

  // Initial missions (3 for review queue)
  initialMissions: InitialMissionDraft[]

  // Coach brief
  coachBrief: string
  coachFocusAreas: string[]

  // Parent summary
  parentSummary: string
  parentDevelopmentFocus: string
  parentNextSteps: string[]
  parentThirtyDayPreview: string

  // DONNA brief
  donnaBrief: string

  // Enriched strengths and gaps
  strengths: string[]
  gaps: string[]
}

// ── 30-Day Plan Builder ───────────────────────────────────────────────────────

function buildThirtyDayPlan(
  topPriorities: ReturnType<typeof getTopPriorities>,
  scores: AssessmentScores,
  stageName: string,
): ThirtyDayPlan {
  // Build rationale from the lowest scores (what needs most work)
  const scoreEntries = [
    { name: 'technical', score: scores.technical_score },
    { name: 'tactical', score: scores.tactical_score },
    { name: 'movement', score: scores.movement_score },
    { name: 'behavioral', score: scores.behavioral_score },
  ].filter(e => e.score !== null).sort((a, b) => (a.score ?? 10) - (b.score ?? 10))

  const lowestArea = scoreEntries[0]?.name ?? 'technical'
  const areaMap: Record<string, string> = {
    technical: 'technical skills',
    tactical: 'tactical decision-making',
    movement: 'movement and athleticism',
    behavioral: 'mental performance',
  }

  const rationale = `These four focus areas were selected based on the ${stageName} placement assessment. ` +
    `${areaMap[lowestArea] ? `The greatest development opportunity identified was in ${areaMap[lowestArea]}, ` : ''}` +
    `and these priorities represent the most efficient path to building a complete game at this level. ` +
    `Each focus area supports the others — technical improvement creates competition confidence, ` +
    `and improved fitness supports both technical execution and mental resilience.`

  return {
    skillFocus:       topPriorities.skill.label,
    competitionFocus: topPriorities.competition.label,
    fitnessFocus:     topPriorities.fitness.label,
    mentalFocus:      topPriorities.mental.label,
    rationale,
  }
}

// ── Mission Generator ─────────────────────────────────────────────────────────

// Mission label templates per priority label — maps common priority labels to mission titles
const MISSION_LABEL_TEMPLATES: Record<string, { label: string; description: string }> = {
  'Tracking':                { label: 'Keep Your Eye On The Ball',    description: 'Stay focused on tracking the ball from the opponent\'s racket all the way to your contact point on every shot.' },
  'Contact Quality':         { label: 'Own Your Contact',             description: 'Make clean, centered contact the priority on every groundstroke this week.' },
  'Ball Control':            { label: 'Control The Court',            description: 'Choose your target before each shot and aim for consistent depth and direction in rallies.' },
  'Contact Spacing':         { label: 'Create More Space',            description: 'Focus on getting into position early enough to create comfortable contact spacing before hitting.' },
  'Swing Path':              { label: 'Trust Your Swing',             description: 'Commit to a smooth, complete swing path on every ball without short-arming the shot.' },
  'Serve Rhythm':            { label: 'Smooth Serve Rhythm',          description: 'Focus on a consistent, relaxed service motion with the same rhythm every time.' },
  'Spin Variation':          { label: 'Add More Spin',                description: 'Practice brushing up on forehands and slicing down on backhands to build spin variety.' },
  'Cross-Court Rally Pattern': { label: 'Win The Rally Game',         description: 'Build the habit of starting every rally cross-court and staying patient until an opportunity opens.' },
  'Low Ball Adaptation':     { label: 'Own The Low Ball',             description: 'Practice getting under low balls with a bent knee and lifting through contact rather than scooping.' },
  'Rally Tolerance':         { label: 'Stay In The Rally',            description: 'Compete to extend rallies this week — let the opponent make the first error rather than going for too much.' },
  'Error Management':        { label: 'Compete Smart',                description: 'Play within your capability. Choose high-percentage shots and let the game come to you.' },
  'Pattern Recognition':     { label: 'Play With A Plan',             description: 'Before each point, identify one pattern to run. Stick to the plan rather than reacting randomly.' },
  'Scoring Knowledge':       { label: 'Know The Score',               description: 'Practice recalling the score before every point. Knowing the score enables smart decision-making.' },
  'Point Construction':      { label: 'Build The Point',              description: 'Practice multi-ball attacking sequences: open the court, move the opponent, attack the open space.' },
  'Balance':                 { label: 'Move With Balance',            description: 'Focus on staying balanced and upright through every movement pattern and contact position.' },
  'Coordination':            { label: 'Move Like An Athlete',         description: 'Focus on coordinated, flowing athletic movement between shots rather than stiff or reactive positioning.' },
  'Basic Mobility':          { label: 'Stretch And Move Well',        description: 'Include hip and shoulder mobility in warm-up and cool-down every session this week.' },
  'Lateral Speed':           { label: 'Cover The Court',              description: 'Work on first-step acceleration to wide balls. Beat the ball to the contact point rather than reaching.' },
  'Explosive Power':         { label: 'Drive Through The Ball',       description: 'Focus on loading the legs and driving through the ball on every groundstroke for more power with less effort.' },
  'Confidence':              { label: 'Believe In Yourself',          description: 'After every error, reset with a positive cue word and move immediately to the next point.' },
  'Resilience':              { label: 'Bounce Back Fast',             description: 'Practice resetting after every lost point within 3 seconds. The previous point is over — the next one is yours.' },
  'Focus':                   { label: 'One Point At A Time',          description: 'Practice bringing full attention back to the present before every point. Leave the last point behind.' },
  'Coachability':            { label: 'Listen And Apply',             description: 'Make one coaching adjustment per practice session and track whether it changed your feel or result.' },
  'Composure Under Pressure': { label: 'Stay Calm In Big Moments',   description: 'Use your between-point routine on every pressure point (30-30, deuce, break point) without exception.' },
  'Growth Mindset':          { label: 'Embrace The Challenge',        description: 'Reframe one difficult moment each session as a learning opportunity rather than a failure.' },
  'Mental Toughness':        { label: 'Fight For Every Point',        description: 'Commit to full competitive effort on every single point regardless of the score or your last shot.' },
}

function buildMissionFromPriority(
  priority: DevelopmentPriority,
  levelKey: string,
  rank: 1 | 2 | 3,
): InitialMissionDraft {
  const template = MISSION_LABEL_TEMPLATES[priority.label]
  return {
    missionLabel:   template?.label ?? `Mission: ${priority.label}`,
    description:    template?.description ?? priority.description,
    linkedPriority: priority.label,
    linkedPathway:  priority.pathway,
    curriculumLevelKey: levelKey,
  }
}

function generateInitialMissions(
  priorities: BlueprintPriorities,
  levelKey: string,
): InitialMissionDraft[] {
  // Select the top priority from the 3 most impactful pathways.
  // Always include skill (most universal) + mental (highest retention impact) + one other.
  const topSkill       = priorities.skill[0]
  const topMental      = priorities.mental[0]
  // Choose competition or fitness based on which scored lower (more urgent)
  const topThird       = priorities.competition[0]

  return [
    buildMissionFromPriority(topSkill,       levelKey, 1),
    buildMissionFromPriority(topThird,        levelKey, 2),
    buildMissionFromPriority(topMental,       levelKey, 3),
  ]
}

// ── Coach Brief Builder ───────────────────────────────────────────────────────

function buildCoachBrief(
  firstName: string,
  lastName: string,
  levelName: string,
  strengths: string[],
  gaps: string[],
  topPriorities: ReturnType<typeof getTopPriorities>,
): { brief: string; focusAreas: string[] } {
  const top3Strengths = strengths.slice(0, 3)
  const top3Gaps      = gaps.slice(0, 3)

  const strengthsLine = top3Strengths.length > 0
    ? top3Strengths.join(', ')
    : 'Assessed by observation — see assessment notes'

  const gapsLine = top3Gaps.length > 0
    ? top3Gaps.join(', ')
    : 'To be identified through early sessions'

  const focusAreas = [
    topPriorities.skill.description,
    topPriorities.competition.description,
    topPriorities.mental.description,
  ]

  const brief = `${firstName} ${lastName} — ${levelName}

TOP STRENGTHS
${top3Strengths.map(s => `• ${s}`).join('\n')}

TOP PRIORITIES
Skill:       ${topPriorities.skill.label}
Competition: ${topPriorities.competition.label}
Fitness:     ${topPriorities.fitness.label}
Mental:      ${topPriorities.mental.label}

COACH FOCUS
• ${topPriorities.skill.description}
• ${topPriorities.competition.description}
• ${topPriorities.mental.description}

WHY THIS PLAYER
Strengths: ${strengthsLine}
Development opportunities: ${gapsLine}

First 30 days: Lead with ${topPriorities.skill.label} and ${topPriorities.mental.label}. Build early confidence before pushing competition volume.`

  return { brief, focusAreas }
}

// ── Parent Summary Builder ────────────────────────────────────────────────────

// Stage-appropriate language mappings (no ratings, no negatives, no internal terminology)
const STAGE_PARENT_LANGUAGE: Record<CurriculumStage, { stageName: string; nextStagePreview: string }> = {
  red_foundation:    { stageName: 'Red Ball',      nextStagePreview: 'Orange Ball play' },
  orange_development: { stageName: 'Orange Ball',  nextStagePreview: 'Green Ball competition' },
  green_performance:  { stageName: 'Green Ball',   nextStagePreview: 'Yellow Ball tournaments' },
  yellow_competitive: { stageName: 'Yellow Ball',  nextStagePreview: 'open tournament play' },
  high_performance:   { stageName: 'High Performance', nextStagePreview: 'national and international events' },
}

// Parent-friendly strength re-labels
function parentFriendlyStrength(strength: string): string {
  const map: Record<string, string> = {
    'tracking':            'natural ball-watching instinct',
    'movement':            'great court movement',
    'effort':              'outstanding effort and attitude',
    'coachability':        'excellent work ethic and responsiveness to coaching',
    'contact quality':     'good natural feel for the ball',
    'ball control':        'developing touch and control',
    'serve rhythm':        'natural rhythm on serve',
    'rally tolerance':     'patience and consistency in rallies',
  }
  const key = strength.toLowerCase()
  return map[key] ?? strength
}

function buildParentSummary(
  firstName: string,
  levelName: string,
  stageKey: CurriculumStage,
  strengths: string[],
  topPriorities: ReturnType<typeof getTopPriorities>,
  plan: ThirtyDayPlan,
): {
  summary: string
  developmentFocus: string
  nextSteps: string[]
  thirtyDayPreview: string
} {
  const stageLang = STAGE_PARENT_LANGUAGE[stageKey] ?? STAGE_PARENT_LANGUAGE['orange_development']

  const parentStrengths = strengths.slice(0, 3).map(parentFriendlyStrength)
  const strengthsText = parentStrengths.length > 0
    ? `${firstName} showed ${parentStrengths.join(', ')}.`
    : `${firstName} completed the assessment and is ready to begin training.`

  const summary =
    `${firstName} has completed their initial assessment and has been placed in our ${stageLang.stageName} programme at ${levelName}. ` +
    strengthsText + ` ` +
    `We are excited to build on these foundations and support ${firstName}'s continued growth as a tennis player.`

  const developmentFocus =
    `${firstName}'s primary development focus in the coming weeks will be on ${topPriorities.skill.label.toLowerCase()} and ` +
    `building ${topPriorities.mental.label.toLowerCase()}. These are the areas that will have the most positive impact ` +
    `on ${firstName}'s enjoyment and progress at the ${stageLang.stageName} level.`

  const nextSteps = [
    `Attend sessions regularly — consistency is the most important factor at this stage.`,
    `Encourage ${firstName} to ask their coach one question each session.`,
    `Support ${firstName} to practise with focus at home if they enjoy it — but enjoyment comes first.`,
  ]

  const thirtyDayPreview =
    `Over the first 30 days, your coach will focus on helping ${firstName} with ` +
    `${plan.skillFocus.toLowerCase()}, ${plan.competitionFocus.toLowerCase()}, ` +
    `and ${plan.mentalFocus.toLowerCase()}. ` +
    `These three areas were selected to give ${firstName} the best possible start at the ${stageLang.stageName} level ` +
    `and set the foundation for progress toward ${stageLang.nextStagePreview}.`

  return { summary, developmentFocus, nextSteps, thirtyDayPreview }
}

// ── DONNA Brief Builder ───────────────────────────────────────────────────────

function buildDonnaBrief(
  firstName: string,
  lastName: string,
  levelName: string,
  stageKey: CurriculumStage,
  strengths: string[],
  gaps: string[],
  priorities: BlueprintPriorities,
  plan: ThirtyDayPlan,
): string {
  const top3Strengths = strengths.slice(0, 3).join(', ') || 'to be assessed'
  const top3Gaps      = gaps.slice(0, 3).join(', ') || 'to be identified'

  return [
    `BLUEPRINT SUMMARY — ${firstName} ${lastName} — ${levelName} (${stageKey.replace(/_/g, ' ')})`,
    ``,
    `STRENGTHS: ${top3Strengths}`,
    `DEVELOPMENT AREAS: ${top3Gaps}`,
    ``,
    `SKILL PRIORITY 1: ${priorities.skill[0].label} — ${priorities.skill[0].description}`,
    `SKILL PRIORITY 2: ${priorities.skill[1].label}`,
    `SKILL PRIORITY 3: ${priorities.skill[2].label}`,
    ``,
    `COMPETITION PRIORITY 1: ${priorities.competition[0].label} — ${priorities.competition[0].description}`,
    `FITNESS PRIORITY 1: ${priorities.fitness[0].label} — ${priorities.fitness[0].description}`,
    `MENTAL PRIORITY 1: ${priorities.mental[0].label} — ${priorities.mental[0].description}`,
    ``,
    `FIRST 30 DAYS: Skill — ${plan.skillFocus} | Competition — ${plan.competitionFocus} | Fitness — ${plan.fitnessFocus} | Mental — ${plan.mentalFocus}`,
    ``,
    `WHY THIS PLACEMENT: Based on ${stageKey.replace(/_/g, ' ')} assessment. See full blueprint for score breakdown.`,
  ].join('\n')
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate the complete player development blueprint.
 * Pure function — deterministic, no side effects.
 */
export function generateBlueprint(input: BlueprintInput): GeneratedBlueprint {
  const priorities = generateBlueprintPriorities(input.scores, input.curriculumStageKey)
  const topPriorities = getTopPriorities(priorities)
  const stageLabel = input.curriculumLevelName

  const thirtyDayPlan = buildThirtyDayPlan(topPriorities, input.scores, stageLabel)

  const missions = generateInitialMissions(priorities, input.curriculumLevelName)

  const { brief: coachBrief, focusAreas: coachFocusAreas } = buildCoachBrief(
    input.playerFirstName,
    input.playerLastName,
    input.curriculumLevelName,
    input.strengths,
    input.gaps,
    topPriorities,
  )

  const {
    summary: parentSummary,
    developmentFocus: parentDevelopmentFocus,
    nextSteps: parentNextSteps,
    thirtyDayPreview: parentThirtyDayPreview,
  } = buildParentSummary(
    input.playerFirstName,
    input.curriculumLevelName,
    input.curriculumStageKey,
    input.strengths,
    topPriorities,
    thirtyDayPlan,
  )

  const donnaBrief = buildDonnaBrief(
    input.playerFirstName,
    input.playerLastName,
    input.curriculumLevelName,
    input.curriculumStageKey,
    input.strengths,
    input.gaps,
    priorities,
    thirtyDayPlan,
  )

  return {
    priorities,
    thirtyDayPlan,
    initialMissions:          missions,
    coachBrief,
    coachFocusAreas,
    parentSummary,
    parentDevelopmentFocus,
    parentNextSteps,
    parentThirtyDayPreview,
    donnaBrief,
    strengths:                input.strengths,
    gaps:                     input.gaps,
  }
}
