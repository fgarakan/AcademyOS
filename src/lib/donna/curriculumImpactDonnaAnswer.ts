// Sprint 738 -- DONNA Curriculum Impact Explanation Engine V1
// Answers questions about downstream impact before curriculum or template changes.
// Surfaces buildImpactEstimate() estimates conversationally when change type is clear.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// -- Types --------------------------------------------------------------------

// Mirrors ImpactEstimate from impactEstimateHelper.ts -- defined here to avoid
// pulling in the component-side import chain.
type CurriculumChangeType =
  | 'add_drill'
  | 'add_gate'
  | 'add_fitness'
  | 'modify_gate'
  | 'remove_drill'
  | 'add_mission'
  | 'rewrite_level'

interface ImpactEstimate {
  changeType: CurriculumChangeType
  playersAffected: number
  levelsAffected: number
  estimatedRolloutWeeks: number
}

// -- Pattern detection --------------------------------------------------------

const IMPACT_PATTERNS =
  /\b(what (happens?|would happen|changes?|would change)|impact of|impact on|downstream|affect|effect of|before (i|we) (change|add|remove|update|modify)|if (i|we) (add|remove|change|update|modify|rewrite))\b.{0,50}\b(drill|gate|level|curriculum|skill|mission|fitness|template|requirement)\b/i

const CHANGE_TYPE_PATTERNS: Array<{ pattern: RegExp; changeType: CurriculumChangeType; label: string }> = [
  { pattern: /\b(add|adding).{0,20}\bdrill\b/i,      changeType: 'add_drill',     label: 'adding a drill' },
  { pattern: /\b(add|adding).{0,20}\bgate\b/i,       changeType: 'add_gate',      label: 'adding a gate' },
  { pattern: /\b(add|adding).{0,20}\bfitness\b/i,    changeType: 'add_fitness',   label: 'adding a fitness block' },
  { pattern: /\b(modify|update|change).{0,20}\bgate\b/i, changeType: 'modify_gate', label: 'modifying a gate' },
  { pattern: /\b(remove|delete|drop).{0,20}\bdrill\b/i, changeType: 'remove_drill', label: 'removing a drill' },
  { pattern: /\b(add|adding).{0,20}\bmission\b/i,    changeType: 'add_mission',   label: 'adding a mission' },
  { pattern: /\b(rewrite|overhaul|redesign).{0,20}\blevel\b/i, changeType: 'rewrite_level', label: 'rewriting a level' },
]

export function isCurriculumImpactQuestion(text: string): boolean {
  return IMPACT_PATTERNS.test(text)
}

// -- Level size estimation (conservative estimate without live DB data) --------
// Uses stage-based player count estimate: earlier stages have more players.
// Directors with live data see actual counts via the curriculum page.

const STAGE_PLAYER_ESTIMATES: Record<string, number> = {
  red:   12,  // more beginners at early stages
  orange: 10,
  yellow:  8,
  hp:      4,
}

function estimatePlayersFromText(text: string): number {
  const t = text.toLowerCase()
  if (/\bred\b/.test(t))    return STAGE_PLAYER_ESTIMATES.red
  if (/\borange\b/.test(t)) return STAGE_PLAYER_ESTIMATES.orange
  if (/\byellow\b/.test(t)) return STAGE_PLAYER_ESTIMATES.yellow
  if (/\bhp\b|\bhigh.?perf/.test(t)) return STAGE_PLAYER_ESTIMATES.hp
  return 8  // fallback conservative estimate
}

// -- Impact estimates (mirrors impactEstimateHelper logic) --------------------

const ROLLOUT_WEEKS: Record<CurriculumChangeType, number> = {
  add_drill:     1,
  add_gate:      2,
  add_fitness:   1,
  modify_gate:   2,
  remove_drill:  1,
  add_mission:   1,
  rewrite_level: 3,
}

function estimateImpact(changeType: CurriculumChangeType, playersAtLevel: number): ImpactEstimate {
  let playersAffected = playersAtLevel
  let levelsAffected = 1

  if (changeType === 'add_gate' || changeType === 'modify_gate') {
    // Gate affects players approaching from below too
    playersAffected = Math.round(playersAtLevel * 1.2)
  } else if (changeType === 'rewrite_level') {
    levelsAffected = 2
    playersAffected = playersAtLevel * 2
  }

  return {
    changeType,
    playersAffected,
    levelsAffected,
    estimatedRolloutWeeks: ROLLOUT_WEEKS[changeType],
  }
}

