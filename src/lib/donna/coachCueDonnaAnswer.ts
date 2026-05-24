// Sprint 739 -- DONNA Coach Execution Suggestion Engine V1
// Provides context-specific coaching cues and execution suggestions based on
// level, drill type, block type, or session focus.
// Coach cues are internal only -- never exposed to parents or players.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// -- Pattern detection --------------------------------------------------------

const COACH_CUE_PATTERNS =
  /\b(coach(ing)? (tips?|cues?|guidance|suggestions?|advice|focus|notes?|prompts?)|how (should|do|can) (i|coaches?) (coach|teach|run|deliver|cue)|execution (tips?|guidance|notes?)|what (should|do) coaches? (focus on|watch for|look for|observe|say|do)|teach(ing)? tips?|coaching (orange|red|yellow|high.?perf|level \d+))\b/i

const BLOCK_TYPE_CUE_PATTERNS =
  /\b(warm.?up|rally|point.?play|match.?play|technical|fitness|coordination|agility|speed)\b.{0,30}\b(cue|tip|focus|guidance|coach)\b|\b(coach|cue|tip|focus|guidance)\b.{0,30}\b(warm.?up|rally|point.?play|match.?play|technical|fitness|coordination|agility|speed)\b/i

export function isCoachCueQuestion(text: string): boolean {
  return COACH_CUE_PATTERNS.test(text) || BLOCK_TYPE_CUE_PATTERNS.test(text)
}

// -- Level key extraction (reuses pattern from curriculumLevelDonnaAnswer) ----

function extractLevelStage(text: string): string | null {
  const t = text.toLowerCase()
  if (/\bred\b/.test(t))    return 'red'
  if (/\borange\b/.test(t)) return 'orange'
  if (/\byellow\b/.test(t)) return 'yellow'
  if (/\bhp\b|\bhigh.?perf/.test(t)) return 'hp'
  return null
}

function extractBlockType(text: string): string | null {
  const t = text.toLowerCase()
  if (/warm.?up/.test(t)) return 'warm_up'
  if (/rally/.test(t))    return 'rally'
  if (/point.?play/.test(t)) return 'point_play'
  if (/match.?play|match\b/.test(t)) return 'match_play'
  if (/technical|technique/.test(t)) return 'technical'
  if (/fitness|conditioning/.test(t)) return 'fitness'
  if (/agility/.test(t))  return 'agility'
  if (/speed|sprint/.test(t)) return 'speed'
  if (/coordination|balance/.test(t)) return 'coordination'
  return null
}

// -- Static coaching cue banks ------------------------------------------------
// Level-stage coaching focus areas (internal -- not for parents or players).

const STAGE_COACHING_FOCUS: Record<string, string[]> = {
  red: [
    '**Contact quality first**: Watch for clean bat-to-ball contact. Reinforce hand-eye connection before worrying about technique.',
    '**Movement over mechanics**: At this stage, movement patterns (split step, recovery, court positioning) are more important than perfect swing mechanics.',
    '**Short rally targets**: Celebrate 3-ball rallies. Consistency targets should be achievable -- build confidence, not frustration.',
    '**Positive reinforcement**: Use specific praise ("Great split step!") rather than generic ("Good job!"). Name what they did right.',
    '**Energy and pace**: Red stage sessions should feel active and fun. If energy drops, change the drill format -- not the intensity expectation.',
  ],
  orange: [
    '**Contact point awareness**: Reinforce correct contact point for forehand and backhand. This is the most teachable window for fixing mechanics.',
    '**Recovery step habit**: After every shot, ask "Did you reset?" -- the recovery step to the middle of the court. Make this automatic.',
    '**Pattern repetition**: Choose 1-2 tactical patterns per session and repeat them across multiple drill formats. Don\'t introduce new patterns every drill.',
    '**Competitive engagement**: Orange players respond to scoring, games, and challenges. Build competition into every session block.',
    '**Serve mechanics window**: Orange 2-3 is when serve mechanics are most effectively developed. Allocate dedicated time -- 10-15 min per session.',
  ],
  yellow: [
    '**Tactical communication**: Start asking players to verbalize their tactical intent before the point. "Where are you going?" trains match awareness.',
    '**Error analysis**: Distinguish between unforced errors (decision-making) and forced errors (execution under pressure). Coach differently for each.',
    '**Point construction**: Reinforce the serve+1, return+1 pattern before expecting free-flowing tactics. Most yellow players rush pattern setup.',
    '**Competitive pressure**: Run drills with real-score consequences. "Win 3 in a row to rotate" is more effective than unlimited repetitions.',
    '**Second serve consistency**: Many yellow players avoid net approaches because their second serve is exploitable. Prioritize second serve mechanics early.',
  ],
  hp: [
    '**Film and data**: Coaching decisions at HP level should reference match data, not just practice observation. Use score patterns to identify tactical trends.',
    '**Opposition modeling**: Introduce opponent-specific patterns. "How do you play someone who chips and charges?" requires pre-match preparation, not just drill.',
    '**Process over outcome**: HP players often fixate on scores. Redirect to pattern execution: "Did you get to your first ball position?" not "Did you win the point?"',
    '**Physical load monitoring**: At HP level, training load monitoring is essential. Adjust session intensity based on recent match schedule.',
    '**Mental performance integration**: Pre-point routines, between-point reset protocols, and match-score mindset should be explicit coaching targets, not assumed skills.',
  ],
}

