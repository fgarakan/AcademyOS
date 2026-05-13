// Deterministic template intent parser — no AI, no API calls.
// All logic is local keyword matching and proportional math.

import type {
  TemplateDraft,
  TemplateDraftBlock,
  TemplateDraftBlockCategory,
  TemplateDraftQuestion,
  TemplateDraftQuestionField,
} from './templateDraftTypes'

// ─── ID generation ────────────────────────────────────────────────────────────

let _idCounter = 0
export function generateBlockId(): string {
  return `block_${Date.now()}_${++_idCounter}`
}

// ─── Intent detection ─────────────────────────────────────────────────────────

const CREATION_KEYWORDS = [
  'create template',
  'build template',
  'make template',
  'new template',
  'class template',
  'build a class',
  'create a class',
  'help me create',
  'help me build',
  'i want a template',
  'start a template',
  'template for',
]

const BLOCK_SIGNAL_KEYWORDS = [
  'warm-up', 'warmup', 'warm up', 'dynamic warm',
  'rally skills', 'rally', 'point play', 'match play', 'matches',
  'technical', 'technique', 'fitness',
]

export function isTemplateCreationIntent(text: string): boolean {
  const lower = text.toLowerCase()
  if (CREATION_KEYWORDS.some(kw => lower.includes(kw))) return true
  // Secondary: "template" + a block signal — e.g. "template with warm-up and matches"
  if (lower.includes('template') && BLOCK_SIGNAL_KEYWORDS.some(kw => lower.includes(kw))) return true
  return false
}

// ─── Level extraction ─────────────────────────────────────────────────────────

// Ordered longest-first so "High Performance" matches before plain words
const LEVELS = [
  'High Performance 3', 'High Performance 2', 'High Performance 1',
  'Yellow 3', 'Yellow 2', 'Yellow 1',
  'Green 3', 'Green 2', 'Green 1',
  'Orange 3', 'Orange 2', 'Orange 1',
  'Red 3', 'Red 2', 'Red 1',
]

export function extractLevel(text: string): string | null {
  const lower = text.toLowerCase()
  for (const level of LEVELS) {
    if (lower.includes(level.toLowerCase())) return level
  }
  return null
}

// ─── Duration extraction ──────────────────────────────────────────────────────

export function extractDuration(text: string): number | null {
  const lower = text.toLowerCase()
  if (lower.includes('hour and a half') || lower.includes('1.5 hour')) return 90
  const match = lower.match(/(\d+)\s*(?:min(?:utes?)?|mins?)/)
  if (match) {
    const val = parseInt(match[1], 10)
    if (val > 0 && val <= 300) return val
  }
  return null
}

// ─── Block extraction ─────────────────────────────────────────────────────────

interface BlockPattern {
  patterns: string[]
  name: string
  category: TemplateDraftBlockCategory
}

// Ordered most-specific first so "standard warm-up" matches before plain "warm-up"
const BLOCK_PATTERNS: BlockPattern[] = [
  {
    patterns: ['standard warm-up', 'standard warmup', 'standard warm up'],
    name: 'Standard Warm-Up',
    category: 'warm_up',
  },
  {
    patterns: ['dynamic warm-up', 'dynamic warmup', 'dynamic warm up', 'dynamic warm'],
    name: 'Dynamic Warm-Up',
    category: 'dynamic_warm_up',
  },
  {
    patterns: ['rally skills', 'rallying skills'],
    name: 'Rally Skills',
    category: 'rally',
  },
  {
    patterns: ['point play', 'points play', 'playing points'],
    name: 'Point Play',
    category: 'point_play',
  },
  {
    patterns: ['match play', 'match plays', 'matches', 'match time'],
    name: 'Match Play',
    category: 'match_play',
  },
  {
    patterns: ['serve work', 'serve practice', 'serves', 'serving work'],
    name: 'Serve Work',
    category: 'technical',
  },
  {
    patterns: ['footwork drills', 'footwork'],
    name: 'Footwork',
    category: 'fitness',
  },
  {
    patterns: ['fitness', 'conditioning', 'physical conditioning'],
    name: 'Fitness',
    category: 'fitness',
  },
  {
    patterns: ['technical skill', 'technique work', 'technical work', 'technique', 'technical'],
    name: 'Technical Skill Work',
    category: 'technical',
  },
  {
    // Generic "rally" after specific "rally skills" has been checked
    patterns: ['rally'],
    name: 'Rally Skills',
    category: 'rally',
  },
  {
    // Generic warm-up after specific ones have been checked
    patterns: ['warm-up', 'warmup', 'warm up'],
    name: 'Warm-Up',
    category: 'warm_up',
  },
]

