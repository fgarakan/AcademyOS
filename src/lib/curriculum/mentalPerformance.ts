// Sprint 494 — Mental Performance Path V1
// Mental performance curriculum path definitions.
// Defines competencies and progression markers for the mental game track.
// Mental is a block_type in the DB. This module provides the curriculum-level structure.
// Pure TypeScript — no DB calls.

export type MentalPerformanceDomain =
  | 'focus_and_concentration'
  | 'resilience_and_recovery'
  | 'competitive_mindset'
  | 'pressure_management'
  | 'self_talk_and_confidence'
  | 'process_orientation'
  | 'routine_and_preparation'

export type CurriculumStageId =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'

export interface MentalCompetency {
  id: string
  domain: MentalPerformanceDomain
  stage: CurriculumStageId
  title: string
  description: string
  observableMarkers: string[]
  coachingCues: string[]
  parentFacingLabel: string
  playerFacingLabel: string
}

export interface MentalPerformanceStageProfile {
  stage: CurriculumStageId
  stageLabel: string
  keyCompetencies: MentalCompetency[]
  priorityDomain: MentalPerformanceDomain
  sessionBlockRecommendation: string
}

const MENTAL_COMPETENCIES: MentalCompetency[] = [
  // Red Foundation
  {
    id: 'mental_red_focus_001',
    domain: 'focus_and_concentration',
    stage: 'red_foundation',
    title: 'Task focus for one point',
    description: 'Player can bring attention to the ball/task for the duration of one point',
    observableMarkers: ['Makes eye contact with ball', 'Shows body language reset between points'],
    coachingCues: ['Watch the ball until it bounces', 'Reset your feet after every point'],
    parentFacingLabel: 'Focusing on one point at a time',
    playerFacingLabel: 'Concentrate on each point',
  },
  {
    id: 'mental_red_resilience_001',
    domain: 'resilience_and_recovery',
    stage: 'red_foundation',
    title: 'Emotional reset after errors',
    description: 'Player demonstrates a basic reset routine (shake, bounce, breathe) after errors',
    observableMarkers: ['Does not dwell on errors', 'Returns to ready position quickly'],
    coachingCues: ['Use a shake or bounce to reset', 'Errors are part of learning'],
    parentFacingLabel: 'Bouncing back from mistakes',
    playerFacingLabel: 'Reset after every mistake',
  },

  // Orange Development
  {
    id: 'mental_orange_selftalk_001',
    domain: 'self_talk_and_confidence',
    stage: 'orange_development',
    title: 'Positive self-talk baseline',
    description: 'Player begins using constructive self-talk instead of self-criticism',
    observableMarkers: ['Avoids visible self-criticism cues', 'Uses encouraging body language'],
    coachingCues: ['What would you say to a teammate?', 'Give yourself the same kindness'],
    parentFacingLabel: 'Building a positive inner voice',
    playerFacingLabel: 'Talk to yourself like a teammate',
  },
  {
    id: 'mental_orange_routine_001',
    domain: 'routine_and_preparation',
    stage: 'orange_development',
    title: 'Pre-point routine',
    description: 'Player has a consistent 2–3 step pre-point preparation routine',
    observableMarkers: ['Consistent ball bounce or step pattern', 'Visible pause before serving/returning'],
    coachingCues: ['Bounce → breathe → go', 'Same routine, every point'],
    parentFacingLabel: 'Building a consistent preparation routine',
    playerFacingLabel: 'Use the same routine before every point',
  },

  // Green Performance
  {
    id: 'mental_green_pressure_001',
    domain: 'pressure_management',
    stage: 'green_performance',
    title: 'Performing under score pressure',
    description: 'Player maintains technique and tactical discipline on pressure points (break points, tiebreaks)',
    observableMarkers: ['No visible panic on 30-40 or 4-4', 'Uses trusted shots, not desperate attempts'],
    coachingCues: ['Play the ball, not the score', 'Trust your preparation'],
    parentFacingLabel: 'Staying calm in pressure moments',
    playerFacingLabel: 'Play your game on the big points',
  },
  {
    id: 'mental_green_process_001',
    domain: 'process_orientation',
    stage: 'green_performance',
    title: 'Process goals over outcome goals',
    description: 'Player can articulate and play toward process goals (e.g. depth, placement) rather than just "winning"',
    observableMarkers: ['References tactics in post-match review', 'Shows equanimity in wins and losses'],
    coachingCues: ['What was your target for this match?', 'Score will follow the process'],
    parentFacingLabel: 'Focusing on the process, not just the result',
    playerFacingLabel: 'Focus on your game plan, not the score',
  },

  // Yellow Competitive
  {
    id: 'mental_yellow_competitive_001',
    domain: 'competitive_mindset',
    stage: 'yellow_competitive',
    title: 'Competitive presence',
    description: 'Player reads opponent, adapts tactics, and maintains composure across full match',
    observableMarkers: ['Adjusts patterns during match', 'Maintains intensity in third sets'],
    coachingCues: ['What did you notice about their patterns?', 'How do you close a match?'],
    parentFacingLabel: 'Competing strategically across a full match',
    playerFacingLabel: 'Read your opponent and adapt',
  },
]

