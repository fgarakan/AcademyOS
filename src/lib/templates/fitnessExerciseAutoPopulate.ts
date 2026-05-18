// curriculum-derived fitness exercise suggestions — no DB — no writes — demo-only
// Keyed by [FitnessBlockType][BallStage] — curated per development stage

import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import type { BallStage } from '@/lib/templates/templateCurriculumPreview'

export interface FitnessExerciseSuggestion {
  name: string
  sets: string
  reps: string
  tennisTransfer: string
  loadNote?: string
}

export interface ProgressionRegression {
  progression: string
  regression: string
}

// Curated progressions and regressions for key exercises
const EXERCISE_PROGRESSION_MAP: Record<string, ProgressionRegression> = {
  // Agility
  'T-pattern cone drill':          { progression: 'T-pattern with ball toss — catch on arrival', regression: 'T-walk drill — walk the pattern first' },
  'Pro agility shuttle':           { progression: 'Pro agility with reactive start cue', regression: 'T-walk + jog — walk the first 3 passes' },
  'Lateral cone sprint — 4-point': { progression: 'Lateral cone sprint — 6-point with stagger', regression: 'Lateral shuffle to cone — controlled speed' },
  'Mirror drill with partner':     { progression: 'Mirror drill — reaction ball cue added', regression: 'Shadow drill — leader only, no reaction required' },

  // Speed
  'Court sprint — baseline to net': { progression: 'Sprint + split-step at net', regression: 'Jog to net with decelerate and plant' },
  'Acceleration sprint — 10m':     { progression: 'Sprint + reactive cut — coach cue direction', regression: 'Slow build sprint — 50% first 5m' },
  'Periodized sprint interval — 60/30': { progression: 'Sprint interval 60/20 — shorter rest', regression: 'Sprint interval 45/45 — equal work/rest' },

  // Plyometrics
  'Squat jump — bodyweight':       { progression: 'Tuck jump', regression: 'Jump squat without air — partial jump' },
  'Depth jump — box':              { progression: 'Depth jump + sprint 5m', regression: 'Step-off box and land — no jump' },
  'Broad jump — standing':         { progression: 'Broad jump + lateral sprint', regression: 'Standing long jump — reduced distance target' },
  'Single-leg bound — alternating': { progression: 'Consecutive single-leg hops x5', regression: 'Single-leg hop forward — short distance only' },

  // Strength
  'Bodyweight squat':              { progression: 'Goblet squat with light dumbbell', regression: 'Sit-to-stand from chair — assisted' },
  'Single-leg squat — bodyweight': { progression: 'Bulgarian split squat', regression: 'Split squat — both feet on floor' },
  'Medicine ball rotational throw': { progression: 'Heavier medicine ball or rapid-fire 10 reps', regression: 'Standing rotation with bodyweight — no throw' },
  'Dumbbell Romanian deadlift':    { progression: 'Barbell RDL at controlled load', regression: 'Hip hinge with dowel — pattern only, no load' },
  'Barbell squat — periodized load': { progression: 'Pause squat — 3s hold at bottom', regression: 'Goblet squat at same volume' },

  // Coordination
  'Ball drop reaction — two-hand catch': { progression: 'Single-hand catch — alternating', regression: 'Toss and catch with partner — seated' },
  'Reaction ball drill':           { progression: 'Reaction ball + lateral move before catch', regression: 'Predictable bounce catch — straight toss' },
  'Footwork ladder — ickey shuffle': { progression: 'Ladder — triple Ickey with acceleration sprint', regression: 'Ladder — two-in two-out basic' },

  // Mobility
  'Hip 90/90 stretch':             { progression: 'Active 90/90 — hip circles in position', regression: 'Seated hip external rotation — minimal range' },
  'Hip 90/90 — active rotation':   { progression: 'Weighted 90/90 press — light load at end range', regression: 'Passive 90/90 hold — supported on hands' },
  'World greatest stretch':        { progression: 'World greatest + thoracic rotation hold', regression: 'Lunge with reach — single plane only' },
  'Thoracic rotation with reach':  { progression: 'Kneeling thoracic rotation + press', regression: 'Seated rotation — limited range' },

  // Movement
  'Shadow footwork drill':         { progression: 'Shadow footwork — coach cues direction', regression: 'Mirror walk — slow deliberate pattern' },
  'Lateral shuffle + cone touch':  { progression: 'Lateral shuffle + cone touch + split-step', regression: 'Side-step walk — controlled' },

  // Recovery
  'Structured cool-down — 8 min': { progression: 'Recovery protocol — 10 min + foam roll', regression: 'Light walk + breathing — 5 min' },
  'Recovery protocol — full circuit': { progression: 'Ice bath + full circuit — competition level', regression: 'Light mobility + breathing only — low load' },
}

