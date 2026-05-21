// Sprint 578 — Mental Performance Assessment Rubric V1
// Rubric bands and scoring criteria for the Mental Performance domain.
// Draws from the existing mentalPerformance.ts model but scoped for assessment events.
// Pure TypeScript — no DB calls, no AI calls, no side effects.

import type { AssessmentRubricBand } from './index'
import type { MentalPerformanceDomain } from '@/lib/curriculum/mentalPerformance'

export type MentalRubricCategory =
  | 'error_response'
  | 'pressure_behaviour'
  | 'effort_and_body_language'
  | 'self_talk_observable'
  | 'routine_and_preparation'

export interface MentalRubricItem {
  itemId: string
  category: MentalRubricCategory
  name: string
  coachPrompt: string
  observationCues: string[]
  mappedDomain: MentalPerformanceDomain
  isRequired: boolean
  playerFacingLabel: string
  parentFacingLabel: string
}

export const MENTAL_RUBRIC_BANDS: AssessmentRubricBand[] = [
  {
    bandId: 'mental_1',
    label: 'Emerging awareness',
    minScore: 1,
    maxScore: 2,
    description: 'Player shows limited awareness of mental game patterns. Reactions to errors or pressure are largely unmanaged.',
    coachNotes: 'Introduce basic error-response conversations. Normalise mistakes as part of learning.',
    indicativeLevel: 'Red 1–2',
  },
  {
    bandId: 'mental_2',
    label: 'Developing self-regulation',
    minScore: 3,
    maxScore: 4,
    description: 'Player is beginning to use simple reset strategies. Inconsistent — works in low-pressure situations.',
    coachNotes: 'Reinforce reset routine. Use post-error body language as a coaching conversation starter.',
    indicativeLevel: 'Orange 1–2',
  },
  {
    bandId: 'mental_3',
    label: 'Applying mental skills',
    minScore: 5,
    maxScore: 6,
    description: 'Player uses observable routines and maintains composure in most situations. Still fragile under match pressure.',
    coachNotes: 'Pressure-point practice simulations. Encourage player to describe their routine.',
    indicativeLevel: 'Orange 3 – Green 1',
  },
  {
    bandId: 'mental_4',
    label: 'Consistent mental game',
    minScore: 7,
    maxScore: 8,
    description: 'Player applies mental skills in match play. Maintains composure on high-pressure points. Bounces back from setbacks.',
    coachNotes: 'Work on match management (when to speed up/slow down), constructive self-talk audits.',
    indicativeLevel: 'Green 2–3',
  },
  {
    bandId: 'mental_5',
    label: 'Advanced mental performance',
    minScore: 9,
    maxScore: 10,
    description: 'Player competes with high-level mental discipline. Adapts mindset to match context. Manages long matches and adversity.',
    coachNotes: 'Advanced competition preparation, pre-match planning, post-match mental debrief.',
    indicativeLevel: 'Yellow / High Performance',
  },
]

export const MENTAL_RUBRIC_ITEMS: MentalRubricItem[] = [
  {
    itemId: 'mental_er_001',
    category: 'error_response',
    name: 'Response to unforced errors',
    coachPrompt: 'Observe 20 minutes of play — count/note instances of extended visible frustration after own errors.',
    observationCues: ['Returns to position within 5 seconds', 'No extended racket drop or negative gesture', 'Body language stays ready'],
    mappedDomain: 'resilience_and_recovery',
    isRequired: true,
    playerFacingLabel: 'Bouncing back after mistakes',
    parentFacingLabel: 'How they recover after errors',
  },
  {
    itemId: 'mental_pb_001',
    category: 'pressure_behaviour',
    name: 'Behaviour on pressure points',
    coachPrompt: 'Simulate a deuce or set point — observe technique and decision-making vs. earlier in the session.',
    observationCues: ['Does not rush serve or return', 'Uses a tactical shot (not panic)', 'No visible freeze or hesitation'],
    mappedDomain: 'pressure_management',
    isRequired: true,
    playerFacingLabel: 'Playing well on the big points',
    parentFacingLabel: 'Staying calm under pressure',
  },
  {
    itemId: 'mental_ef_001',
    category: 'effort_and_body_language',
    name: 'Sustained effort and body language',
    coachPrompt: 'Observe effort level in the final 20 min of session — does player show full effort with positive/neutral body language?',
    observationCues: ['Sprint effort on wide balls', 'Positive or neutral body posture', 'Communicates and engages with coach'],
    mappedDomain: 'process_orientation',
    isRequired: true,
    playerFacingLabel: 'Staying focused and giving full effort',
    parentFacingLabel: 'Effort and attitude in training',
  },
  {
    itemId: 'mental_st_001',
    category: 'self_talk_observable',
    name: 'Observable self-talk',
    coachPrompt: 'Note any audible self-talk or visible self-coaching — is it constructive, neutral, or negative?',
    observationCues: ['Encourages self after good shots', 'Uses quiet words or gestures (not outward frustration)', 'Avoids extended negative commentary'],
    mappedDomain: 'self_talk_and_confidence',
    isRequired: false,
    playerFacingLabel: 'How they talk to themselves',
    parentFacingLabel: 'Their inner voice on court',
  },
  {
    itemId: 'mental_rp_001',
    category: 'routine_and_preparation',
    name: 'Pre-point routine',
    coachPrompt: 'Watch 10 serves and 10 returns — does player use a consistent routine before each?',
    observationCues: ['Ball bounce or step pattern before serve', 'Ready position and movement before return', 'Same routine regardless of score'],
    mappedDomain: 'routine_and_preparation',
    isRequired: false,
    playerFacingLabel: 'Getting ready for every point',
    parentFacingLabel: 'Their preparation habits',
  },
]

export const MENTAL_CATEGORY_LABELS: Record<MentalRubricCategory, string> = {
  error_response: 'Error Response',
  pressure_behaviour: 'Pressure Behaviour',
  effort_and_body_language: 'Effort & Body Language',
  self_talk_observable: 'Observable Self-Talk',
  routine_and_preparation: 'Routine & Preparation',
}

export function getMentalBandForScore(score: number): AssessmentRubricBand | null {
  return MENTAL_RUBRIC_BANDS.find(b => score >= b.minScore && score <= b.maxScore) ?? null
}

export function getRequiredMentalItems(): MentalRubricItem[] {
  return MENTAL_RUBRIC_ITEMS.filter(i => i.isRequired)
}

export function getMentalItemsByCategory(category: MentalRubricCategory): MentalRubricItem[] {
  return MENTAL_RUBRIC_ITEMS.filter(i => i.category === category)
}
