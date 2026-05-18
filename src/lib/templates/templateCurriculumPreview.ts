// curriculum-derived demo preview — not saved — not applied

export interface CurriculumLevelPreview {
  level: string
  levelGoal: string
  skillPathwayFocus: string
  competitionPathwayFocus: string
  assessmentGatesCount: number
  recommendedTemplateType: string
}

export const CURRICULUM_LEVEL_PREVIEWS: CurriculumLevelPreview[] = [
  {
    level: 'Red Ball 1',
    levelGoal: 'Introduce basic racket control, cooperative rally, and fundamental movement patterns',
    skillPathwayFocus: 'Grip, swing path, and cooperative mini-court rallying',
    competitionPathwayFocus: 'Red Ball mini-court cooperative play and simple scoring',
    assessmentGatesCount: 3,
    recommendedTemplateType: 'Short cooperative session (45–60 min)',
  },
  {
    level: 'Red Ball 2',
    levelGoal: 'Build rally consistency, introduce directional intent, and establish footwork habits',
    skillPathwayFocus: 'Forehand and backhand direction, split-step introduction',
    competitionPathwayFocus: 'Red Ball team games and first-to-5 point formats',
    assessmentGatesCount: 4,
    recommendedTemplateType: 'Skill-plus-game session (60 min)',
  },
  {
    level: 'Red Ball 3',
    levelGoal: 'Establish reliable groundstrokes, serve introduction, and transition to Orange Ball court',
    skillPathwayFocus: 'Serve mechanics, rally-to-win consistency, defensive positioning',
    competitionPathwayFocus: 'Red Ball tournament formats and team competition',
    assessmentGatesCount: 5,
    recommendedTemplateType: 'Technical-plus-match-play session (60–75 min)',
  },
  {
    level: 'Orange Ball 1',
    levelGoal: 'Develop open-stance groundstrokes, serve-and-return fundamentals, and net introduction',
    skillPathwayFocus: 'Open stance forehand, two-handed backhand, first volley',
    competitionPathwayFocus: 'Orange Ball singles format, short-court tournaments',
    assessmentGatesCount: 5,
    recommendedTemplateType: 'Technical drill session (60 min)',
  },
  {
    level: 'Orange Ball 2',
    levelGoal: 'Build rally consistency from both sides, introduce tactical intent, and develop serve reliability',
    skillPathwayFocus: 'Cross-court and down-the-line rally, second serve introduction',
    competitionPathwayFocus: 'Orange Ball singles and doubles, directional match play',
    assessmentGatesCount: 6,
    recommendedTemplateType: 'Pattern-based session (75 min)',
  },
  {
    level: 'Orange Ball 3',
    levelGoal: 'Establish point construction principles and transition toward full-court play',
    skillPathwayFocus: 'Approach shot, pass or lob choice, net approach patterns',
    competitionPathwayFocus: 'Orange Ball tournament readiness, full-court format introduction',
    assessmentGatesCount: 6,
    recommendedTemplateType: 'Tactical session with match play (75–90 min)',
  },
  {
    level: 'Green Ball 1',
    levelGoal: 'Introduce full-court singles play, serve tactics, and transition from orange to standard ball',
    skillPathwayFocus: 'Groundstroke depth, serve placement (T, body, wide), return positioning',
    competitionPathwayFocus: 'Green Ball singles, beginner tournament format',
    assessmentGatesCount: 6,
    recommendedTemplateType: 'Technical-to-tactical bridge session (75 min)',
  },
  {
    level: 'Green Ball 2',
    levelGoal: 'Build pattern play, deepen serve-and-return tactics, and strengthen competitive mentality',
    skillPathwayFocus: 'Forehand inside-out pattern, slice backhand, serve-plus-one',
    competitionPathwayFocus: 'Green Ball tournaments, sets play, score management',
    assessmentGatesCount: 7,
    recommendedTemplateType: 'Pattern-plus-competitive session (90 min)',
  },
  {
    level: 'Green Ball 3',
    levelGoal: 'Transition to full yellow ball play with solid tactical foundation and match-play confidence',
    skillPathwayFocus: 'Point construction, high-percentage patterns, mental reset routines',
    competitionPathwayFocus: 'Green Ball to yellow ball transition tournaments',
    assessmentGatesCount: 7,
    recommendedTemplateType: 'Competitive match-play session (90 min)',
  },
  {
    level: 'Yellow Ball 1',
    levelGoal: 'Establish full-court game with reliable serve, return, and baseline patterns',
    skillPathwayFocus: 'Flat and topspin groundstrokes, spin serve, doubles positioning',
    competitionPathwayFocus: 'USTA 10U/12U entry-level tournaments',
    assessmentGatesCount: 7,
    recommendedTemplateType: 'Full-court technical session (90 min)',
  },
  {
    level: 'Yellow Ball 2',
    levelGoal: 'Deepen tactical sophistication, develop second serve tactics, and build pressure patterns',
    skillPathwayFocus: 'Second serve tactics, approach-and-volley, high-ball defense',
    competitionPathwayFocus: 'USTA 12U/14U regional tournaments',
    assessmentGatesCount: 8,
    recommendedTemplateType: 'Tactical pattern session (90–120 min)',
  },
  {
    level: 'Yellow Ball 3',
    levelGoal: 'Build match-play confidence, handle pressure situations, and develop individual game style',
    skillPathwayFocus: 'Signature patterns, tactical adjustments, opponent-reading',
    competitionPathwayFocus: 'USTA 14U sectional tournament preparation',
    assessmentGatesCount: 8,
    recommendedTemplateType: 'Competitive match-play session (120 min)',
  },
  {
    level: 'High Performance 1',
    levelGoal: 'Establish high-performance training habits, advanced patterns, and competition-level fitness',
    skillPathwayFocus: 'Advanced serve mechanics, return tactics, net dominance',
    competitionPathwayFocus: 'USTA 16U/18U sectional and national tournaments',
    assessmentGatesCount: 9,
    recommendedTemplateType: 'High-intensity technical session (120 min)',
  },
  {
    level: 'High Performance 2',
    levelGoal: 'Sharpen competitive edge, develop serve-as-a-weapon, and build tactical identity',
    skillPathwayFocus: 'Weapon identification, serve-plus-one dominance, pressure point execution',
    competitionPathwayFocus: 'USTA national tournaments, ITF juniors entry',
    assessmentGatesCount: 9,
    recommendedTemplateType: 'Elite tactical session with match simulation (120–150 min)',
  },
  {
    level: 'High Performance 3',
    levelGoal: 'Tournament readiness, professional-grade physical conditioning, and elite mental skills',
    skillPathwayFocus: 'Match-play decision-making, fatigue management, style adaptation',
    competitionPathwayFocus: 'ITF juniors, college recruitment preparation',
    assessmentGatesCount: 10,
    recommendedTemplateType: 'Elite competition prep session (150 min)',
  },
]

