// Sprint 739 -- DONNA Session Adjustment Suggestions Engine V1
// Suggests session modifications based on player level mix in a class.
// Handles both "I have a mix of levels" context and asks for player info when missing.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// -- Pattern detection --------------------------------------------------------

const SESSION_ADJUST_PATTERNS =
  /\b(adjust|modify|tweak|change|adapt).{0,30}\b(session|class|practice)\b/i

const LEVEL_MIX_PATTERNS =
  /\b(mix|mixed|different|multiple|various).{0,20}\b(levels?|groups?)\b/i

const PLAYER_LEVEL_IN_SESSION_PATTERNS =
  /\b(i have|there.?s|there are|session (has|with)|class (has|with)).{0,30}\b(red|orange|yellow|green|high.?perf|level \d+)\b/i

const SESSION_SUGGESTION_PATTERNS =
  /\b(what (should|would|can) i|how (should|can) i|suggest|recommendation|advice).{0,40}\b(session|class|different levels?|level mix|players?)\b/i

export function isSessionAdjustmentQuestion(text: string): boolean {
  return (
    SESSION_ADJUST_PATTERNS.test(text) ||
    LEVEL_MIX_PATTERNS.test(text) ||
    PLAYER_LEVEL_IN_SESSION_PATTERNS.test(text) ||
    SESSION_SUGGESTION_PATTERNS.test(text)
  )
}

// -- Level extraction from text -----------------------------------------------

type LevelStage = 'red' | 'orange' | 'yellow' | 'hp'

interface LevelPresence {
  stage: LevelStage
  sublevel: string   // e.g., "1", "2", "3"
  label: string      // e.g., "Orange 2"
}

const LEVEL_PATTERNS: Array<{ pattern: RegExp; stage: LevelStage; sublevel: string; label: string }> = [
  { pattern: /\bred.?1\b/i,     stage: 'red',    sublevel: '1', label: 'Red 1' },
  { pattern: /\bred.?2\b/i,     stage: 'red',    sublevel: '2', label: 'Red 2' },
  { pattern: /\bred.?3\b/i,     stage: 'red',    sublevel: '3', label: 'Red 3' },
  { pattern: /\borange.?1\b/i,  stage: 'orange', sublevel: '1', label: 'Orange 1' },
  { pattern: /\borange.?2\b/i,  stage: 'orange', sublevel: '2', label: 'Orange 2' },
  { pattern: /\borange.?3\b/i,  stage: 'orange', sublevel: '3', label: 'Orange 3' },
  { pattern: /\byellow.?1\b/i,  stage: 'yellow', sublevel: '1', label: 'Yellow 1' },
  { pattern: /\byellow.?2\b/i,  stage: 'yellow', sublevel: '2', label: 'Yellow 2' },
  { pattern: /\byellow.?3\b/i,  stage: 'yellow', sublevel: '3', label: 'Yellow 3' },
  { pattern: /\bhp.?1\b|\bhigh.?perf.?1\b/i, stage: 'hp', sublevel: '1', label: 'HP 1' },
  { pattern: /\bhp.?2\b|\bhigh.?perf.?2\b/i, stage: 'hp', sublevel: '2', label: 'HP 2' },
  { pattern: /\bhp.?3\b|\bhigh.?perf.?3\b/i, stage: 'hp', sublevel: '3', label: 'HP 3' },
  // Generic stage mentions
  { pattern: /\bred\b/i,    stage: 'red',    sublevel: '2', label: 'Red' },
  { pattern: /\borange\b/i, stage: 'orange', sublevel: '2', label: 'Orange' },
  { pattern: /\byellow\b/i, stage: 'yellow', sublevel: '2', label: 'Yellow' },
]

function extractLevelsFromText(text: string): LevelPresence[] {
  const found: LevelPresence[] = []
  const seen = new Set<string>()

  for (const { pattern, stage, sublevel, label } of LEVEL_PATTERNS) {
    if (pattern.test(text) && !seen.has(label)) {
      seen.add(label)
      found.push({ stage, sublevel, label })
    }
  }

  return found
}

// -- Adjustment suggestions ---------------------------------------------------

const STAGE_ORDER: Record<LevelStage, number> = { red: 1, orange: 2, yellow: 3, hp: 4 }