// Block-type coaching cues (same as templateDraftDonnaAnswer but more detailed)

const BLOCK_TYPE_COACHING_CUES: Record<string, string[]> = {
  warm_up: [
    '**Athletic stance check**: Look for wide base, knees bent, weight forward before the drill begins. Reset any passive posture.',
    '**Split step timing**: Reinforce split step as opponent contacts the ball -- not as ball crosses the net.',
    '**Activation quality**: Watch for players going through the motions. Warm-up should elevate heart rate and activate the correct movement patterns.',
  ],
  rally: [
    '**Recovery step every time**: After each ball -- regardless of how good the shot was -- the player must reset. Enforce this consistently.',
    '**Target clarity**: Give players a specific target zone, not just "cross-court." Vague targets produce vague shots.',
    '**Ball-tracking cue**: Remind players to watch the ball to the strings, not track where they want to hit. Contact quality improves when vision is correct.',
  ],
  point_play: [
    '**Decision before contact**: Ask players to decide on their tactic before the ball arrives. "What are you doing with this ball?" -- not after the error.',
    '**Risk/reward awareness**: Point out when a player takes a low-percentage shot in a neutral position. Reinforce the "when to attack" decision.',
    '**Pressure response**: Watch how players respond to being behind in a point. That\'s where the tactical development work is.',
  ],
  match_play: [
    '**Between-point observation**: The value in match play is watching between-point behavior. Look for reset quality, body language, and communication with themselves.',
    '**Pattern vs. chance**: Ask players after points: "Was that a pattern you set up, or did you just react?" Builds tactical self-awareness.',
    '**Score management**: Note how player behavior changes at critical scores (3-all, tie-break). That\'s where mental skills become visible.',
  ],
  technical: [
    '**Slow then fast**: Demonstrate the correct technique at slow speed, then progressively build. Don\'t start at full pace with a technical drill.',
    '**Checkpoints not corrections**: Tell players what to feel (contact point, hip rotation) not just what to fix ("Your elbow is wrong"). Proprioception cues stick better.',
    '**Repetition count**: Technical drills need high repetition to build motor patterns. 20+ quality reps before adding ball variation.',
  ],
  fitness: [
    '**Form over speed**: Especially at the start of the fitness block -- observe form before pushing pace. Reinforce proper mechanics while fresh.',
    '**Work-to-rest ratio**: Ensure rest intervals are adequate for the energy system you\'re developing. Speed work needs full recovery; conditioning work uses shorter rests.',
    '**Transfer the language**: Connect each fitness block explicitly to tennis. "This acceleration drill is your first step to a wide forehand" makes the fitness relevant.',
  ],
  agility: [
    '**Deceleration technique**: Most agility injuries occur on deceleration, not acceleration. Reinforce braking mechanics -- low center of gravity, wide base on the stop.',
    '**Sharp cuts**: Cue players to plant the outside foot and drive out at a lower angle. High center of gravity produces inefficient direction changes.',
    '**Reset to neutral**: After each agility rep, player should return to neutral stance before the next rep. Fatigue accumulates in posture.',
  ],
  speed: [
    '**First step explosiveness**: Watch for a "dead" first step. Cue players to load their split step so the first step is reactive, not intentional.',
    '**Arm drive**: Correct arm mechanics improve acceleration significantly at all levels. Elbows at 90 degrees, drive hands from hip to chin.',
    '**Short acceleration windows**: Most tennis speed is 3-7 steps. Design speed drills in that range, not long sprint distances.',
  ],
  coordination: [
    '**Accuracy over speed**: In coordination drills, accuracy comes first. Players who rush coordination tasks never develop clean patterns.',
    '**Vary the challenge**: Coordination patterns need increasing complexity to develop. Add ball tosses, reaction cues, or secondary tasks after the base pattern is learned.',
    '**Connection to tennis**: Always explain what on-court movement this coordination work mirrors. Players perform better when they see the relevance.',
  ],
}