export function getExerciseProgressionRegression(name: string): ProgressionRegression | null {
  return EXERCISE_PROGRESSION_MAP[name] ?? null
}

export type ExerciseBank = Record<FitnessBlockType, Record<BallStage, FitnessExerciseSuggestion[]>>

export const FITNESS_EXERCISE_BANK: ExerciseBank = {
  movement: {
    'Red Ball': [
      { name: 'Animal walks circuit', sets: '2', reps: '20m each', tennisTransfer: 'Body awareness and coordination', loadNote: 'Fun and game-based only' },
      { name: 'Skip and hop relay', sets: '2', reps: '3 laps', tennisTransfer: 'Rhythm and timing' },
      { name: 'Obstacle course footwork', sets: '2', reps: '4 reps', tennisTransfer: 'Spatial awareness' },
    ],
    'Orange Ball': [
      { name: 'Dynamic stretch sequence', sets: '2', reps: '8 each side', tennisTransfer: 'Preparation for split-step' },
      { name: 'Lateral shuffle + cone touch', sets: '3', reps: '10m x4', tennisTransfer: 'Court lateral movement' },
      { name: 'Shadow footwork drill', sets: '3', reps: '30s on', tennisTransfer: 'Recovery to ready position' },
    ],
    'Green Ball': [
      { name: 'Baseline shadow movement', sets: '3', reps: '45s continuous', tennisTransfer: 'Full-court coverage patterns' },
      { name: 'Dynamic stretch + split-step', sets: '2', reps: '10 reps', tennisTransfer: 'Match-warm-up routine' },
      { name: 'Court corner movement drill', sets: '3', reps: '8 reps', tennisTransfer: 'First step to all court zones' },
    ],
    'Yellow Ball': [
      { name: 'Pre-match activation routine', sets: '1', reps: '6 min total', tennisTransfer: 'Match-day preparation', loadNote: 'Build consistent pre-match habit' },
      { name: 'Serve + shadow footwork', sets: '3', reps: '60s continuous', tennisTransfer: 'Court positioning rhythm' },
      { name: 'Dynamic hip + shoulder sequence', sets: '2', reps: '10 each side', tennisTransfer: 'Serve and groundstroke preparation' },
    ],
    'High Performance': [
      { name: 'Individualized activation protocol', sets: '1', reps: '8 min', tennisTransfer: 'Match-day priming', loadNote: 'Player-specific — do not standardize' },
      { name: 'Movement priming sequence', sets: '2', reps: '6 each', tennisTransfer: 'Explosive first-step readiness' },
      { name: 'Serve + return warm-up at pace', sets: '3', reps: '60s', tennisTransfer: 'Match-pace rhythm' },
    ],
  },

  agility: {
    'Red Ball': [
      { name: 'Cone weave game', sets: '2', reps: '5 reps', tennisTransfer: 'Change-of-direction fun', loadNote: 'Game-based — no timed pressure' },
      { name: 'Follow-the-leader footwork', sets: '2', reps: '30s each', tennisTransfer: 'Reaction and imitation' },
    ],
    'Orange Ball': [
      { name: 'T-pattern cone drill', sets: '3', reps: '5 reps', tennisTransfer: 'Court T-position movement' },
      { name: 'Lateral cone sprint — 4-point', sets: '3', reps: '6 reps each side', tennisTransfer: 'Wide-ball recovery' },
      { name: 'Mirror drill with partner', sets: '3', reps: '20s on / 10s rest', tennisTransfer: 'Reaction to opponent' },
    ],
    'Green Ball': [
      { name: 'Pro agility shuttle', sets: '4', reps: '4 reps', tennisTransfer: 'Change-of-direction mechanics' },
      { name: 'X-pattern agility drill', sets: '3', reps: '5 reps', tennisTransfer: 'All-court movement coverage' },
      { name: 'Reactive cone touch — coach-cued', sets: '3', reps: '8 cues', tennisTransfer: 'First-step reaction' },
    ],
    'Yellow Ball': [
      { name: 'Tennis-specific agility circuit', sets: '4', reps: '40s on / 20s rest', tennisTransfer: 'Match-speed court coverage' },
      { name: '5-point star agility drill', sets: '3', reps: '6 reps', tennisTransfer: 'Wide-ball plus recovery sprint' },
      { name: 'Split-step + lateral cut', sets: '4', reps: '8 each side', tennisTransfer: 'Return-of-serve positioning' },
    ],
    'High Performance': [
      { name: 'Consequence agility circuit', sets: '5', reps: '30s on / 15s rest', tennisTransfer: 'Match-pace movement under fatigue', loadNote: 'Track time to maintain output' },
      { name: 'Partner reactive agility', sets: '4', reps: '20s on', tennisTransfer: 'Opponent-cued movement' },
      { name: 'Decelerate-and-reset drill', sets: '4', reps: '8 reps', tennisTransfer: 'Recovery after wide ball under pace' },
    ],
  },

  speed: {
    'Red Ball': [
      { name: 'Reaction tag game', sets: '2', reps: '3 min', tennisTransfer: 'First-step quickness', loadNote: 'No structured sprint intervals' },
      { name: 'Short sprint to cone — 5m', sets: '3', reps: '4 reps', tennisTransfer: 'Acceleration' },
    ],
    'Orange Ball': [
      { name: 'Court sprint — baseline to net', sets: '4', reps: '5 reps', tennisTransfer: 'Net approach acceleration' },
      { name: 'Lateral 4-point sprint', sets: '3', reps: '6 each side', tennisTransfer: 'Wide-ball first step' },
      { name: 'Short-court sprint relay', sets: '3', reps: '4 reps each', tennisTransfer: 'Split-step to ball sprint' },
    ],
    'Green Ball': [
      { name: 'Tennis-court sprint intervals', sets: '4', reps: '30s on / 30s rest', tennisTransfer: 'Point-to-point recovery speed' },
      { name: 'Acceleration sprint — 10m', sets: '5', reps: '4 reps', tennisTransfer: 'First-step explosiveness' },
      { name: 'Decelerate + plant + push drill', sets: '3', reps: '6 reps each side', tennisTransfer: 'Ball-reach mechanics' },
    ],
    'Yellow Ball': [
      { name: 'Periodized sprint interval — 60/30', sets: '5', reps: '5 rounds', tennisTransfer: 'Match-endurance capacity', loadNote: 'Monitor HR — note fatigue flags' },
      { name: 'Sprint mechanics — arm drive', sets: '3', reps: '3 x 20m', tennisTransfer: 'Serve-and-sprint power' },
      { name: 'Recovery sprint — 25m with decel', sets: '4', reps: '4 reps', tennisTransfer: 'Behind-the-baseline recovery' },
    ],
    'High Performance': [
      { name: 'Sprint periodized block — 80% intensity', sets: '6', reps: '20m x4', tennisTransfer: 'Explosive first-step at match pace', loadNote: 'Load tracked — flag if output drops' },
      { name: 'Resisted sprint — band or sled', sets: '4', reps: '15m x3', tennisTransfer: 'Serve + first step drive power' },
      { name: 'Plyometric sprint combo', sets: '4', reps: '3 jump + 10m sprint', tennisTransfer: 'Transition speed from split-step' },
    ],
  },

  plyometrics: {
    'Red Ball': [
      { name: 'Jump and land safely — 2-foot', sets: '2', reps: '6 jumps', tennisTransfer: 'Landing mechanics introduction', loadNote: 'Safety-first — no single-leg' },
    ],
    'Orange Ball': [
      { name: 'Broad jump — standing', sets: '3', reps: '5 jumps', tennisTransfer: 'Net approach explosive push' },
      { name: 'Lateral bound — 2-foot', sets: '3', reps: '8 bounds', tennisTransfer: 'Wide-ball lateral explosiveness' },
    ],
    'Green Ball': [
      { name: 'Squat jump — bodyweight', sets: '3', reps: '6 reps', tennisTransfer: 'Overhead and smash power' },
      { name: 'Lateral bound — alternating', sets: '3', reps: '8 each side', tennisTransfer: 'Split-step explode to ball' },
      { name: 'Hurdle bound — forward', sets: '3', reps: '5 reps', tennisTransfer: 'Forward court movement force production' },
    ],
    'Yellow Ball': [
      { name: 'Depth jump — box', sets: '4', reps: '5 reps', tennisTransfer: 'Reactive leg drive', loadNote: 'Introduce progressively — check form' },
      { name: 'Single-leg bound — alternating', sets: '3', reps: '6 each side', tennisTransfer: 'Serve drive and push-off' },
      { name: 'Box jump + land + sprint', sets: '3', reps: '4 reps', tennisTransfer: 'Explosive first step to ball' },
    ],
    'High Performance': [
      { name: 'Weighted box jump', sets: '4', reps: '5 reps', tennisTransfer: 'Maximum power output', loadNote: 'Periodized — not every session' },
      { name: 'Consecutive reactive bounds', sets: '4', reps: '8 bounds', tennisTransfer: 'Continuous court coverage under pace' },
      { name: 'Single-leg hurdle jump', sets: '3', reps: '5 each leg', tennisTransfer: 'Serve-leg explosive drive' },
    ],
  },

  strength: {
    'Red Ball': [
      { name: 'Animal strength play — bear crawl', sets: '2', reps: '15m', tennisTransfer: 'Upper body stability', loadNote: 'Playful — not structured strength' },
    ],
    'Orange Ball': [
      { name: 'Bodyweight squat', sets: '3', reps: '10 reps', tennisTransfer: 'Low-ball stability and leg drive' },
      { name: 'Push-up — modified or standard', sets: '2', reps: '8 reps', tennisTransfer: 'Serve shoulder stability' },
      { name: 'Superman hold', sets: '3', reps: '30s', tennisTransfer: 'Lower back and core stability' },
    ],
    'Green Ball': [
      { name: 'Single-leg squat — bodyweight', sets: '3', reps: '8 each leg', tennisTransfer: 'Low-ball reach and balance' },
      { name: 'Core plank hold', sets: '3', reps: '40s', tennisTransfer: 'Groundstroke drive stability' },
      { name: 'Band shoulder external rotation', sets: '3', reps: '12 reps', tennisTransfer: 'Serve shoulder health' },
    ],
    'Yellow Ball': [
      { name: 'Dumbbell Romanian deadlift', sets: '3', reps: '10 reps', tennisTransfer: 'Posterior chain for serve and approach', loadNote: 'Supervised — check hip hinge form' },
      { name: 'Medicine ball rotational throw', sets: '3', reps: '8 each side', tennisTransfer: 'Forehand and backhand rotational power' },
      { name: 'Goblet squat', sets: '3', reps: '10 reps', tennisTransfer: 'Low-ball drive' },
    ],
    'High Performance': [
      { name: 'Barbell squat — periodized load', sets: '4', reps: '5–8 reps', tennisTransfer: 'Maximum leg drive and serve power', loadNote: 'Load tracked against tournament calendar' },
      { name: 'Pull-up or lat pulldown', sets: '4', reps: '6–8 reps', tennisTransfer: 'Serve mechanics — lat engagement' },
      { name: 'Single-leg RDL with load', sets: '3', reps: '8 each leg', tennisTransfer: 'Serve landing and deceleration stability' },
    ],
  },

  coordination: {
    'Red Ball': [
      { name: 'Ball drop reaction — two-hand catch', sets: '3', reps: '8 drops', tennisTransfer: 'Hand-eye coordination' },
      { name: 'Two-ball juggling — beginner', sets: '3', reps: '20s', tennisTransfer: 'Ball tracking' },
      { name: 'Target toss and retrieve', sets: '2', reps: '10 reps', tennisTransfer: 'Spatial awareness and aim' },
    ],
    'Orange Ball': [
      { name: 'Footwork ladder — ickey shuffle', sets: '3', reps: '4 passes', tennisTransfer: 'Rhythm and timing' },
      { name: 'Ball bounce + catch + toss', sets: '3', reps: '30s', tennisTransfer: 'Ball tracking under movement' },
      { name: 'Cone weave + racket carry', sets: '3', reps: '5 reps', tennisTransfer: 'Ball and movement coordination' },
    ],
    'Green Ball': [
      { name: 'Ladder + catch combo', sets: '3', reps: '5 passes', tennisTransfer: 'Multi-task coordination' },
      { name: 'Wall rebound reaction drill', sets: '3', reps: '30s', tennisTransfer: 'Reaction time and tracking' },
      { name: 'Partner pass and shadow footwork', sets: '3', reps: '45s', tennisTransfer: 'Dual-task court awareness' },
    ],
    'Yellow Ball': [
      { name: 'Reaction ball drill', sets: '4', reps: '30s per set', tennisTransfer: 'Unpredictable ball tracking' },
      { name: 'Ladder + cognitive cue', sets: '3', reps: '5 passes', tennisTransfer: 'Split attention under movement' },
      { name: 'Multi-ball rally + movement cue', sets: '3', reps: '12 balls', tennisTransfer: 'Match-pace decision under distraction' },
    ],
    'High Performance': [
      { name: 'Dual-task agility + cue', sets: '4', reps: '8 cues', tennisTransfer: 'Game-plan decision under physical load' },
      { name: 'Reaction ball + sprint combo', sets: '4', reps: '6 reps', tennisTransfer: 'First-step reaction at match pace' },
    ],
  },

  mobility: {
    'Red Ball': [
      { name: 'Gentle hip circle game', sets: '2', reps: '10 each side', tennisTransfer: 'Hip movement awareness', loadNote: 'Fun — no holds' },
      { name: 'Reach and grab stretch', sets: '2', reps: '5 each side', tennisTransfer: 'Shoulder reach' },
    ],
    'Orange Ball': [
      { name: 'Hip 90/90 stretch', sets: '2', reps: '45s each side', tennisTransfer: 'Low-ball hip reach' },
      { name: 'Ankle circles + calf raise', sets: '2', reps: '15 reps', tennisTransfer: 'Split-step landing stability' },
      { name: 'Shoulder cross-body reach', sets: '2', reps: '30s each side', tennisTransfer: 'Serve follow-through shoulder' },
    ],
    'Green Ball': [
      { name: 'Hip flexor lunge stretch', sets: '3', reps: '45s each side', tennisTransfer: 'Approach shot hip drive' },
      { name: 'Thoracic rotation with reach', sets: '2', reps: '10 each side', tennisTransfer: 'Shoulder turn for serve' },
      { name: 'World greatest stretch', sets: '2', reps: '6 each side', tennisTransfer: 'Full body mobility' },
    ],
    'Yellow Ball': [
      { name: 'Hip 90/90 — active rotation', sets: '3', reps: '8 each side', tennisTransfer: 'Low-ball chase and recover' },
      { name: 'Lat and thoracic foam roll', sets: '2', reps: '60s per area', tennisTransfer: 'Serve shoulder recovery' },
      { name: 'Ankle dorsiflexion mobilization', sets: '2', reps: '12 each side', tennisTransfer: 'Split-step and wide-ball plant' },
    ],
    'High Performance': [
      { name: 'Active hip mobility circuit', sets: '3', reps: '8 each', tennisTransfer: 'Full match range-of-motion maintenance', loadNote: 'Individual — track any mobility flags' },
      { name: 'Thoracic extension + rotation', sets: '3', reps: '10 each side', tennisTransfer: 'Serve trophy position depth' },
      { name: 'Ankle and calf complex', sets: '2', reps: '15 reps + 60s hold', tennisTransfer: 'Sprint and split-step joint health' },
    ],
  },

  recovery_cool_down: {
    'Red Ball': [
      { name: 'Gentle shake-out stretch', sets: '1', reps: '2 min', tennisTransfer: 'Post-session recovery' },
      { name: 'Circle team huddle', sets: '1', reps: '2 min', tennisTransfer: 'Team cohesion and cool-down' },
    ],
    'Orange Ball': [
      { name: 'Static partner stretch', sets: '1', reps: '30s each', tennisTransfer: 'Post-session recovery' },
      { name: 'Breathing cool-down — 4-count', sets: '2', reps: '8 breaths', tennisTransfer: 'Nervous system recovery' },
      { name: 'Team debrief one-word win', sets: '1', reps: '2 min', tennisTransfer: 'Mental recovery and session close' },
    ],
    'Green Ball': [
      { name: 'Active recovery rally — cooperative', sets: '1', reps: '5 min', tennisTransfer: 'Gradual heart-rate reduction' },
      { name: 'Static lower-body stretch circuit', sets: '1', reps: '6 min', tennisTransfer: 'Hamstring and hip cool-down' },
      { name: 'Session debrief — one win + one target', sets: '1', reps: '3 min', tennisTransfer: 'Mental processing' },
    ],
    'Yellow Ball': [
      { name: 'Structured cool-down — 8 min', sets: '1', reps: '8 min', tennisTransfer: 'Full recovery protocol' },
      { name: 'RPE + one-sentence feedback', sets: '1', reps: '2 min', tennisTransfer: 'Load tracking and session data' },
      { name: 'Foam roll — quads, calves, lats', sets: '1', reps: '60s per area', tennisTransfer: 'Muscle recovery and next-session readiness' },
    ],
    'High Performance': [
      { name: 'Recovery protocol — full circuit', sets: '1', reps: '10 min', tennisTransfer: 'Post-match recovery', loadNote: 'Mandatory — tracked by conditioning staff' },
      { name: 'RPE + session feedback + load note', sets: '1', reps: '3 min', tennisTransfer: 'Data for load management model' },
      { name: 'Ice or contrast therapy — optional', sets: '1', reps: 'As needed', tennisTransfer: 'Inflammation management', loadNote: 'Player-individual — do not mandate' },
    ],
  },
}

export function getExercisesForBlock(
  blockType: FitnessBlockType,
  stage: BallStage,
): FitnessExerciseSuggestion[] {
  return FITNESS_EXERCISE_BANK[blockType]?.[stage] ?? []
}