const PREVIEW_MAP = new Map(
  CURRICULUM_LEVEL_PREVIEWS.map(p => [p.level, p])
)

export function getCurriculumLevelPreview(level: string): CurriculumLevelPreview | null {
  return PREVIEW_MAP.get(level) ?? null
}

// Stage groups used to derive session goals and block structure
export type BallStage = 'Red Ball' | 'Orange Ball' | 'Green Ball' | 'Yellow Ball' | 'High Performance'

// Key type that maps to curriculumBlockRecommendations.CurriculumStage
export type BlockStageKey =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'

export function getCurriculumStage(level: string): BallStage | null {
  if (level.startsWith('Red Ball')) return 'Red Ball'
  if (level.startsWith('Orange Ball')) return 'Orange Ball'
  if (level.startsWith('Green Ball')) return 'Green Ball'
  if (level.startsWith('Yellow Ball')) return 'Yellow Ball'
  if (level.startsWith('High Performance')) return 'High Performance'
  return null
}

export function toBlockStageKey(stage: BallStage): BlockStageKey {
  const map: Record<BallStage, BlockStageKey> = {
    'Red Ball': 'red_foundation',
    'Orange Ball': 'orange_development',
    'Green Ball': 'green_performance',
    'Yellow Ball': 'yellow_competitive',
    'High Performance': 'high_performance',
  }
  return map[stage]
}

// Session duration guidance per stage
export const SESSION_DURATION_BY_STAGE: Record<BallStage, string> = {
  'Red Ball': '45 – 60 min',
  'Orange Ball': '60 – 75 min',
  'Green Ball': '75 – 90 min',
  'Yellow Ball': '90 – 120 min',
  'High Performance': '120 – 150 min',
}