function buildMixedLevelAdjustments(levels: LevelPresence[]): string[] {
  const stageSet: LevelStage[] = []
  for (const l of levels) {
    if (!stageSet.includes(l.stage)) stageSet.push(l.stage)
  }
  const stages = stageSet
  const isCrossStage = stages.length > 1

  const suggestions: string[] = []

  if (isCrossStage) {
    const sorted = [...levels].sort(
      (a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || parseInt(a.sublevel) - parseInt(b.sublevel),
    )
    const lowest = sorted[0]
    const highest = sorted[sorted.length - 1]

    suggestions.push(
      `**Anchor the session at ${lowest.label} level** -- start drills that ${lowest.label} players can succeed at, then add complexity layers for ${highest.label} players.`,
      `**Use split-court time** -- have advanced players (${highest.label}) practice at the baseline while ${lowest.label} players work in the service box, then rotate.`,
      `**Pair players intentionally** -- pair a ${highest.label} player with a ${lowest.label} player for rally practice. The advanced player develops patience and consistency; the developing player gets exposure to faster patterns.`,
      `**Give role-based feedback** -- cue ${lowest.label} players on ball contact; cue ${highest.label} players on tactical execution of the same drill.`,
    )
  } else {
    // Same stage, different sub-levels
    suggestions.push(
      `**Use progression sets** -- run the same drill with Level 1 starting at a basic version and Level 3 adding more challenge (target zones, extra balls, reduced recovery time).`,
      `**Challenge the advanced players** -- add constraints for higher sub-levels (e.g., must hit to a target, must win 2 in a row to score) while keeping the base drill accessible.`,
      `**Watch fatigue carefully** -- sub-level gaps within the same stage often show up as pace differences, not technical gaps. Higher-level players may need longer rally sequences.`,
    )
  }

  suggestions.push(
    '**Review the session template** -- if mixed-level groups are common, consider building a multi-level template in the Curriculum Builder with built-in progression notes.',
  )

  return suggestions
}

// -- Answer builders ----------------------------------------------------------

function buildMixedLevelAnswer(levels: LevelPresence[]): DonnaSafeReadAnswer {
  const levelNames = levels.map(l => l.label).join(', ')
  const adjustments = buildMixedLevelAdjustments(levels)

  const text = [
    `**Session adjustments for a ${levelNames} mix:**`,
    '',
    adjustments.join('\n\n'),
    '',
    'These suggestions do not change the official session plan -- they are coaching guidance only. If you want to create a template designed for mixed-level groups, I can draft one for your review.',
  ].join('\n')

  return {
    actionId: 'session_adjustment_mixed_levels',
    text,
    confidence: 'high',
    sourceNote: 'Session adjustment guidance based on level mix in text',
    followUp: 'Draft a mixed-level template',
    href: '/director/class-templates',
    isAnswerable: true,
  }
}

function buildAskForLevelMixAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'session_adjustment_ask_levels',
    text: 'I can suggest specific session adjustments based on who is in the class. Tell me the level mix -- for example, "I have two Orange 2 players and one Orange 1" -- and I\'ll give you concrete modification suggestions.',
    confidence: 'partial',
    sourceNote: 'Player level context needed for adjustment suggestions',
    followUp: 'Show me the Sessions page',
    href: '/director/sessions',
    isAnswerable: true,
  }
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 739).
// Returns null if the text is not a session adjustment question.

export function tryAnswerSessionAdjustmentQuestion(text: string): DonnaSafeReadAnswer | null {
  if (!isSessionAdjustmentQuestion(text)) return null

  const levels = extractLevelsFromText(text)

  if (levels.length >= 2) {
    return buildMixedLevelAnswer(levels)
  }

  if (levels.length === 1) {
    // Single level mentioned -- context exists but no mix to adjust for
    return {
      actionId: 'session_adjustment_single_level',
      text: `For a single-level ${levels[0].label} class, the standard template for that level should work well. If you have players at different sub-levels within ${levels[0].label}, I can suggest adjustments -- just tell me the mix (e.g., "two ${levels[0].label} and one ${levels[0].stage === 'orange' ? 'Orange 1' : levels[0].stage === 'yellow' ? 'Yellow 1' : 'lower level'}").`,
      confidence: 'partial',
      sourceNote: 'Single level detected -- no mixed-level adjustments needed',
      followUp: null,
      href: null,
      isAnswerable: true,
    }
  }

  // No levels mentioned -- ask for context
  return buildAskForLevelMixAnswer()
}
