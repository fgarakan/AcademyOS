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