// -- Change type labels -------------------------------------------------------

const CHANGE_LABELS: Record<CurriculumChangeType, string> = {
  add_drill:     'Adding a drill',
  add_gate:      'Adding a gate',
  add_fitness:   'Adding a fitness block',
  modify_gate:   'Modifying a gate',
  remove_drill:  'Removing a drill',
  add_mission:   'Adding a mission',
  rewrite_level: 'Rewriting a level',
}

// -- Answer builders ----------------------------------------------------------

function buildImpactAnswer(
  impact: ImpactEstimate,
  changeLabel: string,
  levelContext: string,
): DonnaSafeReadAnswer {
  const levelNote = levelContext ? ` at ${levelContext}` : ''
  const playerWord = impact.playersAffected === 1 ? 'player' : 'players'
  const levelWord = impact.levelsAffected === 1 ? 'level' : 'levels'
  const weekWord = impact.estimatedRolloutWeeks === 1 ? 'week' : 'weeks'

  const urgencyNote =
    impact.changeType === 'rewrite_level'
      ? 'A level rewrite is the highest-impact change in the curriculum system -- it affects all players at that level and the adjacent level above. Plan carefully and review all existing gates and drills before proposing.'
      : impact.changeType === 'add_gate' || impact.changeType === 'modify_gate'
        ? 'Gate changes directly affect level movement decisions. Make sure the new gate is observable, coach-measurable, and consistently achievable before adding it.'
        : impact.changeType === 'remove_drill'
          ? 'Removing a drill affects coaches who may reference it in existing session templates. Check for active template links before removing.'
          : 'This is a lower-risk change that typically does not disrupt existing player pathways.'

  return {
    actionId: `curriculum_impact_${impact.changeType}`,
    text: [
      `**Impact estimate: ${changeLabel}${levelNote}**`,
      '',
      `• ~${impact.playersAffected} ${playerWord} affected`,
      `• ${impact.levelsAffected} ${levelWord} in scope`,
      `• ~${impact.estimatedRolloutWeeks} ${weekWord} to roll out (estimated)`,
      '',
      urgencyNote,
      '',
      'This is an estimate -- actual impact depends on your live roster. All changes are proposed drafts and require your review and approval before anything takes effect. Want me to take you to the Curriculum Builder to draft the change?',
    ].join('\n'),
    confidence: 'partial',
    sourceNote: 'Estimated impact -- no live roster data in current context',
    followUp: 'Take me to Curriculum Builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

function buildGenericImpactAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'curriculum_impact_generic',
    text: [
      '**Before making curriculum changes, here is what to consider:**',
      '',
      '• **Players affected**: How many players are currently at this level? Gate changes can affect everyone approaching from below.',
      '• **Rollout time**: Drills take ~1 week to roll out; gate changes take ~2 weeks; level rewrites take ~3 weeks.',
      '• **Downstream links**: Check if existing templates reference drills or skills you are modifying.',
      '• **Coach readiness**: Coaches need to understand the change before it shows up in session planning.',
      '',
      'All curriculum changes are proposed drafts -- nothing takes effect until you approve in the Review Center. To get a specific impact estimate, tell me what you want to change (e.g., "What happens if I add a gate to Orange 2?").',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Curriculum impact framework',
    followUp: 'Take me to Curriculum Builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 738).
// Returns null if the text is not an impact question.

export function tryAnswerCurriculumImpactQuestion(text: string): DonnaSafeReadAnswer | null {
  if (!isCurriculumImpactQuestion(text)) return null

  // Detect what change type the director is asking about
  for (const { pattern, changeType, label } of CHANGE_TYPE_PATTERNS) {
    if (pattern.test(text)) {
      const players = estimatePlayersFromText(text)
      const impact = estimateImpact(changeType, players)
      // Extract level context for the answer
      const levelMatch = text.match(/\b(red|orange|yellow|high.?perf(ormance)?|hp).?\d?\b/i)
      const levelContext = levelMatch ? levelMatch[0] : ''
      return buildImpactAnswer(impact, label, levelContext)
    }
  }

  // Generic impact guidance when change type is not detected
  return buildGenericImpactAnswer()
}