// Curriculum drill suggestions keyed by [stage][block_type]
export const CURRICULUM_DRILLS_BY_STAGE: Record<BallStage, Record<string, string[]>> = {
  'Red Ball': {
    warm_up: ['Mini footwork ladder', 'Skip and hop relay', 'Cooperative toss and catch'],
    technical: ['Feed-and-catch rally', 'Grip check drill', 'Contact point shadow swing'],
    tactical: ['Target cone game', 'Directional mini-court game'],
    physical: ['Animal walks circuit', 'Reaction game with cones'],
    match_play: ['First-to-3 mini-court game', 'Cooperative rally challenge'],
    cool_down: ['Gentle shake-out stretch', 'Circle team huddle'],
  },
  'Orange Ball': {
    warm_up: ['Split-step ladder', 'Shadow footwork drill', 'Mini cooperative rally 5-in-a-row'],
    technical: ['Cross-court consistency feed', 'Down-the-line rally target', 'Contact zone cones'],
    tactical: ['Open court game', 'Cross-court vs down-the-line decision'],
    physical: ['Bodyweight strength circuit', 'Court sprint 4-point drill'],
    match_play: ['First-to-5 points short-court', 'Serve-and-return game'],
    cool_down: ['Static partner stretch', 'Team debrief one-word win'],
  },
  'Green Ball': {
    warm_up: ['Dynamic stretch + split-step', 'Baseline shadow movement', 'Light rally warm-up'],
    technical: ['Serve placement — T, body, wide', 'Return-plus-one pattern', 'Approach + first volley'],
    tactical: ['Serve-plus-one pattern play', 'Pass-or-lob decision drill', 'Pattern game: open court or down the line'],
    physical: ['Court sprint + change of direction', 'Agility ladder tennis footwork'],
    match_play: ['Pressure tiebreak 7-point', 'Sets play with score management'],
    cool_down: ['Active recovery rally', 'Session debrief: what improved'],
  },
  'Yellow Ball': {
    warm_up: ['Serve warm-up routine', 'Court positioning + shadow', 'Light rally building pace'],
    technical: ['Inside-out forehand pattern', 'Kick serve target drill', 'Slice approach + volley'],
    tactical: ['Serve-plus-one dominance drill', 'Second serve tactics game', 'Match-play scenario: 0-30 down'],
    physical: ['Periodized sprint interval', 'Agility + strength circuit'],
    match_play: ['Full set play', 'Pressure scoring: only winner wins point'],
    cool_down: ['Structured cool-down', 'RPE + one-sentence session feedback'],
  },
  'High Performance': {
    warm_up: ['Individualized activation protocol', 'Serve + return warm-up', 'Movement priming sequence'],
    technical: ['Weapon sharpening drill: high-margin execution', 'Multi-ball precision feeding', 'Pattern refinement under pace'],
    tactical: ['Opponent-specific game plan drill', 'Situational tiebreak scenarios', 'Elite serve plus one at pace'],
    physical: ['Periodized sprint mechanics', 'Injury prevention circuit', 'Load tracking + strength work'],
    match_play: ['Consequence scoring match', 'Full set with coach debrief after each game', 'Pressure tiebreaks at match pace'],
    cool_down: ['Recovery protocol', 'RPE + session feedback + load note'],
  },
}

export function getCurriculumDrillsForBlock(stage: BallStage, blockType: string): string[] {
  return CURRICULUM_DRILLS_BY_STAGE[stage]?.[blockType] ?? []
}