export function extractBlocks(text: string): TemplateDraftBlock[] {
  const lower = text.toLowerCase()
  const found: TemplateDraftBlock[] = []
  // Key = category + name to prevent exact duplicates while allowing "Serve Work" and "Technical Skill Work"
  const seen = new Set<string>()

  for (const pattern of BLOCK_PATTERNS) {
    const matched = pattern.patterns.some(p => lower.includes(p))
    const key = `${pattern.category}::${pattern.name}`
    if (matched && !seen.has(key)) {
      seen.add(key)
      found.push({
        id: generateBlockId(),
        name: pattern.name,
        category: pattern.category,
        durationMinutes: null,
        order: found.length,
      })
    }
  }

  return found
}

// ─── Missing question computation ─────────────────────────────────────────────

export function computeMissingQuestions(draft: TemplateDraft): TemplateDraftQuestion[] {
  const questions: TemplateDraftQuestion[] = []

  if (!draft.level) {
    questions.push({
      id: 'q_level',
      question: 'What level is this template for? (e.g. Orange 2, Red 1, Yellow 3)',
      field: 'level',
    })
  }

  if (!draft.durationMinutes) {
    questions.push({
      id: 'q_duration',
      question: 'How long is this class? (e.g. 60 minutes, 90 minutes)',
      field: 'durationMinutes',
    })
  }

  if (draft.blocks.length === 0) {
    questions.push({
      id: 'q_blocks',
      question:
        'What blocks do you want? (e.g. warm-up, rally skills, point play, matches)',
      field: 'blockDurations',
    })
  }

  return questions
}

// ─── Time allocation ──────────────────────────────────────────────────────────

// Category weights for proportional allocation when no predefined profile matches
const CATEGORY_WEIGHT: Record<TemplateDraftBlockCategory | 'other', number> = {
  warm_up: 0.09,
  dynamic_warm_up: 0.11,
  technical: 0.25,
  rally: 0.25,
  point_play: 0.25,
  match_play: 0.30,
  fitness: 0.15,
  other: 0.15,
}

// Predefined allocations for the canonical 5-block Orange/Yellow class structure
const STANDARD_5_AT_60 = [6, 8, 16, 15, 15]
const STANDARD_5_AT_90 = [8, 10, 22, 25, 25]

function isStandard5Block(blocks: TemplateDraftBlock[]): boolean {
  if (blocks.length !== 5) return false
  const cats = blocks.map(b => b.category)
  return (
    cats[0] === 'warm_up' &&
    cats[1] === 'dynamic_warm_up' &&
    cats[2] === 'rally' &&
    cats[3] === 'point_play' &&
    cats[4] === 'match_play'
  )
}

