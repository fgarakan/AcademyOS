// Task intent detection — maps user voice/typed input to a DonnaTaskId.
// Local keyword matching only. No AI, no API, no DB.
//
// create_class_template is deliberately excluded from this file.
// That flow is handled by isTemplateCreationIntent() from templateDraftParser.ts
// and is always routed through the wired TemplateDraftPanel, not GenericDraftPanel.

import type { DonnaTaskId } from './donnaTaskContracts'

export interface TaskIntentResult {
  taskId: DonnaTaskId | null
  confidence: 'low' | 'medium' | 'high'
  matchedPhrases: string[]
}

// Keyword maps per task — ordered most-specific first per entry.
// Phrases are checked via lower.includes(), so order within each array matters.
const TASK_INTENT_KEYWORDS: Array<{ taskId: DonnaTaskId; keywords: string[] }> = [
  {
    taskId: 'create_fitness_template',
    keywords: [
      'fitness template',
      'create a fitness',
      'build a fitness',
      'create fitness',
      'build fitness',
      'conditioning template',
      'training template',
      'physical training template',
      'speed and agility template',
      'fitness session template',
      'mobility session',
    ],
  },
  {
    taskId: 'populate_session_from_template',
    keywords: [
      'populate session',
      'populate this session',
      'populate blocks',
      'add blocks to session',
      'build session blocks',
      'session blocks',
      'prepare session for coach',
      'copy blocks',
      'fill session blocks',
      'populate the session',
    ],
  },
  {
    taskId: 'create_session',
    keywords: [
      'create a session',
      'schedule a session',
      'create session',
      'schedule session',
      'new session',
      'plan a session',
      'plan session',
      'book a session',
      'book session',
      'set up a session',
    ],
  },
  {
    taskId: 'capture_coach_note',
    keywords: [
      'coach note',
      'capture a note',
      'capture an observation',
      'player observation',
      'observation about',
      'observation for',
      'note about a player',
      'note for a player',
      'i noticed',
      'save an observation',
      'notes for',
      'capture notes',
      'capture today',
      "today's notes",
    ],
  },
  {
    taskId: 'draft_parent_update',
    keywords: [
      'parent update',
      'parent message',
      'update for parent',
      'message to parent',
      'draft parent',
      'parent communication',
      'write to parent',
      'write an update for',
      'an update for',
      'draft an update',
      "parents'",
    ],
  },
  {
    taskId: 'draft_player_note',
    keywords: [
      'player development note',
      'draft a player note',
      'write a player note',
      'player note',
      'development note',
    ],
  },
  {
    taskId: 'review_level_readiness',
    keywords: [
      'level readiness',
      'ready to advance',
      'level up',
      'advance level',
      'level review',
      'is this player ready',
      'player advancement',
      'check level readiness',
    ],
  },
  {
    taskId: 'handle_attendance_exception',
    keywords: [
      'attendance exception',
      'player missed',
      'mark absent',
      'mark attendance',
      'take attendance',
      'record attendance',
      'late arrival',
      'make up session',
      'makeup session',
      'attendance issue',
      'unrostered attendee',
      'missed session',
      'everyone was here',
      'everyone was present',
      'absent today',
      'was absent',
      'showed up',
      'not on the roster',
    ],
  },
  {
    taskId: 'adjust_curriculum',
    keywords: [
      'adjust curriculum',
      'curriculum change',
      'curriculum adjustment',
      'modify curriculum',
      'curriculum update',
      'add drill',
      'remove drill',
    ],
  },
  {
    taskId: 'create_group',
    keywords: [
      'create a group',
      'create group',
      'new group',
      'build a group',
      'add a group',
    ],
  },
  {
    taskId: 'assign_player_to_group',
    keywords: [
      'assign player to group',
      'add player to group',
      'move player to group',
      'put player in group',
      'assign to group',
      'add to group',
    ],
  },
  {
    taskId: 'invite_coach',
    keywords: [
      'invite a coach',
      'add a coach',
      'add coach',
      'invite coach',
      'add as a coach',
      'add as coach',
      'register a coach',
      'onboard a coach',
      'new coach',
      'coach invitation',
    ],
  },
  {
    taskId: 'reassign_player_group',
    keywords: [
      'reassign player',
      'move player to',
      'switch player to',
      'change player group',
      'move player',
      'reassign to group',
      'transfer player',
      'move to another group',
      'move to a different group',
      'change group for',
      'switch to group',
    ],
  },
  {
    taskId: 'assign_coach_to_group',
    keywords: [
      'assign coach to group',
      'assign coach to',
      'add coach to group',
      'assign as coach',
      'assign as primary coach',
      'add as primary coach',
      'coach to group',
      'assign a coach to',
    ],
  },
  {
    taskId: 'summarize_player_progress',
    keywords: [
      'player progress',
      'summarize player',
      'player summary',
      'how is this player doing',
      'progress report',
      'player report',
      'summarize progress',
    ],
  },
  {
    taskId: 'recommend_template_for_group',
    keywords: [
      'recommend a template',
      'recommend template',
      'template recommendation',
      'which template',
      'best template for',
      'suggest a template',
      'what template should',
    ],
  },
]

// Pattern-based detection for entity-interpolated commands where an entity name
// interrupts the phrase, making simple includes() matching impossible.
// E.g. "Move Emma to Green Ball" — "emma" sits between "move" and "to [group]".
const ENTITY_INTERPOLATED_PATTERNS: Array<{ taskId: DonnaTaskId; pattern: RegExp; phrase: string }> = [
  // "Move Emma to Green Ball" / "Move Noah to Red Ball"
  { taskId: 'reassign_player_group', pattern: /^move [a-z]+ to [a-z]/i, phrase: 'move [name] to [group]' },
  // "Reassign Emma to Red Ball"
  { taskId: 'reassign_player_group', pattern: /^reassign [a-z]+ to [a-z]/i, phrase: 'reassign [name] to [group]' },
]

export function detectTaskIntent(text: string): TaskIntentResult {
  const lower = text.toLowerCase()

  // Check entity-interpolated patterns first — these can't be matched by includes()
  for (const { taskId, pattern, phrase } of ENTITY_INTERPOLATED_PATTERNS) {
    if (pattern.test(lower)) {
      return { taskId, confidence: 'high', matchedPhrases: [phrase] }
    }
  }

  const matches: Array<{ taskId: DonnaTaskId; count: number; phrases: string[] }> = []

  for (const { taskId, keywords } of TASK_INTENT_KEYWORDS) {
    const matched = keywords.filter(kw => lower.includes(kw))
    if (matched.length > 0) {
      matches.push({ taskId, count: matched.length, phrases: matched })
    }
  }

  if (matches.length === 0) {
    return { taskId: null, confidence: 'low', matchedPhrases: [] }
  }

  // Most specific match wins — sort by count desc, then longest phrase desc
  matches.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    const aLongest = a.phrases.reduce((l, p) => (p.length > l.length ? p : l), '')
    const bLongest = b.phrases.reduce((l, p) => (p.length > l.length ? p : l), '')
    return bLongest.length - aLongest.length
  })

  const top = matches[0]
  const longestPhrase = top.phrases.reduce(
    (longest, p) => (p.length > longest.length ? p : longest),
    '',
  )

  const confidence: 'low' | 'medium' | 'high' =
    top.count >= 2
      ? 'high'
      : longestPhrase.split(' ').length >= 3
      ? 'medium'
      : 'low'

  return {
    taskId: top.taskId,
    confidence,
    matchedPhrases: top.phrases,
  }
}
