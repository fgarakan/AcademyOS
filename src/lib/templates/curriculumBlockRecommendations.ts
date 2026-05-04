// Pure utility — no DB access, no AI calls.
// Maps curriculum stage and fitness phase to recommended template block configurations.
// Used to suggest block sequences when creating or reviewing class/session templates.

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CurriculumStage =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'

export type FitnessPhase =
  | 'physical_literacy'
  | 'athletic_development'
  | 'tennis_specific_conditioning'
  | 'periodized_performance'
  | 'elite_preparation'

export interface BlockRecommendation {
  type: string           // DB block_type value
  name: string           // Human-readable block name
  suggestedDurationMin: number
  emphasis: string       // What coaches should focus on in this block
  rationale: string      // Why this block belongs at this curriculum stage
}

export interface SessionBlockTemplate {
  stage: CurriculumStage
  stageName: string
  totalSessionMin: number
  blocks: BlockRecommendation[]
  notes: string
}

// ─────────────────────────────────────────────────────────────
// Stage → block configuration map
// Duration proportions based on standard session structures.
// ─────────────────────────────────────────────────────────────

type BlockConfig = Omit<BlockRecommendation, 'suggestedDurationMin'> & {
  durationPct: number   // percentage of total session time
}

const STAGE_BLOCK_CONFIGS: Record<CurriculumStage, { blocks: BlockConfig[]; notes: string }> = {
  red_foundation: {
    notes: 'Short sessions (45–60 min). Movement variety and play dominate. No tactical pressure.',
    blocks: [
      {
        type: 'warm_up',
        name: 'Movement Warm-Up',
        durationPct: 0.15,
        emphasis: 'Locomotor variety — skip, hop, gallop, carioca',
        rationale: 'Physical literacy requires multi-directional movement foundations before any ball work',
      },
      {
        type: 'technical',
        name: 'Technical Introduction',
        durationPct: 0.40,
        emphasis: 'Feed-and-catch rally. Grip, contact point, balance. No score-keeping.',
        rationale: 'Core technique formation is the primary output at Red Foundation',
      },
      {
        type: 'movement',
        name: 'Movement & Coordination',
        durationPct: 0.25,
        emphasis: 'Agility games, reaction drills, hand-eye coordination activities',
        rationale: 'Motor pattern variety supports long-term athletic development at this stage',
      },
      {
        type: 'cool_down',
        name: 'Cool-Down & Reflection',
        durationPct: 0.10,
        emphasis: 'Light stretching, breathing, one coaching takeaway',
        rationale: 'Short cool-down reinforces recovery habit and closes the learning loop',
      },
    ],
  },

  orange_development: {
    notes: 'Sessions 60–75 min. Technique with purpose. Short-court and cross-court patterns.',
    blocks: [
      {
        type: 'warm_up',
        name: 'Dynamic Warm-Up',
        durationPct: 0.12,
        emphasis: 'Tennis-specific footwork patterns, split step, recover',
        rationale: 'Dynamic prep activates court-movement patterns used throughout the session',
      },
      {
        type: 'technical',
        name: 'Technical Block',
        durationPct: 0.35,
        emphasis: 'Groundstroke consistency, short-court feeding, contact zone control',
        rationale: 'Orange Development is the primary stage for stroke pattern formation',
      },
      {
        type: 'tactical',
        name: 'Tactical Introduction',
        durationPct: 0.25,
        emphasis: 'Cross-court construction, opening the court, one decision point',
        rationale: 'Simple tactical concepts introduced alongside technical patterns',
      },
      {
        type: 'fitness',
        name: 'Athletic Development',
        durationPct: 0.15,
        emphasis: 'Bodyweight strength, coordination games, short sprints',
        rationale: 'Athletic development phase: general strength and speed without periodization',
      },
      {
        type: 'cool_down',
        name: 'Cool-Down',
        durationPct: 0.10,
        emphasis: 'Static stretch, session debrief, one improvement cue per player',
        rationale: 'Closing ritual anchors the session lesson',
      },
    ],
  },

  green_performance: {
    notes: 'Sessions 75–90 min. Competitive patterns, transition play, fitness starts.',
    blocks: [
      {
        type: 'warm_up',
        name: 'Activation Warm-Up',
        durationPct: 0.10,
        emphasis: 'Dynamic stretch, split step, shadow footwork, light rally',
        rationale: 'Court-ready activation preceding competitive pattern work',
      },
      {
        type: 'technical',
        name: 'Technical Refinement',
        durationPct: 0.25,
        emphasis: 'Pattern precision, directional control, heavy ball or kick serve',
        rationale: 'Technique shifts from formation to refinement and application under pressure',
      },
      {
        type: 'tactical',
        name: 'Pattern Play',
        durationPct: 0.25,
        emphasis: 'Serve plus one, return plus one, 3-shot construction',
        rationale: 'Green is the primary tactical construction stage',
      },
      {
        type: 'competition',
        name: 'Competitive Application',
        durationPct: 0.20,
        emphasis: 'Live ball points, tiebreaks, pressure scoring',
        rationale: 'Match-like application needed to transfer patterns under real competitive stress',
      },
      {
        type: 'fitness',
        name: 'Tennis-Specific Conditioning',
        durationPct: 0.12,
        emphasis: 'Court sprints, agility work, on-court movement conditioning',
        rationale: 'Tennis-specific conditioning phase: speed and endurance tied to court dimensions',
      },
      {
        type: 'cool_down',
        name: 'Cool-Down',
        durationPct: 0.08,
        emphasis: 'Active recovery, match review, one point of focus for next session',
        rationale: 'Brief cool-down; most session time serves technical and competitive development',
      },
    ],
  },

  yellow_competitive: {
    notes: 'Sessions 90 min+. Match prep focus. All blocks present. Mental game explicit.',
    blocks: [
      {
        type: 'warm_up',
        name: 'Pre-Session Activation',
        durationPct: 0.08,
        emphasis: 'Serve warm-up, court positioning, pre-match routine simulation',
        rationale: 'Mirrors the pre-match warm-up routine to build competition habits',
      },
      {
        type: 'technical',
        name: 'Precision Technical',
        durationPct: 0.20,
        emphasis: 'Serve targets, return patterns, specific weakness under pressure',
        rationale: 'Technical work at Yellow level is precision under match-like conditions',
      },
      {
        type: 'tactical',
        name: 'Match Tactics',
        durationPct: 0.22,
        emphasis: 'Game plan construction, scouting patterns, adapting to style',
        rationale: 'Tactical work explicitly tied to upcoming competition or opponent profile',
      },
      {
        type: 'competition',
        name: 'Match Play',
        durationPct: 0.25,
        emphasis: 'Full-set play, pressure scoring, self-coaching under match conditions',
        rationale: 'Competitive volume is highest at Yellow; match volume equals training volume',
      },
      {
        type: 'mental',
        name: 'Mental Training',
        durationPct: 0.10,
        emphasis: 'Pre-point routine, reset cues, pressure tolerance, process focus',
        rationale: 'Mentality block required from Yellow 1 onward; pressure-tolerance content mandatory',
      },
      {
        type: 'fitness',
        name: 'Periodized Conditioning',
        durationPct: 0.10,
        emphasis: 'Periodized sprint/strength work aligned to tournament calendar',
        rationale: 'Fitness phase shifts to periodization: load management around competition',
      },
      {
        type: 'cool_down',
        name: 'Recovery',
        durationPct: 0.05,
        emphasis: 'Structured cool-down, RPE tracking, coach debrief',
        rationale: 'Load management and recovery tracking becomes critical at competitive level',
      },
    ],
  },

  high_performance: {
    notes: 'Full training cycles. Elite preparation. Individual load management required.',
    blocks: [
      {
        type: 'warm_up',
        name: 'Elite Activation',
        durationPct: 0.08,
        emphasis: 'Individualized pre-session protocol, serve warm-up, movement priming',
        rationale: 'HP players follow individualized activation protocols aligned to their routines',
      },
      {
        type: 'technical',
        name: 'Technical Precision',
        durationPct: 0.18,
        emphasis: 'High-margin execution, weapon sharpening, specific pattern under full pace',
        rationale: 'At HP level, technical work targets specific weapons or exploitable margins',
      },
      {
        type: 'tactical',
        name: 'Elite Tactics',
        durationPct: 0.22,
        emphasis: 'Multi-ball patterns, opponent-specific game plans, situational play',
        rationale: 'Tactical sophistication requires multi-ball work and scenario-based training',
      },
      {
        type: 'competition',
        name: 'Competitive Practice',
        durationPct: 0.28,
        emphasis: 'Full match, tiebreaks, pressure sets, consequence scoring',
        rationale: 'High competitive volume with consequence scoring to simulate national/international events',
      },
      {
        type: 'mental',
        name: 'Performance Psychology',
        durationPct: 0.10,
        emphasis: 'Self-coaching, handling adversity, performance review frameworks',
        rationale: 'HP players need explicit mental performance frameworks and adversity training',
      },
      {
        type: 'fitness',
        name: 'Elite Conditioning',
        durationPct: 0.10,
        emphasis: 'Strength training, sprint mechanics, injury prevention, load tracking',
        rationale: 'Elite preparation requires structured physical periodization alongside on-court load',
      },
      {
        type: 'cool_down',
        name: 'Recovery Protocol',
        durationPct: 0.04,
        emphasis: 'RPE, session rating, individual feedback, recovery planning',
        rationale: 'HP cool-down includes structured load tracking and individual session feedback',
      },
    ],
  },
}

