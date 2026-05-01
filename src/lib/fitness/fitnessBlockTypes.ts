// Fitness OS block taxonomy — separate from class/session block_type DB enum.
// The DB block_type enum (warm_up | technical | tactical | movement | fitness | competition | mental | cool_down | free)
// does not include fitness-specific sub-types. Fitness block type is stored in the block's `name` field.
// The DB `type` field uses the closest available enum value (see getDbBlockType).

export type FitnessBlockType =
  | 'movement'
  | 'agility'
  | 'speed'
  | 'plyometrics'
  | 'strength'
  | 'coordination'
  | 'mobility'
  | 'recovery_cool_down'

export const FITNESS_BLOCK_TYPES: FitnessBlockType[] = [
  'movement',
  'agility',
  'speed',
  'plyometrics',
  'strength',
  'coordination',
  'mobility',
  'recovery_cool_down',
]

const LABELS: Record<FitnessBlockType, string> = {
  movement:          'Movement',
  agility:           'Agility',
  speed:             'Speed',
  plyometrics:       'Plyometrics',
  strength:          'Strength',
  coordination:      'Coordination',
  mobility:          'Mobility',
  recovery_cool_down: 'Recovery / Cool Down',
}

// Accent color class per block type (Tailwind CSS classes)
const ACCENTS: Record<FitnessBlockType, string> = {
  movement:          'text-lime',
  agility:           'text-status-blue',
  speed:             'text-status-orange',
  plyometrics:       'text-status-orange',
  strength:          'text-status-red',
  coordination:      'text-lime',
  mobility:          'text-status-blue',
  recovery_cool_down: 'text-text-secondary',
}

// Border accent class per block type
const BORDER_ACCENTS: Record<FitnessBlockType, string> = {
  movement:          'border-lime/20',
  agility:           'border-status-blue/20',
  speed:             'border-status-orange/20',
  plyometrics:       'border-status-orange/20',
  strength:          'border-status-red/20',
  coordination:      'border-lime/20',
  mobility:          'border-status-blue/20',
  recovery_cool_down: 'border-border',
}

// Map fitness block type to the closest existing DB block_type enum value
const DB_BLOCK_TYPE_MAP: Record<FitnessBlockType, string> = {
  movement:          'movement',
  agility:           'fitness',
  speed:             'fitness',
  plyometrics:       'fitness',
  strength:          'fitness',
  coordination:      'fitness',
  mobility:          'movement',
  recovery_cool_down: 'cool_down',
}

// Default block order for a new standard fitness template
export const defaultFitnessTemplateBlockOrder: FitnessBlockType[] = [
  'movement',
  'agility',
  'speed',
  'strength',
  'coordination',
  'mobility',
  'recovery_cool_down',
]

export function getFitnessBlockLabel(type: FitnessBlockType): string {
  return LABELS[type]
}

export function getFitnessBlockAccent(type: FitnessBlockType): string {
  return ACCENTS[type]
}

export function getFitnessBlockBorderAccent(type: FitnessBlockType): string {
  return BORDER_ACCENTS[type]
}

export function getDbBlockType(fitnessType: FitnessBlockType): string {
  return DB_BLOCK_TYPE_MAP[fitnessType]
}

// Infer fitness block type from block name (for existing/imported blocks)
export function inferFitnessBlockType(blockName: string): FitnessBlockType | null {
  const lower = blockName.toLowerCase()
  if (lower.includes('agility')) return 'agility'
  if (lower.includes('speed') || lower.includes('sprint') || lower.includes('acceleration')) return 'speed'
  if (lower.includes('plyometric') || lower.includes('jump') || lower.includes('bound') || lower.includes('explosive')) return 'plyometrics'
  if (lower.includes('strength') || lower.includes('core') || lower.includes('bodyweight')) return 'strength'
  if (lower.includes('coordination') || lower.includes('reaction') || lower.includes('balance') || lower.includes('rhythm')) return 'coordination'
  if (lower.includes('mobility') || lower.includes('hip') || lower.includes('shoulder') || lower.includes('ankle')) return 'mobility'
  if (lower.includes('movement') || lower.includes('warm') || lower.includes('footwork') || lower.includes('dynamic')) return 'movement'
  if (lower.includes('cool') || lower.includes('recovery') || lower.includes('stretch') || lower.includes('breathing')) return 'recovery_cool_down'
  return null
}

// Duration defaults per block type (minutes)
const DEFAULT_DURATIONS: Record<FitnessBlockType, number> = {
  movement:          10,
  agility:           15,
  speed:             12,
  plyometrics:       10,
  strength:          15,
  coordination:      10,
  mobility:          8,
  recovery_cool_down: 10,
}

export function getDefaultBlockDuration(type: FitnessBlockType): number {
  return DEFAULT_DURATIONS[type]
}

// Short description for the development intent of each block type
const INTENT_DESCRIPTIONS: Record<FitnessBlockType, string> = {
  movement:          'Dynamic warm-up, movement preparation, footwork patterns',
  agility:           'Ladder drills, cone reactions, change of direction',
  speed:             'Acceleration mechanics, short court sprints, sprint form',
  plyometrics:       'Jumps, bounds, explosive movement patterns',
  strength:          'Bodyweight strength, core stability, lower-body control',
  coordination:      'Rhythm drills, balance tasks, hand-eye coordination, reaction',
  mobility:          'Hip, shoulder, and ankle mobility work',
  recovery_cool_down: 'Breathing, stretching, cool-down, recovery protocols',
}

export function getFitnessBlockIntent(type: FitnessBlockType): string {
  return INTENT_DESCRIPTIONS[type]
}