// Coach watch-fors keyed by [stage][block_type]
export const CURRICULUM_WATCH_FORS_BY_STAGE: Record<BallStage, Record<string, string[]>> = {
  'Red Ball': {
    warm_up: ['Players grip loosely — correct before drill begins', 'Watch for anxiety; keep energy light and playful'],
    technical: ['Contact point must be in front of body', 'Racket face angle — flat or slight topspin only at this stage'],
    tactical: ['Celebrate directional intent, not just success'],
    physical: ['No overloading — keep circuits short and fun'],
    match_play: ['Enforce cooperative scoring before competitive scoring'],
    cool_down: ['Every player leaves with one success moment named aloud'],
  },
  'Orange Ball': {
    warm_up: ['Split-step landing — both feet, not one', 'Recovery to neutral position after every shadow swing'],
    technical: ['Unit turn before contact — not just arm swing', 'Open stance forehand: hip rotation drives the shot'],
    tactical: ['Cross-court rally: contact point must stay in front', 'Decision point: direction chose before ball crosses net'],
    physical: ['Short-burst intervals only — no extended sprints at this stage'],
    match_play: ['Point play: emphasize process over outcome', 'Serve: toss height and placement before power'],
    cool_down: ['Each player states one specific improvement — not "it was good"'],
  },
  'Green Ball': {
    warm_up: ['Serve warm-up: shoulder turn, trophy position, pronation', 'Split-step must happen before every incoming ball'],
    technical: ['Approach shot: low-to-high, close to the line', 'First volley: firm wrist, block not swing'],
    tactical: ['Pattern play: identify the play before starting the point', 'Transition: does player split-step at the service line?'],
    physical: ['Court sprint: decelerate and reset — not just sprint and stop'],
    match_play: ['Pressure tiebreak: pre-point routine matters — watch for it', 'Sets play: is player adjusting tactics between games?'],
    cool_down: ['Debrief: one tactical decision they made well, one to improve'],
  },
  'Yellow Ball': {
    warm_up: ['Pre-match routine: is it the same every session? Build the habit.', 'Serve warm-up: target placement, not just warm-up rallying'],
    technical: ['Inside-out forehand: hip opens before contact', 'Kick serve: toss position over left shoulder (right-hander)'],
    tactical: ['Serve-plus-one: is the pattern being executed, not improvised?', 'Pressure points: does the player tighten or open up?'],
    physical: ['Load management: note if player looks fatigued early — flag for debrief'],
    match_play: ['Self-coaching under pressure: are they adjusting or panicking?', 'Consequence scoring: mental response to adversity'],
    cool_down: ['RPE score + one tactical note for next session'],
  },
  'High Performance': {
    warm_up: ['Activation protocol: individual, not group — any deviation?', 'Serve warm-up timing and pace — consistent with match cadence?'],
    technical: ['Weapon drill: is the margin of error improving session-over-session?', 'Multi-ball: is decision-making happening before ball arrives?'],
    tactical: ['Game plan execution: is player running their plan, not opponent\'s?', 'Situational: response to adversity — process or emotional?'],
    physical: ['Load note: rating and any flags for conditioning staff'],
    match_play: ['Match pace: is practice pace matching competition pace?', 'Consequence scoring: real competition mindset, not training mindset'],
    cool_down: ['Individual debrief: one weapon sharpened, one area targeted for next session'],
  },
}

export function getWatchForsForBlock(stage: BallStage, blockType: string): string[] {
  return CURRICULUM_WATCH_FORS_BY_STAGE[stage]?.[blockType] ?? []
}

// Assessment gates supported by templates at each stage
export interface SupportedGate {
  gateLabel: string
  description: string
  blockHint: string
}

export const SUPPORTED_GATES_BY_STAGE: Record<BallStage, SupportedGate[]> = {
  'Red Ball': [
    { gateLabel: 'Cooperative rally — 5 in a row', description: 'Player maintains 5 cooperative rallies on mini court', blockHint: 'technical or match_play block' },
    { gateLabel: 'Grip check — two-handed forehand grip', description: 'Correct grip observed by coach in 3+ reps', blockHint: 'technical block' },
    { gateLabel: 'Ready position — returns to neutral', description: 'Player recovers to ready position after every shot', blockHint: 'warm_up or technical block' },
  ],
  'Orange Ball': [
    { gateLabel: 'Cross-court consistency — 6 in a row', description: 'Six controlled cross-court rallies in succession', blockHint: 'technical block' },
    { gateLabel: 'Serve placement — lands in box', description: 'Serve lands in correct service box 4 of 5 attempts', blockHint: 'match_play block' },
    { gateLabel: 'Split-step before incoming ball', description: 'Split-step observed on 7 of 10 incoming balls', blockHint: 'warm_up or technical block' },
    { gateLabel: 'Wide-ball recovery into crosscourt rally', description: 'Player recovers and redirects crosscourt after wide ball', blockHint: 'tactical block' },
  ],
  'Green Ball': [
    { gateLabel: 'Approach shot down the line', description: 'Approach shot hits within 1 metre of the sideline', blockHint: 'technical block' },
    { gateLabel: 'Serve-plus-one pattern executed', description: 'Player executes a planned serve-plus-one 3 of 5 attempts', blockHint: 'tactical or match_play block' },
    { gateLabel: 'Pressure tiebreak — manages score', description: 'Player maintains composure in a 7-point pressure tiebreak', blockHint: 'match_play block' },
  ],
  'Yellow Ball': [
    { gateLabel: 'Inside-out forehand — hits target', description: 'Inside-out forehand hits the target cone 4 of 6 attempts', blockHint: 'technical block' },
    { gateLabel: 'Second serve — kick lands in box', description: 'Kick serve lands in correct box 5 of 7 attempts', blockHint: 'technical block' },
    { gateLabel: 'Match-play decision under pressure', description: 'Correct tactical decision made in 0-30 pressure scenario', blockHint: 'match_play block' },
  ],
  'High Performance': [
    { gateLabel: 'Serve weapon — 3 consecutive placement targets', description: 'Serve hits T, body, wide targets consecutively at match pace', blockHint: 'technical or match_play block' },
    { gateLabel: 'Match-play: executes game plan', description: 'Director observes consistent game plan execution over 6 games', blockHint: 'match_play block' },
    { gateLabel: 'Adversity response — resets within one game', description: 'Player applies reset protocol and wins next game after losing a set', blockHint: 'match_play block' },
  ],
}

