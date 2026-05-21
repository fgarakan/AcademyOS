// Sprint 575 — Skill Assessment Rubric V1
// Rubric bands and scoring criteria for the Skill & Technique domain.
// Used in new player intake and ongoing assessment events.
// Pure TypeScript — no DB calls, no AI calls, no side effects.

import type { AssessmentRubricBand } from './index'

export type SkillRubricCategory =
  | 'groundstrokes'
  | 'serve_return'
  | 'net_play'
  | 'footwork'
  | 'rally_consistency'

export interface SkillRubricItem {
  itemId: string
  category: SkillRubricCategory
  name: string
  coachPrompt: string
  observationCues: string[]
  isRequired: boolean
  playerFacingLabel: string
}

export interface SkillCategoryScore {
  category: SkillRubricCategory
  score: number
  notes: string
}

export const SKILL_RUBRIC_BANDS: AssessmentRubricBand[] = [
  {
    bandId: 'skill_1',
    label: 'Foundation',
    minScore: 1,
    maxScore: 2,
    description: 'Player is beginning to develop basic stroke patterns. Requires significant guided repetition.',
    coachNotes: 'Focus on grip, stance, and basic swing path. Do not introduce tactics yet.',
    indicativeLevel: 'Red 1–2',
  },
  {
    bandId: 'skill_2',
    label: 'Developing',
    minScore: 3,
    maxScore: 4,
    description: 'Player shows emerging consistency on cooperative drills. Errors reduce with lower-compression ball.',
    coachNotes: 'Introduce rally patterns. Reinforce preparation and recovery steps.',
    indicativeLevel: 'Orange 1–2',
  },
  {
    bandId: 'skill_3',
    label: 'Applying',
    minScore: 5,
    maxScore: 6,
    description: 'Player applies strokes reliably in practice conditions. Beginning to select shots with basic intention.',
    coachNotes: 'Introduce directional targets and serve+1 patterns. Rally consistency drills.',
    indicativeLevel: 'Orange 3 – Green 1',
  },
  {
    bandId: 'skill_4',
    label: 'Performing',
    minScore: 7,
    maxScore: 8,
    description: 'Player uses full technique in match-play scenarios. Beginning to adjust based on opponent patterns.',
    coachNotes: 'Add tactical layer: depth, pace variation, approach shot decisions.',
    indicativeLevel: 'Green 2–3',
  },
  {
    bandId: 'skill_5',
    label: 'Advanced',
    minScore: 9,
    maxScore: 10,
    description: 'Player executes reliably under pressure, adjusts within points, shows shot construction.',
    coachNotes: 'Focus on point-ending patterns, serve+2, net approach sequences.',
    indicativeLevel: 'Yellow / High Performance',
  },
]

export const SKILL_RUBRIC_ITEMS: SkillRubricItem[] = [
  {
    itemId: 'skill_gs_001',
    category: 'groundstrokes',
    name: 'Forehand consistency',
    coachPrompt: 'Rally 10 balls crosscourt — count consistent strikes (bounces in court, good contact).',
    observationCues: ['Unit turn present', 'Contact point in front', 'Follow-through complete'],
    isRequired: true,
    playerFacingLabel: 'Forehand in rallies',
  },
  {
    itemId: 'skill_gs_002',
    category: 'groundstrokes',
    name: 'Backhand consistency',
    coachPrompt: 'Rally 10 balls crosscourt backhand — count consistent strikes.',
    observationCues: ['Grip change visible', 'Early preparation', 'Balanced finish'],
    isRequired: true,
    playerFacingLabel: 'Backhand in rallies',
  },
  {
    itemId: 'skill_sr_001',
    category: 'serve_return',
    name: 'Serve direction',
    coachPrompt: 'Hit 6 serves — note contact height, basic direction, and landing zone.',
    observationCues: ['Ball toss consistent', 'Contact above shoulder', 'Lands in service box'],
    isRequired: true,
    playerFacingLabel: 'Serving into the box',
  },
  {
    itemId: 'skill_sr_002',
    category: 'serve_return',
    name: 'Return of serve',
    coachPrompt: 'Return 6 moderate serves — note split step and basic redirection.',
    observationCues: ['Split step before serve lands', 'Early backswing', 'Returns in play'],
    isRequired: false,
    playerFacingLabel: 'Returning serves',
  },
  {
    itemId: 'skill_np_001',
    category: 'net_play',
    name: 'Volley technique',
    coachPrompt: 'Feed 8 volleys from mid-court — note compact swing and positioning.',
    observationCues: ['Short take-back', 'Moves forward to ball', 'Continental grip'],
    isRequired: false,
    playerFacingLabel: 'Volleys at the net',
  },
  {
    itemId: 'skill_fw_001',
    category: 'footwork',
    name: 'Recovery step pattern',
    coachPrompt: 'Alternate wide feeds — observe split step, lateral push, and recovery.',
    observationCues: ['Split step present', 'Cross-step or side-step lateral', 'Returns to centre'],
    isRequired: true,
    playerFacingLabel: 'Moving and recovering',
  },
  {
    itemId: 'skill_rc_001',
    category: 'rally_consistency',
    name: 'Cooperative rally count',
    coachPrompt: 'Count consecutive shots in a controlled crosscourt rally — target 10+.',
    observationCues: ['Maintains rally rhythm', 'Adjusts pace/spin to keep ball in play', 'Communicates partner-style effort'],
    isRequired: true,
    playerFacingLabel: 'Keeping rallies going',
  },
]

export const SKILL_CATEGORY_LABELS: Record<SkillRubricCategory, string> = {
  groundstrokes: 'Groundstrokes',
  serve_return: 'Serve / Return',
  net_play: 'Net Play',
  footwork: 'Footwork',
  rally_consistency: 'Rally Consistency',
}

export function getSkillBandForScore(score: number): AssessmentRubricBand | null {
  return SKILL_RUBRIC_BANDS.find(b => score >= b.minScore && score <= b.maxScore) ?? null
}

export function getRequiredSkillItems(): SkillRubricItem[] {
  return SKILL_RUBRIC_ITEMS.filter(i => i.isRequired)
}

export function getSkillItemsByCategory(category: SkillRubricCategory): SkillRubricItem[] {
  return SKILL_RUBRIC_ITEMS.filter(i => i.category === category)
}

export function computeSkillDomainScore(categoryScores: SkillCategoryScore[]): number {
  if (categoryScores.length === 0) return 0
  const sum = categoryScores.reduce((acc, s) => acc + s.score, 0)
  return Math.round((sum / categoryScores.length) * 10) / 10
}