// -- Answer builders ----------------------------------------------------------

function buildLevelCoachingCuesAnswer(stage: string): DonnaSafeReadAnswer {
  const cues = STAGE_COACHING_FOCUS[stage]
  if (!cues) return buildGenericCoachCueAnswer()

  const stageLabel: Record<string, string> = {
    red: 'Red stage (mini tennis)',
    orange: 'Orange stage (development)',
    yellow: 'Yellow stage (performance)',
    hp: 'High Performance stage',
  }

  const cueLines = cues.join('\n\n')

  return {
    actionId: `coach_cue_${stage}_stage`,
    text: [
      `**Coaching focus -- ${stageLabel[stage] ?? stage}:**`,
      '',
      cueLines,
      '',
      'These cues are internal coaching guidance only -- not visible to parents or players. You can attach specific cues to drills and gates in the Curriculum Builder.',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Standard AcademyOS coaching cue library',
    followUp: 'Take me to Curriculum Builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

function buildBlockTypeCoachingCuesAnswer(blockType: string): DonnaSafeReadAnswer {
  const cues = BLOCK_TYPE_COACHING_CUES[blockType]
  if (!cues) return buildGenericCoachCueAnswer()

  const blockLabel: Record<string, string> = {
    warm_up: 'Warm-Up block',
    rally: 'Rally Skills block',
    point_play: 'Point Play block',
    match_play: 'Match Play block',
    technical: 'Technical block',
    fitness: 'Fitness block',
    agility: 'Agility block',
    speed: 'Speed block',
    coordination: 'Coordination block',
  }

  const cueLines = cues.join('\n\n')

  return {
    actionId: `coach_cue_${blockType}_block`,
    text: [
      `**Coaching execution -- ${blockLabel[blockType] ?? blockType}:**`,
      '',
      cueLines,
      '',
      'Execution cues are internal only and should not be shared directly with parents or players. You can add these as coach notes on session blocks.',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Standard AcademyOS coaching cue library',
    followUp: null,
    href: null,
    isAnswerable: true,
  }
}

function buildGenericCoachCueAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'coach_cue_generic',
    text: [
      'I can give you coaching cues for any stage or block type:',
      '',
      '• For stage-specific cues: "Coaching tips for Orange players" or "How should I coach Yellow 2?"',
      '• For block-type cues: "Coach cues for rally drills" or "Execution tips for point play"',
      '• For mixed sessions: "I have Orange 2 and Orange 1 -- how do I run this?"',
      '',
      'You can also attach cues to specific drills and gates in the Curriculum Builder.',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'AcademyOS coaching cue guidance',
    followUp: 'Take me to Curriculum Builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 739).
// Returns null if the text is not a coach cue / execution question.

export function tryAnswerCoachCueQuestion(text: string): DonnaSafeReadAnswer | null {
  if (!isCoachCueQuestion(text)) return null

  const blockType = extractBlockType(text)
  if (blockType && BLOCK_TYPE_COACHING_CUES[blockType]) {
    return buildBlockTypeCoachingCuesAnswer(blockType)
  }

  const stage = extractLevelStage(text)
  if (stage && STAGE_COACHING_FOCUS[stage]) {
    return buildLevelCoachingCuesAnswer(stage)
  }

  return buildGenericCoachCueAnswer()
}