export function allocateBlockDurations(draft: TemplateDraft, totalMinutes: number): TemplateDraft {
  const blocks = draft.blocks
  if (blocks.length === 0) return { ...draft, durationMinutes: totalMinutes }

  // Use the exact predefined allocations for the canonical 5-block structure
  if (isStandard5Block(blocks)) {
    if (totalMinutes === 60) {
      return {
        ...draft,
        durationMinutes: totalMinutes,
        blocks: blocks.map((b, i) => ({ ...b, durationMinutes: STANDARD_5_AT_60[i] })),
      }
    }
    if (totalMinutes === 90) {
      return {
        ...draft,
        durationMinutes: totalMinutes,
        blocks: blocks.map((b, i) => ({ ...b, durationMinutes: STANDARD_5_AT_90[i] })),
      }
    }
  }

  // General proportional allocation
  const weights = blocks.map(b => CATEGORY_WEIGHT[b.category] ?? 0.20)
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const rawMinutes = weights.map(w => Math.round((w / totalWeight) * totalMinutes))

  // Adjust so the sum exactly equals totalMinutes
  const sum = rawMinutes.reduce((a, b) => a + b, 0)
  const diff = totalMinutes - sum
  const minutes = [...rawMinutes]
  if (diff !== 0 && minutes.length > 0) {
    const maxIdx = minutes.indexOf(Math.max(...minutes))
    minutes[maxIdx] = Math.max(1, minutes[maxIdx] + diff)
  }

  return {
    ...draft,
    durationMinutes: totalMinutes,
    blocks: blocks.map((b, i) => ({ ...b, durationMinutes: Math.max(1, minutes[i]) })),
  }
}

// ─── Answer application ───────────────────────────────────────────────────────

export function applyAnswerToField(
  draft: TemplateDraft,
  field: TemplateDraftQuestionField,
  value: string,
): TemplateDraft {
  let updated: TemplateDraft

  switch (field) {
    case 'level': {
      const level = extractLevel(value) ?? (value.trim() || null)
      updated = { ...draft, level }
      break
    }
    case 'durationMinutes': {
      const mins = extractDuration(value) ?? (parseInt(value.trim(), 10) || null)
      updated =
        mins && draft.blocks.length > 0
          ? allocateBlockDurations({ ...draft, durationMinutes: mins }, mins)
          : { ...draft, durationMinutes: mins }
      break
    }
    case 'blockDurations': {
      const blocks = extractBlocks(value)
      const base = { ...draft, blocks }
      updated =
        draft.durationMinutes && blocks.length > 0
          ? allocateBlockDurations(base, draft.durationMinutes)
          : base
      break
    }
    case 'templateName': {
      updated = { ...draft, templateName: value.trim() }
      break
    }
    default:
      updated = draft
  }

  const missingQuestions = computeMissingQuestions({ ...updated, missingQuestions: [] })
  return { ...updated, missingQuestions }
}

// ─── Draft readiness check ────────────────────────────────────────────────────

export function isDraftReadyForReview(draft: TemplateDraft): boolean {
  return (
    draft.templateName.trim().length > 0 &&
    draft.level !== null &&
    draft.durationMinutes !== null &&
    draft.durationMinutes > 0 &&
    draft.blocks.length > 0 &&
    draft.blocks.every(b => b.durationMinutes !== null && b.durationMinutes > 0)
  )
}

// ─── Full parse from a free-text command ─────────────────────────────────────

export function parseTemplateDraft(text: string): TemplateDraft {
  const level = extractLevel(text)
  const durationMinutes = extractDuration(text)
  const blocks = extractBlocks(text)

  // Build a template name from level + dominant block theme
  const themeBlocks = blocks.filter(b =>
    ['match_play', 'point_play', 'rally', 'technical'].includes(b.category),
  )
  const blockTheme =
    themeBlocks.length > 0
      ? themeBlocks
          .slice(0, 2)
          .map(b => b.name)
          .join(' + ')
      : blocks.slice(0, 2).map(b => b.name).join(' + ')

  const templateName = level
    ? `${level} — ${blockTheme || 'Class Template'}`
    : blockTheme || 'Class Template'

  const base: TemplateDraft = {
    templateName,
    level,
    durationMinutes: null,
    goal: null,
    status: 'draft',
    blocks: blocks.map((b, i) => ({ ...b, order: i })),
    missingQuestions: [],
    source: 'assistant',
  }

  // If duration was in the command, allocate block times immediately
  const withDuration =
    durationMinutes && blocks.length > 0
      ? allocateBlockDurations({ ...base, durationMinutes }, durationMinutes)
      : { ...base, durationMinutes }

  const missingQuestions = computeMissingQuestions({ ...withDuration, missingQuestions: [] })
  return { ...withDuration, missingQuestions }
}