const STAGE_NAMES: Record<CurriculumStage, string> = {
  red_foundation: 'Red Foundation',
  orange_development: 'Orange Development',
  green_performance: 'Green Performance',
  yellow_competitive: 'Yellow Competitive',
  high_performance: 'High Performance',
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

const DEFAULT_SESSION_MIN = 75

/**
 * Returns recommended template blocks for a curriculum stage.
 * Durations are calculated as a proportion of totalSessionMin.
 */
export function getRecommendedBlocksForStage(
  stage: CurriculumStage,
  totalSessionMin: number = DEFAULT_SESSION_MIN,
): SessionBlockTemplate {
  const config = STAGE_BLOCK_CONFIGS[stage]

  const blocks: BlockRecommendation[] = config.blocks.map(b => ({
    type: b.type,
    name: b.name,
    suggestedDurationMin: Math.round(totalSessionMin * b.durationPct),
    emphasis: b.emphasis,
    rationale: b.rationale,
  }))

  return {
    stage,
    stageName: STAGE_NAMES[stage],
    totalSessionMin,
    blocks,
    notes: config.notes,
  }
}

/**
 * Maps a fitness phase string (from curriculum_fitness_guidance) to a curriculum stage.
 * Used when you have fitness guidance data but not the stage directly.
 */
export function stageForFitnessPhase(fitnessPhase: FitnessPhase): CurriculumStage {
  const map: Record<FitnessPhase, CurriculumStage> = {
    physical_literacy: 'red_foundation',
    athletic_development: 'orange_development',
    tennis_specific_conditioning: 'green_performance',
    periodized_performance: 'yellow_competitive',
    elite_preparation: 'high_performance',
  }
  return map[fitnessPhase] ?? 'orange_development'
}

/**
 * Returns block recommendations derived from a fitness phase.
 * Convenience wrapper around getRecommendedBlocksForStage.
 */
export function getRecommendedBlocksForFitnessPhase(
  fitnessPhase: FitnessPhase,
  totalSessionMin: number = DEFAULT_SESSION_MIN,
): SessionBlockTemplate {
  return getRecommendedBlocksForStage(stageForFitnessPhase(fitnessPhase), totalSessionMin)
}

/**
 * Returns the list of all valid curriculum stages in sort order.
 */
export const CURRICULUM_STAGES: CurriculumStage[] = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
]
