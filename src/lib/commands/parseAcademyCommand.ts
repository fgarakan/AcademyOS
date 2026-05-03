// Deterministic command intent parser — Sprint 214
// No external AI. No DB calls. No side effects.
// Returns structured intent from natural language director command text.

export type CommandIntentType =
  | 'show_players_missing_curriculum_level'
  | 'show_curriculum_gap_suggestions'
  | 'show_advancement_eligible'
  | 'create_session_draft'
  | 'create_group_draft'
  | 'record_director_note'
  | 'ask_curriculum_level_requirements'
  | 'summarize_reassessment_pipeline'
  | 'unknown'

export type CommandConfidence = 'high' | 'medium' | 'low'

export interface ParsedCommandResult {
  intent_type: CommandIntentType
  confidence: CommandConfidence
  extracted_entities: Record<string, string>
  missing_information: string[]
  suggested_next_step: string
  requires_confirmation: boolean
  role_required: string
  will_not_do: string[]
  query_result?: string
}

// ── Pattern tables ─────────────────────────────────────────────────────────────

const MISSING_CURRICULUM_PATTERNS = [
  /missing curriculum/i,
  /no curriculum/i,
  /without.*(level|curriculum)/i,
  /curriculum.*missing/i,
  /no level assigned/i,
  /missing.*level/i,
  /level.*not.*assigned/i,
  /unassigned.*level/i,
]

const CURRICULUM_GAP_PATTERNS = [
  /curriculum gap/i,
  /gap suggest/i,
  /curriculum suggest/i,
  /suggest.*curriculum/i,
]

const ADVANCEMENT_PATTERNS = [
  /ready to advance/i,
  /advancement eligible/i,
  /eligible.*advance/i,
  /who.*advance/i,
  /advance.*who/i,
  /level up/i,
  /ready.*level/i,
]

const CREATE_SESSION_PATTERNS = [
  /create.*session/i,
  /new.*session/i,
  /draft.*session/i,
  /session.*draft/i,
  /plan.*session/i,
  /schedule.*session/i,
]

const CREATE_GROUP_PATTERNS = [
  /create.*group/i,
  /new.*group/i,
  /draft.*group/i,
  /group.*draft/i,
]

const DIRECTOR_NOTE_PATTERNS = [
  /note:/i,
  /record.*note/i,
  /save.*note/i,
  /add.*note/i,
  /director.*note/i,
  /log this/i,
  /remember this/i,
]

const CURRICULUM_REQUIREMENTS_PATTERNS = [
  /requirements? for/i,
  /what.*need.*to.*advance/i,
  /how.*to.*advance/i,
  /gates? for/i,
  /criteria.*for/i,
  /what.*advance.*from/i,
  /level.*requirement/i,
  /requirement.*level/i,
  /advance.*from/i,
  /what are the requirements?\b/i,
  /show.*requirements?\b/i,
]

const REASSESSMENT_PATTERNS = [
  /reassessment/i,
  /overdue.*assessment/i,
  /due.*assessment/i,
  /assessment.*due/i,
  /who.*reassess/i,
  /need.*reassess/i,
]

// ── Curriculum level name extraction ─────────────────────────────────────────

// Match patterns like "Orange 2", "Red 1 – Foundation", "High Performance 3"
const CURRICULUM_LEVEL_PATTERN = /\b(red|orange|green|yellow|high performance)\s*\d+(?:\s*[-–]\s*\w+)?\b/gi

function extractCurriculumLevel(text: string): string | null {
  const match = text.match(CURRICULUM_LEVEL_PATTERN)
  return match ? match[0].trim() : null
}

// ── Focus/theme extraction ────────────────────────────────────────────────────

const FOCUS_KEYWORDS = [
  'movement', 'recovery', 'serve', 'forehand', 'backhand', 'volley',
  'footwork', 'fitness', 'tactical', 'technique', 'consistency',
  'competition', 'mental', 'agility', 'speed', 'strength',
]

