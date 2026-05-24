// Sprint 736 -- DONNA Fitness Template Draft Answer Engine V1
// Handles fitness template creation intent detection, draft generation with
// age/level/training-goal-appropriate blocks, coach cues, and tennis transfer notes.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { getFitnessBlockLabel, getDefaultBlockDuration, getFitnessBlockIntent } from '@/lib/fitness/fitnessBlockTypes'
import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import { extractDuration } from '@/components/assistant/templateDraftParser'

// -- Types --------------------------------------------------------------------

// Mirrors FitnessTemplateType from fitnessTemplateActions -- defined here to avoid
// importing from a 'use server' file in a shared lib module.
type FitnessSessionType =
  | 'standard'
  | 'pre_tournament'
  | 'post_tournament'
  | 'high_intensity'
  | 'low_load'
  | 'assessment'
  | 'recovery'

interface FitnessDraftBlock {
  type: FitnessBlockType
  label: string
  durationMin: number
  coachCue: string
  tennisTransferNote: string
}

interface FitnessDraft {
  name: string
  sessionType: FitnessSessionType
  ageGroup: string | null
  trainingGoal: string
  durationMinutes: number
  blocks: FitnessDraftBlock[]
}

export interface FitnessDraftAnswerResult {
  answer: DonnaSafeReadAnswer
  isComplete: boolean
}

// -- Intent patterns ----------------------------------------------------------

const FITNESS_INTENT_PATTERNS: RegExp[] = [
  /fitness.*(template|session|training|plan)/i,
  /(build|create|make|draft|design).*(fitness|conditioning|athletic)/i,
  /pre.?tournament.*(fitness|session|training|prep)/i,
  /post.?tournament.*(fitness|recovery|session)/i,
  /high.?intensity.*(fitness|session|training)/i,
  /low.?load.*(fitness|session|training)/i,
  /recovery.*(session|fitness|training|template)/i,
  /athletic.*(training|session|template)/i,
  /(speed|agility|strength|conditioning).*(session|training|template|plan)/i,
]

export function isFitnessCreationIntent(text: string): boolean {
  return FITNESS_INTENT_PATTERNS.some(p => p.test(text))
}

// -- Extraction helpers -------------------------------------------------------

function extractAgeGroup(text: string): string | null {
  const t = text.toLowerCase()
  if (/u10|under.?10|10.?and.?under/.test(t)) return 'U10'
  if (/u12|under.?12/.test(t)) return 'U12'
  if (/u14|under.?14/.test(t)) return 'U14'
  if (/u16|under.?16/.test(t)) return 'U16'
  if (/u18|under.?18/.test(t)) return 'U18'
  if (/adult|open|senior/.test(t)) return 'Adult'
  return null
}

function extractSessionType(text: string): FitnessSessionType {
  const t = text.toLowerCase()
  if (/pre.?tournament|tournament.?prep/.test(t)) return 'pre_tournament'
  if (/post.?tournament|after.?tournament/.test(t)) return 'post_tournament'
  if (/high.?intensity|intense|max.?effort|hard.?session/.test(t)) return 'high_intensity'
  if (/low.?load|easy|light|active.?recovery/.test(t)) return 'low_load'
  if (/recovery|regeneration|restoration/.test(t)) return 'recovery'
  if (/assessment|test|evaluation/.test(t)) return 'assessment'
  return 'standard'
}

function extractTrainingGoal(text: string): string {
  const t = text.toLowerCase()
  if (/speed|sprint|acceleration/.test(t)) return 'speed'
  if (/agility|quickness|change.?of.?direction/.test(t)) return 'agility'
  if (/strength|power|core|bodyweight/.test(t)) return 'strength'
  if (/plyometric|jump|explosive/.test(t)) return 'plyometrics'
  if (/coordination|balance|reaction|rhythm/.test(t)) return 'coordination'
  if (/mobility|flexibility|hip|shoulder|ankle/.test(t)) return 'mobility'
  if (/recovery|cool.?down|regeneration/.test(t)) return 'recovery'
  return 'standard'
}