export const MENTAL_STAGE_PROFILES: Record<CurriculumStageId, MentalPerformanceStageProfile> = {
  red_foundation: {
    stage: 'red_foundation',
    stageLabel: 'Foundation',
    keyCompetencies: MENTAL_COMPETENCIES.filter(c => c.stage === 'red_foundation'),
    priorityDomain: 'focus_and_concentration',
    sessionBlockRecommendation: 'Include 5–10 min mental focus drill per session (e.g. 1-point concentration games)',
  },
  orange_development: {
    stage: 'orange_development',
    stageLabel: 'Development',
    keyCompetencies: MENTAL_COMPETENCIES.filter(c => c.stage === 'orange_development'),
    priorityDomain: 'routine_and_preparation',
    sessionBlockRecommendation: 'Build routine in warm-up; add self-talk awareness debrief post-session',
  },
  green_performance: {
    stage: 'green_performance',
    stageLabel: 'Performance',
    keyCompetencies: MENTAL_COMPETENCIES.filter(c => c.stage === 'green_performance'),
    priorityDomain: 'pressure_management',
    sessionBlockRecommendation: 'Introduce pressure-point simulations (30-40, tiebreak scenarios) weekly',
  },
  yellow_competitive: {
    stage: 'yellow_competitive',
    stageLabel: 'Competitive',
    keyCompetencies: MENTAL_COMPETENCIES.filter(c => c.stage === 'yellow_competitive'),
    priorityDomain: 'competitive_mindset',
    sessionBlockRecommendation: 'Match play with structured post-match mental debrief',
  },
  high_performance: {
    stage: 'high_performance',
    stageLabel: 'High Performance',
    keyCompetencies: [],
    priorityDomain: 'competitive_mindset',
    sessionBlockRecommendation: 'Individualised mental coaching programme; advanced scenario training',
  },
}

export function getMentalStageProfile(stage: CurriculumStageId): MentalPerformanceStageProfile {
  return MENTAL_STAGE_PROFILES[stage]
}

export function getMentalCompetenciesByDomain(domain: MentalPerformanceDomain): MentalCompetency[] {
  return MENTAL_COMPETENCIES.filter(c => c.domain === domain)
}

export function getMentalDomainLabel(domain: MentalPerformanceDomain): string {
  const labels: Record<MentalPerformanceDomain, string> = {
    focus_and_concentration: 'Focus & Concentration',
    resilience_and_recovery: 'Resilience & Recovery',
    competitive_mindset: 'Competitive Mindset',
    pressure_management: 'Pressure Management',
    self_talk_and_confidence: 'Self-Talk & Confidence',
    process_orientation: 'Process Orientation',
    routine_and_preparation: 'Routine & Preparation',
  }
  return labels[domain]
}