function extractFocus(text: string): string | null {
  const lower = text.toLowerCase()
  const found = FOCUS_KEYWORDS.filter(kw => lower.includes(kw))
  return found.length > 0 ? found.slice(0, 2).join(' and ') : null
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseAcademyCommand(input: string): ParsedCommandResult {
  const text = input.trim()

  if (!text) {
    return {
      intent_type: 'unknown',
      confidence: 'low',
      extracted_entities: {},
      missing_information: ['Command text is empty'],
      suggested_next_step: 'Type a command to get started.',
      requires_confirmation: false,
      role_required: 'academy_director',
      will_not_do: ['query_only'],
    }
  }

  // show_players_missing_curriculum_level
  if (MISSING_CURRICULUM_PATTERNS.some(p => p.test(text))) {
    return {
      intent_type: 'show_players_missing_curriculum_level',
      confidence: 'high',
      extracted_entities: {},
      missing_information: [],
      suggested_next_step: 'Fetches all active players with no curriculum level assigned. Routes to /director/players with curriculum filter.',
      requires_confirmation: false,
      role_required: 'academy_director',
      will_not_do: ['query_only', 'Does not assign levels automatically', 'Does not send notifications'],
    }
  }

  // show_curriculum_gap_suggestions
  if (CURRICULUM_GAP_PATTERNS.some(p => p.test(text))) {
    return {
      intent_type: 'show_curriculum_gap_suggestions',
      confidence: 'high',
      extracted_entities: {},
      missing_information: [],
      suggested_next_step: 'Shows pending curriculum_gap suggestions. Routes to /director/ai-suggestions.',
      requires_confirmation: false,
      role_required: 'academy_director',
      will_not_do: ['query_only', 'Does not change player levels', 'Does not generate new suggestions automatically'],
    }
  }

  // show_advancement_eligible
  if (ADVANCEMENT_PATTERNS.some(p => p.test(text))) {
    return {
      intent_type: 'show_advancement_eligible',
      confidence: 'high',
      extracted_entities: {},
      missing_information: [],
      suggested_next_step: 'Shows all active players who meet advancement criteria. Director reviews each player before any level change.',
      requires_confirmation: false,
      role_required: 'academy_director',
      will_not_do: ['query_only', 'Does not advance players automatically', 'Director must review and confirm each player'],
    }
  }

  // ask_curriculum_level_requirements
  if (CURRICULUM_REQUIREMENTS_PATTERNS.some(p => p.test(text))) {
    const level = extractCurriculumLevel(text)
    const entities: Record<string, string> = {}
    const missing: string[] = []

    if (level) {
      entities.level = level
    } else {
      missing.push('Which curriculum level? (e.g. Orange 2, Green 1)')
    }

    return {
      intent_type: 'ask_curriculum_level_requirements',
      confidence: level ? 'high' : 'medium',
      extracted_entities: entities,
      missing_information: missing,
      suggested_next_step: level
        ? `Looks up gates and requirements for ${level}. Displays advancement criteria, domain gates, thresholds.`
        : 'Specify which level to look up requirements for.',
      requires_confirmation: false,
      role_required: 'academy_director',
      will_not_do: ['query_only', 'Does not change any data'],
    }
  }

  // summarize_reassessment_pipeline
  if (REASSESSMENT_PATTERNS.some(p => p.test(text))) {
    return {
      intent_type: 'summarize_reassessment_pipeline',
      confidence: 'high',
      extracted_entities: {},
      missing_information: [],
      suggested_next_step: 'Shows players with overdue or upcoming reassessments from the academy pipeline.',
      requires_confirmation: false,
      role_required: 'academy_director',
      will_not_do: ['query_only', 'Does not schedule assessments automatically', 'Does not change player records'],
    }
  }

  // create_session_draft
  if (CREATE_SESSION_PATTERNS.some(p => p.test(text))) {
    const level = extractCurriculumLevel(text)
    const focus = extractFocus(text)
    const entities: Record<string, string> = {}
    const missing: string[] = []

    if (level) entities.level = level
    else missing.push('Which curriculum level is this session for? (e.g. Orange 2)')

    if (focus) entities.focus = focus
    else missing.push('What is the session focus? (e.g. movement, serve, tactical recovery)')

    return {
      intent_type: 'create_session_draft',
      confidence: level && focus ? 'high' : level || focus ? 'medium' : 'low',
      extracted_entities: entities,
      missing_information: missing,
      suggested_next_step: level
        ? `Creates a session draft for ${level}${focus ? ` focused on ${focus}` : ''}. Goes to director review queue — not scheduled until approved.`
        : 'Specify the curriculum level and focus to create a session draft.',
      requires_confirmation: true,
      role_required: 'academy_director',
      will_not_do: [
        'Does not create a live session',
        'Does not assign players or coaches',
        'Does not send notifications',
        'Director must approve draft before session is created',
      ],
    }
  }

  // create_group_draft
  if (CREATE_GROUP_PATTERNS.some(p => p.test(text))) {
    const level = extractCurriculumLevel(text)
    const entities: Record<string, string> = {}
    const missing: string[] = []

    if (level) entities.level = level
    else missing.push('Which curriculum level is this group for?')

    missing.push('What is the group name?')

    return {
      intent_type: 'create_group_draft',
      confidence: level ? 'medium' : 'low',
      extracted_entities: entities,
      missing_information: missing,
      suggested_next_step: 'Creates a group draft. Goes to director review queue — not created until approved.',
      requires_confirmation: true,
      role_required: 'academy_director',
      will_not_do: [
        'Does not create a live group',
        'Does not assign players automatically',
        'Director must approve draft',
      ],
    }
  }

  // record_director_note
  if (DIRECTOR_NOTE_PATTERNS.some(p => p.test(text))) {
    const noteText = text.replace(/^(note:|record note:|add note:|save note:)/i, '').trim()
    const entities: Record<string, string> = {}
    if (noteText) entities.note_text = noteText.slice(0, 200)

    return {
      intent_type: 'record_director_note',
      confidence: noteText ? 'high' : 'medium',
      extracted_entities: entities,
      missing_information: noteText ? [] : ['Note content is empty'],
      suggested_next_step: 'Records a director note to the academy log.',
      requires_confirmation: true,
      role_required: 'academy_director',
      will_not_do: [
        'Does not update player profiles',
        'Does not send notifications',
        'Note is internal only',
      ],
    }
  }

  // unknown
  return {
    intent_type: 'unknown',
    confidence: 'low',
    extracted_entities: {},
    missing_information: ['Command not recognized'],
    suggested_next_step: 'Try one of the example commands, or rephrase. Supported: show missing levels, curriculum gaps, session drafts, level requirements, reassessment pipeline.',
    requires_confirmation: false,
    role_required: 'academy_director',
    will_not_do: ['query_only', 'No action taken — command not recognized'],
  }
}