export function getSupportedGatesForStage(stage: BallStage): SupportedGate[] {
  return SUPPORTED_GATES_BY_STAGE[stage] ?? []
}

// Player mission suggestions (player-safe wording) per stage
export interface PlayerMission {
  missionLabel: string
  playerSafeWording: string
  linkedGoal: string
}

export const PLAYER_MISSIONS_BY_STAGE: Record<BallStage, PlayerMission[]> = {
  'Red Ball': [
    { missionLabel: 'Rally 5 in a row', playerSafeWording: 'Try to keep the rally going for 5 shots without stopping', linkedGoal: 'Cooperative rally consistency' },
    { missionLabel: 'Hit the target zone', playerSafeWording: 'Aim your shot inside the orange cone triangle', linkedGoal: 'Directional intent introduction' },
  ],
  'Orange Ball': [
    { missionLabel: 'Cross-court 6 in a row', playerSafeWording: 'Keep the ball going cross-court 6 times with your partner', linkedGoal: 'Cross-court consistency' },
    { missionLabel: 'Split-step before every ball', playerSafeWording: 'Do your little jump every time before hitting — your coach will watch', linkedGoal: 'Movement foundation' },
    { missionLabel: 'Serve into the box 4 of 5', playerSafeWording: 'Land your serve inside the lines 4 times out of 5 tries', linkedGoal: 'Serve reliability' },
  ],
  'Green Ball': [
    { missionLabel: 'Approach down the line + finish', playerSafeWording: 'When the ball is short, go forward and finish the point at the net', linkedGoal: 'Approach shot pattern' },
    { missionLabel: 'Run your serve-plus-one plan', playerSafeWording: 'Before each point, decide: where do you serve and where does the next ball go?', linkedGoal: 'Tactical planning' },
  ],
  'Yellow Ball': [
    { missionLabel: 'Execute your inside-out pattern', playerSafeWording: 'Set up and hit your inside-out forehand 4 out of 6 attempts', linkedGoal: 'Signature shot development' },
    { missionLabel: 'Stay in your process under pressure', playerSafeWording: 'When you are 0-30, follow your pre-point routine and do not rush', linkedGoal: 'Mental resilience' },
  ],
  'High Performance': [
    { missionLabel: 'Run your game plan for 3 sets', playerSafeWording: 'Play your game plan for the full session — ask your coach to track your decisions', linkedGoal: 'Tactical identity execution' },
    { missionLabel: 'Reset after every lost game', playerSafeWording: 'After you lose a game, use your reset routine and win the next one', linkedGoal: 'Adversity management' },
  ],
}

export function getPlayerMissionsForStage(stage: BallStage): PlayerMission[] {
  return PLAYER_MISSIONS_BY_STAGE[stage] ?? []
}

export const GOALS_BY_STAGE: Record<BallStage, string[]> = {
  'Red Ball': [
    'Cooperative rally — 5 consecutive on mini court',
    'Grip and swing path fundamentals',
    'Split-step and ready position',
    'Forehand direction — cross-court target',
    'Serve introduction — underhand or overarm toss',
  ],
  'Orange Ball': [
    'Baseline consistency from both sides',
    'Serve mechanics and placement',
    'Net approach and first volley',
    'Rally cooperative — 8 in a row full court',
    'Point play introduction with scoring',
  ],
  'Green Ball': [
    'Serve-and-return patterns on full court',
    'Down-the-line forehand pattern',
    'Net approach + pass or lob choice',
    'Match tactics: open court strategy',
    'Sets play and score management',
  ],
  'Yellow Ball': [
    'Inside-out forehand pattern',
    'Second serve tactics and spin',
    'Approach + passing shot combination',
    'Pressure patterns from baseline',
    'Point construction off the serve',
  ],
  'High Performance': [
    'Serve-plus-one patterns under pressure',
    'Return-of-serve dominance',
    'Match-play decision making at pace',
    'Mental resilience under fatigue',
    'Tactical identity and weapon development',
  ],
}
