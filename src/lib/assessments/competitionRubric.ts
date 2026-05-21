// Sprint 576 — Competition Assessment Rubric V1
// Rubric bands and scoring criteria for the Competition Readiness domain.
// Covers match experience, scoring knowledge, tactical awareness, and competitive behaviour.
// Pure TypeScript — no DB calls, no AI calls, no side effects.

import type { AssessmentRubricBand } from './index'

export type CompetitionRubricCategory =
  | 'match_experience'
  | 'rules_and_scoring'
  | 'tactical_awareness'
  | 'competitive_behaviour'
  | 'match_management'

export interface CompetitionRubricItem {
  itemId: string
  category: CompetitionRubricCategory
  name: string
  coachPrompt: string
  observationCues: string[]
  isRequired: boolean
  playerFacingLabel: string
}

export const COMPETITION_RUBRIC_BANDS: AssessmentRubricBand[] = [
  {
    bandId: 'comp_1',
    label: 'No match experience',
    minScore: 1,
    maxScore: 2,
    description: 'Player has not played organised matches. Learning basic rules and point structure.',
    coachNotes: 'Introduce cooperative match-play simulations, simple scoring practice.',
    indicativeLevel: 'Red 1–2',
  },
  {
    bandId: 'comp_2',
    label: 'Match play beginner',
    minScore: 3,
    maxScore: 4,
    description: 'Player has limited match experience. Understands basic scoring. Needs tactical introduction.',
    coachNotes: 'Use internal practice matches. Introduce play-to-win versus play-to-develop mindsets.',
    indicativeLevel: 'Orange 1–2',
  },
  {
    bandId: 'comp_3',
    label: 'Developing competitor',
    minScore: 5,
    maxScore: 6,
    description: 'Player competes in local/club events. Has a basic tactical plan. Manages scores independently.',
    coachNotes: 'Work on point patterns from serve and return. Introduce pre-match preparation routines.',
    indicativeLevel: 'Orange 3 – Green 1',
  },
  {
    bandId: 'comp_4',
    label: 'Consistent competitor',
    minScore: 7,
    maxScore: 8,
    description: 'Player competes regularly in regional events. Adjusts game plan mid-match. Handles adversity.',
    coachNotes: 'Match analysis, opponent tendencies, closing sets, return game strategy.',
    indicativeLevel: 'Green 2–3',
  },
  {
    bandId: 'comp_5',
    label: 'Advanced competitor',
    minScore: 9,
    maxScore: 10,
    description: 'Player competes at national or high regional level. Executes tactical patterns under match pressure.',
    coachNotes: 'Advanced match management, peak performance preparation, match scheduling.',
    indicativeLevel: 'Yellow / High Performance',
  },
]

export const COMPETITION_RUBRIC_ITEMS: CompetitionRubricItem[] = [
  {
    itemId: 'comp_me_001',
    category: 'match_experience',
    name: 'Matches played (approximate)',
    coachPrompt: 'Ask player/parent: approx. how many organised matches have they played in the last 12 months?',
    observationCues: ['0 = no experience', '1–10 = limited', '11–30 = developing', '30+ = established'],
    isRequired: true,
    playerFacingLabel: 'Match experience',
  },
  {
    itemId: 'comp_rs_001',
    category: 'rules_and_scoring',
    name: 'Scoring knowledge',
    coachPrompt: 'Ask player: how do you win a set? What happens at deuce? How do you call a let?',
    observationCues: ['Knows points (15/30/40)', 'Understands games/sets/match', 'Can explain deuce/ad'],
    isRequired: true,
    playerFacingLabel: 'Knowing the rules',
  },
  {
    itemId: 'comp_ta_001',
    category: 'tactical_awareness',
    name: 'Basic tactical intention',
    coachPrompt: 'Play a 5-point practice game — observe if player targets crosscourt or adapts to opponent position.',
    observationCues: ['Moves opponent deliberately', 'Plays to open court', 'Uses net approach'],
    isRequired: false,
    playerFacingLabel: 'Playing smart in points',
  },
  {
    itemId: 'comp_cb_001',
    category: 'competitive_behaviour',
    name: 'Between-point composure',
    coachPrompt: 'Observe during a simulated match — note body language and reset behaviour after errors or lost points.',
    observationCues: ['Does not show extended frustration', 'Maintains effort after lost points', 'Positive or neutral reset'],
    isRequired: true,
    playerFacingLabel: 'Staying composed in matches',
  },
  {
    itemId: 'comp_mm_001',
    category: 'match_management',
    name: 'Self-management in match',
    coachPrompt: 'Can the player manage their own towel time, call scores, and request balls without coach involvement?',
    observationCues: ['Calls score correctly', 'Manages pace of play', 'Uses towel/recovery time'],
    isRequired: false,
    playerFacingLabel: 'Running their own match',
  },
]

export const COMPETITION_CATEGORY_LABELS: Record<CompetitionRubricCategory, string> = {
  match_experience: 'Match Experience',
  rules_and_scoring: 'Rules & Scoring',
  tactical_awareness: 'Tactical Awareness',
  competitive_behaviour: 'Competitive Behaviour',
  match_management: 'Match Management',
}

export function getCompetitionBandForScore(score: number): AssessmentRubricBand | null {
  return COMPETITION_RUBRIC_BANDS.find(b => score >= b.minScore && score <= b.maxScore) ?? null
}

export function getRequiredCompetitionItems(): CompetitionRubricItem[] {
  return COMPETITION_RUBRIC_ITEMS.filter(i => i.isRequired)
}

export function getCompetitionItemsByCategory(category: CompetitionRubricCategory): CompetitionRubricItem[] {
  return COMPETITION_RUBRIC_ITEMS.filter(i => i.category === category)
}
