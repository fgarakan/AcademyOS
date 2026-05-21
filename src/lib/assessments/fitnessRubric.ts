// Sprint 577 — Fitness Assessment Rubric V1
// Rubric bands and scoring criteria for the Physical Capability domain.
// Language is non-medical and capability-focused (on-court observations only).
// Pure TypeScript — no DB calls, no AI calls, no side effects.

import type { AssessmentRubricBand } from './index'

export type FitnessRubricCategory =
  | 'movement_quality'
  | 'on_court_endurance'
  | 'recovery_speed'
  | 'coordination_and_balance'
  | 'strength_and_power_output'

export interface FitnessRubricItem {
  itemId: string
  category: FitnessRubricCategory
  name: string
  coachPrompt: string
  observationCues: string[]
  isRequired: boolean
  playerFacingLabel: string
}

// Non-medical bands — all language is on-court observable capability
export const FITNESS_RUBRIC_BANDS: AssessmentRubricBand[] = [
  {
    bandId: 'fit_1',
    label: 'Building basics',
    minScore: 1,
    maxScore: 2,
    description: 'Player is building foundational on-court movement patterns. Short sessions recommended.',
    coachNotes: 'Keep sessions under 45 min. Prioritise fun and movement basics. Avoid high-volume drills.',
    indicativeLevel: 'Red 1–2',
  },
  {
    bandId: 'fit_2',
    label: 'Developing endurance',
    minScore: 3,
    maxScore: 4,
    description: 'Player sustains effort for 45–60 min sessions. Some fatigue visible in later drills.',
    coachNotes: 'Introduce recovery intervals. Monitor effort levels in extended drills.',
    indicativeLevel: 'Orange 1–2',
  },
  {
    bandId: 'fit_3',
    label: 'Solid on-court capability',
    minScore: 5,
    maxScore: 6,
    description: 'Player maintains quality movement for 60–75 min. Handles standard drill load without visible drop-off.',
    coachNotes: 'Add directional change drills. Introduce short sprint recovery sequences.',
    indicativeLevel: 'Orange 3 – Green 1',
  },
  {
    bandId: 'fit_4',
    label: 'Match-fit',
    minScore: 7,
    maxScore: 8,
    description: 'Player sustains high-quality movement across 90-min sessions and 2-hour matches. Recovers quickly between points.',
    coachNotes: 'Introduce match-length simulations. On-court conditioning drills with intentional recovery.',
    indicativeLevel: 'Green 2–3',
  },
  {
    bandId: 'fit_5',
    label: 'High on-court capability',
    minScore: 9,
    maxScore: 10,
    description: 'Player maintains elite movement quality across full match and training loads. Explosive recovery steps consistently.',
    coachNotes: 'Periodise load around match schedule. Integrate speed and power training.',
    indicativeLevel: 'Yellow / High Performance',
  },
]

export const FITNESS_RUBRIC_ITEMS: FitnessRubricItem[] = [
  {
    itemId: 'fit_mq_001',
    category: 'movement_quality',
    name: 'Lateral movement fluency',
    coachPrompt: 'Observe lateral shuffle across the baseline — note smoothness, balance, and foot speed.',
    observationCues: ['Steps are controlled, not crossing', 'Shoulders stay level', 'Stops cleanly without stumbling'],
    isRequired: true,
    playerFacingLabel: 'Moving side to side',
  },
  {
    itemId: 'fit_mq_002',
    category: 'movement_quality',
    name: 'Split step and first-step',
    coachPrompt: 'Feed alternating balls — observe if player uses a split step and pushes off in the correct direction.',
    observationCues: ['Split step before ball contact', 'First step is directional, not sideways', 'Reaches wide balls with balance'],
    isRequired: true,
    playerFacingLabel: 'Reacting and moving to the ball',
  },
  {
    itemId: 'fit_oe_001',
    category: 'on_court_endurance',
    name: 'Sustained effort across a drill block',
    coachPrompt: 'After 30 min of drilling, observe movement quality — does effort and speed drop significantly?',
    observationCues: ['Maintains rally pace', 'Footwork quality consistent vs. early drills', 'Recovers between ball feeds'],
    isRequired: true,
    playerFacingLabel: 'Keeping energy through the session',
  },
  {
    itemId: 'fit_rs_001',
    category: 'recovery_speed',
    name: 'Between-point recovery',
    coachPrompt: 'Watch 10 points in a practice match — observe how quickly player resets to ready position.',
    observationCues: ['Returns to centre within 3 steps', 'Bouncing or stepping in place at ready', 'Not walking between points'],
    isRequired: false,
    playerFacingLabel: 'Resetting between points',
  },
  {
    itemId: 'fit_cb_001',
    category: 'coordination_and_balance',
    name: 'Overhead coordination',
    coachPrompt: 'Lob 5 balls — observe ability to track, move back, and contact above head with balance.',
    observationCues: ['Moves back with crossover or shuffle', 'Contact at highest reachable point', 'Does not fall off balance after hit'],
    isRequired: false,
    playerFacingLabel: 'Tracking overhead balls',
  },
  {
    itemId: 'fit_sp_001',
    category: 'strength_and_power_output',
    name: 'Serve and groundstroke pace',
    coachPrompt: 'Observe serve speed (subjective) and groundstroke pace on full swings — does the ball travel with intention?',
    observationCues: ['Generates pace beyond ball toss/drop', 'Groundstrokes consistently reach back fence', 'Serve travels with arc and pace'],
    isRequired: false,
    playerFacingLabel: 'Hitting with pace and intention',
  },
]

export const FITNESS_CATEGORY_LABELS: Record<FitnessRubricCategory, string> = {
  movement_quality: 'Movement Quality',
  on_court_endurance: 'On-Court Endurance',
  recovery_speed: 'Recovery Speed',
  coordination_and_balance: 'Coordination & Balance',
  strength_and_power_output: 'Pace & Power Output',
}

export function getFitnessBandForScore(score: number): AssessmentRubricBand | null {
  return FITNESS_RUBRIC_BANDS.find(b => score >= b.minScore && score <= b.maxScore) ?? null
}

export function getRequiredFitnessItems(): FitnessRubricItem[] {
  return FITNESS_RUBRIC_ITEMS.filter(i => i.isRequired)
}

export function getFitnessItemsByCategory(category: FitnessRubricCategory): FitnessRubricItem[] {
  return FITNESS_RUBRIC_ITEMS.filter(i => i.category === category)
}