// -- Block set definitions ----------------------------------------------------
// Returns an ordered list of FitnessBlockType for each session type + goal combo.
// Always starts with movement (warm-up) and ends with recovery_cool_down.

function selectBlockSet(sessionType: FitnessSessionType, goal: string): FitnessBlockType[] {
  switch (sessionType) {
    case 'pre_tournament':
      return ['movement', 'speed', 'plyometrics', 'agility', 'recovery_cool_down']

    case 'post_tournament':
    case 'recovery':
      return ['movement', 'mobility', 'coordination', 'recovery_cool_down']

    case 'high_intensity':
      return ['movement', 'speed', 'agility', 'plyometrics', 'strength', 'recovery_cool_down']

    case 'low_load':
      return ['movement', 'coordination', 'mobility', 'recovery_cool_down']

    case 'assessment':
      return ['movement', 'agility', 'speed', 'strength', 'coordination', 'recovery_cool_down']

    case 'standard':
    default:
      switch (goal) {
        case 'speed':
          return ['movement', 'speed', 'plyometrics', 'agility', 'recovery_cool_down']
        case 'agility':
          return ['movement', 'agility', 'speed', 'coordination', 'recovery_cool_down']
        case 'strength':
          return ['movement', 'strength', 'plyometrics', 'coordination', 'recovery_cool_down']
        case 'plyometrics':
          return ['movement', 'plyometrics', 'speed', 'agility', 'recovery_cool_down']
        case 'coordination':
          return ['movement', 'coordination', 'agility', 'mobility', 'recovery_cool_down']
        case 'mobility':
          return ['movement', 'mobility', 'coordination', 'recovery_cool_down']
        case 'recovery':
          return ['movement', 'mobility', 'recovery_cool_down']
        default:
          // Balanced standard session
          return ['movement', 'agility', 'speed', 'strength', 'coordination', 'mobility', 'recovery_cool_down']
      }
  }
}

// -- Duration allocation ------------------------------------------------------
// Scales default block durations proportionally to fit the total session length.

function allocateFitnessBlockDurations(
  blockTypes: FitnessBlockType[],
  totalMinutes: number,
): Record<FitnessBlockType, number> {
  const rawDurations = blockTypes.map(t => getDefaultBlockDuration(t))
  const rawTotal = rawDurations.reduce((a, b) => a + b, 0)
  const scaled = rawDurations.map(d => Math.max(3, Math.round((d / rawTotal) * totalMinutes)))

  // Ensure sum equals totalMinutes
  const scaledTotal = scaled.reduce((a, b) => a + b, 0)
  const diff = totalMinutes - scaledTotal
  if (diff !== 0 && scaled.length > 0) {
    // Add diff to the largest block
    const maxIdx = scaled.indexOf(Math.max(...scaled))
    scaled[maxIdx] = Math.max(3, scaled[maxIdx] + diff)
  }

  const result: Partial<Record<FitnessBlockType, number>> = {}
  blockTypes.forEach((t, i) => { result[t] = scaled[i] })
  return result as Record<FitnessBlockType, number>
}

// -- Static coach cues and tennis transfer notes ------------------------------

const FITNESS_COACH_CUES: Record<FitnessBlockType, string> = {
  movement: 'Ensure full range of motion; activate glutes and core before dynamic drills.',
  agility: 'Cue sharp cuts with low center of gravity; reinforce athletic deceleration.',
  speed: 'Focus on acceleration mechanics; cue correct arm drive and forward lean.',
  plyometrics: 'Emphasize landing mechanics; cue soft knees and stable core on impact.',
  strength: 'Cue body tension throughout; reinforce neutral spine in all movements.',
  coordination: 'Vary rhythm and timing challenges; note reaction quality and balance recovery.',
  mobility: 'Hold positions 2-3 breaths; never push into pain; reinforce active mobility range.',
  recovery_cool_down: 'Transition to parasympathetic; cue deep breathing and full relaxation.',
}

const FITNESS_TENNIS_TRANSFER: Record<FitnessBlockType, string> = {
  movement: 'Mirrors on-court split step and first-step patterns used in baseline rallies.',
  agility: 'Trains change-of-direction explosiveness needed for wide balls and approach shots.',
  speed: 'Develops linear acceleration used for short balls, overheads, and court coverage.',
  plyometrics: 'Builds explosive leg drive for serve, volley, and overhead mechanics.',
  strength: 'Core stability translates to shot consistency and injury resilience on court.',
  coordination: 'Improves hand-eye, footwork, and reaction time to ball trajectory changes.',
  mobility: 'Ensures full court coverage through hip, shoulder, and ankle range of motion.',
  recovery_cool_down: 'Accelerates recovery between tournament matches and multi-match days.',
}

// -- Draft builder ------------------------------------------------------------

function buildFitnessDraft(text: string): FitnessDraft {
  const ageGroup = extractAgeGroup(text)
  const sessionType = extractSessionType(text)
  const trainingGoal = extractTrainingGoal(text)
  const duration = extractDuration(text) ?? (sessionType === 'recovery' ? 30 : sessionType === 'low_load' ? 40 : 60)

  const blockTypes = selectBlockSet(sessionType, trainingGoal)
  const durations = allocateFitnessBlockDurations(blockTypes, duration)

  const blocks: FitnessDraftBlock[] = blockTypes.map(t => ({
    type: t,
    label: getFitnessBlockLabel(t),
    durationMin: durations[t],
    coachCue: FITNESS_COACH_CUES[t],
    tennisTransferNote: FITNESS_TENNIS_TRANSFER[t],
  }))

  const goalLabel = trainingGoal !== 'standard' ? ` (${trainingGoal} focus)` : ''
  const ageLabel = ageGroup ? ` -- ${ageGroup}` : ''
  const typeLabel: Record<FitnessSessionType, string> = {
    standard: 'Fitness Session',
    pre_tournament: 'Pre-Tournament Fitness',
    post_tournament: 'Post-Tournament Recovery',
    high_intensity: 'High-Intensity Fitness',
    low_load: 'Low-Load Fitness',
    assessment: 'Fitness Assessment',
    recovery: 'Recovery Session',
  }

  const name = `${typeLabel[sessionType]}${goalLabel}${ageLabel} (${duration} min)`

  return { name, sessionType, ageGroup, trainingGoal, durationMinutes: duration, blocks }
}

// -- Answer builder -----------------------------------------------------------

function buildFitnessDraftAnswer(draft: FitnessDraft): DonnaSafeReadAnswer {
  const blockLines = draft.blocks.map(b => {
    const intent = getFitnessBlockIntent(b.type)
    return [
      `**${b.label}** -- ${b.durationMin} min`,
      `Intent: ${intent}`,
      `Coach cue: ${b.coachCue}`,
      `Tennis transfer: ${b.tennisTransferNote}`,
    ].join('\n')
  }).join('\n\n')

  const ageNote = draft.ageGroup ? ` for ${draft.ageGroup}` : ''

  const text = [
    `**Fitness Template Draft -- ${draft.name}**`,
    '',
    `Session type: ${draft.sessionType.replace(/_/g, ' ')}${ageNote} | Total: ${draft.durationMinutes} min`,
    '',
    blockLines,
    '',
    'All blocks include tennis-transfer rationale and coach cues. This draft is ready for your review. Nothing is saved until you approve it. Want me to take you to Fitness Templates?',
  ].join('\n')

  return {
    actionId: 'fitness_draft_complete',
    text,
    confidence: 'high',
    sourceNote: 'Fitness template draft from session intent',
    followUp: 'Take me to Fitness Templates',
    href: '/director/fitness/templates',
    isAnswerable: true,
  }
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 736).
// Returns null if the text is not a fitness template creation request.

export function tryAnswerFitnessDraftRequest(text: string): FitnessDraftAnswerResult | null {
  if (!isFitnessCreationIntent(text)) return null
  const draft = buildFitnessDraft(text)
  return { answer: buildFitnessDraftAnswer(draft), isComplete: true }
}
