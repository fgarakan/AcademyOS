// Sprint 242 — Voice Intake Draft Model V1
// Pure deterministic helper. No DB calls. No AI. No side effects.
// Accepts role + transcript + context, returns a structured VoiceIntakeDraft.

import type {
  VoiceIntakeRole,
  VoiceIntakeContext,
  VoiceIntakeIntentType,
  VoiceDestinationModule,
  VoiceSafetyFlag,
  VoiceExtractedEntity,
  VoiceIntakeDraft,
  VoiceIntakeStructureInput,
  VoiceIntakeStructureResult,
} from './voiceIntakeTypes'

// ── Text cleaning ─────────────────────────────────────────────────────────────

function cleanTranscript(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/["""'']/g, '"')
}

// ── Curriculum level extraction ───────────────────────────────────────────────

const CURRICULUM_LEVEL_RE = /\b(red|orange|green|yellow|high performance)\s*\d+(?:\s*[-–]\s*\w+)?\b/gi

function extractCurriculumLevels(text: string): string[] {
  const matches = text.match(CURRICULUM_LEVEL_RE)
  return matches ? Array.from(new Set(matches.map(m => m.trim()))) : []
}

// ── Player name extraction (heuristic) ───────────────────────────────────────

// Captures names following: "except", "besides", "everyone except",
// single capitalised words after common player cues
const ABSENCE_RE = /\bexcept\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
const PLAYER_OBSERVATION_RE = /\b([A-Z][a-z]+)\s+(?:showed|recovered|understood|executed|demonstrated|struggled|is close|is ready)/g
const UNROSTERED_RE = /\b([A-Z][a-z]+)\s+(?:showed up|turned up|arrived|appeared)\b/gi

function extractPlayerNames(text: string): string[] {
  const names: string[] = []
  let m: RegExpExecArray | null

  const absRe = new RegExp(ABSENCE_RE.source, ABSENCE_RE.flags)
  while ((m = absRe.exec(text)) !== null) names.push(m[1].trim())

  const obsRe = new RegExp(PLAYER_OBSERVATION_RE.source, PLAYER_OBSERVATION_RE.flags)
  while ((m = obsRe.exec(text)) !== null) names.push(m[1].trim())

  const unrostRe = new RegExp(UNROSTERED_RE.source, UNROSTERED_RE.flags)
  while ((m = unrostRe.exec(text)) !== null) names.push(m[1].trim())

  return Array.from(new Set(names))
}

// ── Focus keyword extraction ──────────────────────────────────────────────────

const FOCUS_KEYWORDS = [
  'movement', 'recovery', 'serve', 'forehand', 'backhand', 'volley',
  'footwork', 'fitness', 'tactical', 'technique', 'consistency',
  'competition', 'mental', 'agility', 'speed', 'strength', 'wide ball',
  'cross-court', 'down the line', 'approach', 'net', 'baseline',
]

function extractFocusKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return FOCUS_KEYWORDS.filter(kw => lower.includes(kw))
}

// ── Group name extraction ─────────────────────────────────────────────────────

const GROUP_RE = /\b(Orange|Red|Green|Yellow|High Performance)\s*\d+(?:\s+[A-Za-z]+)?\s+(?:group|players|team|squad)\b/gi

function extractGroupNames(text: string): string[] {
  const matches = text.match(GROUP_RE)
  return matches ? Array.from(new Set(matches.map(m => m.trim()))) : []
}

// ── Safety flag detection ─────────────────────────────────────────────────────

function detectSafetyFlags(text: string): VoiceSafetyFlag[] {
  const lower = text.toLowerCase()
  const flags: VoiceSafetyFlag[] = []

  if (
    /\b(send|email|message|notify|tell|contact|update)\b.*(parent|guardian|family|mom|dad)/i.test(text) ||
    /\b(parent|guardian|family)\b.*(update|message|email|draft|explain|notify|send)/i.test(text)
  ) {
    flags.push('parent_exposure_risk')
    flags.push('parent_send_requested')
  }

  if (/\b(do it|apply now|apply this|execute|run it|make it happen|go ahead)\b/i.test(text)) {
    flags.push('auto_execution_requested')
  }

  if (/\b(move up|promote|level up|upgrade|change level|new level)\b/i.test(text) ||
      /\bmove\s+\w+\s+up\b/i.test(text) ||
      /\b(move to|advance to)\s+(orange|green|red|yellow|high performance)/i.test(text)) {
    flags.push('level_change_requested')
  }

  if (/\b(add player|create player|new player|enroll|register|sign up|billing|invoice|payment)\b/i.test(text)) {
    flags.push('roster_mutation_requested')
  }

  if (/\b(billing|invoice|payment|fee|charge|enrollment|enroll|register)\b/i.test(lower)) {
    flags.push('billing_enrollment_risk')
  }

  // Cross-player leak risk: multiple distinct capitalised names mentioned together
  const allCaps = text.match(/\b[A-Z][a-z]+\b/g) ?? []
  const uniqueNames = new Set(allCaps)
  if (uniqueNames.size >= 3) {
    flags.push('cross_player_leak_risk')
  }

  return Array.from(new Set(flags))
}

// ── Intent detection ──────────────────────────────────────────────────────────

// Director-only intent patterns
const DIRECTOR_SESSION_PATTERNS = [
  /create.*session/i, /new.*session/i, /draft.*session/i, /session.*draft/i,
  /plan.*session/i, /schedule.*session/i,
]
const DIRECTOR_GROUP_PATTERNS = [
  /create.*group/i, /new.*group/i, /draft.*group/i, /group.*draft/i,
]
const GROUP_FOCUS_PATTERNS = [
  /group.*focus/i, /focus.*group/i, /watching.*for/i, /coaches watching/i,
  /set.*focus/i, /focus.*on/i,
]
const PLAYER_REVIEW_PATTERNS = [
  /player.*review/i, /review.*player/i, /fast.?track/i, /gate.*review/i,
  /advancement.*review/i, /look at\b/i,
]
const PARENT_DRAFT_PATTERNS = [
  /parent.*update/i, /draft.*parent/i, /parent.*draft/i,
  /message.*parent/i, /parent.*message/i, /parent.*explain/i,
]
const CURRICULUM_GAP_PATTERNS = [
  /curriculum.*gap/i, /gap.*suggest/i, /missing.*evidence/i, /evidence.*missing/i,
  /missing.*curriculum/i, /no.*curriculum/i,
]
const COACH_BRIEFING_PATTERNS = [
  /coach.*brief/i, /brief.*coach/i, /coaching.*team/i, /briefing/i,
]
const DIRECTOR_NOTE_PATTERNS = [
  /note:/i, /record.*note/i, /save.*note/i, /add.*note/i, /director.*note/i,
  /log this/i, /remember this/i,
]

// Coach-only intent patterns
const ATTENDANCE_EXCEPTION_PATTERNS = [
  /except\b/i, /absent/i, /not here/i, /didn.t.*come/i, /missed.*session/i,
  /not.*attending/i, /skipped/i, /away today/i, /everyone.*except/i,
]
const UNROSTERED_PATTERNS = [
  /showed up/i, /turned up/i, /not.*on.*roster/i, /not.*rostered/i,
  /isn.t.*on.*roster/i, /don.t.*think.*roster/i,
]
const OBSERVATION_PATTERNS = [
  /showed/i, /recovered/i, /understood/i, /executed/i, /demonstrated/i,
  /struggling/i, /improvement/i, /worked on/i, /did well/i, /close to/i,
  /ready for/i, /strong.*in/i,
]
const EVIDENCE_PATTERNS = [
  /gate/i, /evidence/i, /close to.*gate/i, /worth.*director/i, /worth.*look/i,
  /ready.*advance/i,
]
const SESSION_RECAP_PATTERNS = [
  /session.*today/i, /today.*session/i, /today.*we/i, /we.*today/i,
  /group.*today/i, /everyone.*today/i,
]
const GAP_SIGNAL_PATTERNS = [
  /gap/i, /struggling.*with/i, /needs.*work/i, /not.*getting/i, /rushed/i,
  /can.t.*seem/i, /consistently.*missing/i,
]
const PARENT_CANDIDATE_PATTERNS = [
  /worth.*sharing.*parent/i, /parent.*would.*like/i, /good.*update.*parent/i,
  /safe.*for.*parent/i,
]
const ALERT_DIRECTOR_PATTERNS = [
  /alert.*director/i, /flag.*director/i, /director.*should.*know/i, /let.*director.*know/i,
  /flag for/i, /flag this/i,
]

function detectIntentsForRole(
  text: string,
  role: VoiceIntakeRole,
): VoiceIntakeIntentType[] {
  const intents: VoiceIntakeIntentType[] = []

  const isDirector = role === 'academy_director' || role === 'head_coach'
  const isCoach = role === 'coach' || role === 'head_coach'

  if (isDirector) {
    if (DIRECTOR_SESSION_PATTERNS.some(p => p.test(text))) intents.push('create_session_draft')
    if (DIRECTOR_GROUP_PATTERNS.some(p => p.test(text))) intents.push('create_group_draft')
    if (GROUP_FOCUS_PATTERNS.some(p => p.test(text)) && !intents.includes('create_group_draft')) intents.push('set_group_focus')
    if (PLAYER_REVIEW_PATTERNS.some(p => p.test(text))) intents.push('create_player_review_request')
    if (PARENT_DRAFT_PATTERNS.some(p => p.test(text))) intents.push('create_parent_safe_draft')
    if (CURRICULUM_GAP_PATTERNS.some(p => p.test(text))) intents.push('summarize_curriculum_gaps')
    if (COACH_BRIEFING_PATTERNS.some(p => p.test(text))) intents.push('create_coach_briefing')
    if (DIRECTOR_NOTE_PATTERNS.some(p => p.test(text))) intents.push('record_director_note')
  }

  if (isCoach) {
    if (ATTENDANCE_EXCEPTION_PATTERNS.some(p => p.test(text))) intents.push('record_attendance_exception')
    if (UNROSTERED_PATTERNS.some(p => p.test(text))) intents.push('flag_unrostered_attendee')
    if (OBSERVATION_PATTERNS.some(p => p.test(text))) intents.push('create_player_observation')
    if (EVIDENCE_PATTERNS.some(p => p.test(text))) intents.push('create_gate_evidence_draft')
    if (SESSION_RECAP_PATTERNS.some(p => p.test(text))) intents.push('create_session_recap')
    if (GAP_SIGNAL_PATTERNS.some(p => p.test(text))) intents.push('create_gap_signal')
    if (PARENT_CANDIDATE_PATTERNS.some(p => p.test(text))) intents.push('create_parent_safe_candidate')
    if (ALERT_DIRECTOR_PATTERNS.some(p => p.test(text))) intents.push('alert_director')
  }

  if (intents.length === 0) intents.push('unknown')
  return Array.from(new Set(intents))
}

// ── Destination mapping ───────────────────────────────────────────────────────

const INTENT_TO_DESTINATIONS: Record<VoiceIntakeIntentType, VoiceDestinationModule[]> = {
  create_session_draft: ['session_planning', 'director_review_queue'],
  create_group_draft: ['group_planning', 'director_review_queue'],
  set_group_focus: ['group_planning', 'coach_briefing', 'director_review_queue'],
  create_player_review_request: ['player_observation', 'director_review_queue'],
  create_parent_safe_draft: ['parent_safe_draft', 'director_review_queue'],
  summarize_curriculum_gaps: ['gap_engine', 'director_review_queue'],
  create_coach_briefing: ['coach_briefing', 'director_review_queue'],
  record_director_note: ['director_note', 'director_review_queue'],
  record_attendance_exception: ['attendance', 'director_review_queue'],
  flag_unrostered_attendee: ['unrostered_attendee_review', 'director_review_queue'],
  create_player_observation: ['player_observation', 'director_review_queue'],
  create_gate_evidence_draft: ['curriculum_evidence', 'director_review_queue'],
  create_session_recap: ['session_actual', 'player_observation', 'director_review_queue'],
  create_gap_signal: ['gap_engine', 'director_review_queue'],
  create_parent_safe_candidate: ['parent_safe_draft', 'director_review_queue'],
  alert_director: ['director_review_queue'],
  unknown: [],
}

const INTENT_PRIMARY_ACTION: Record<VoiceIntakeIntentType, string> = {
  create_session_draft: 'Create a session plan draft for director review.',
  create_group_draft: 'Create a group change draft for director review.',
  set_group_focus: 'Create a group focus brief for director review.',
  create_player_review_request: 'Create a player review request for director attention.',
  create_parent_safe_draft: 'Create a parent-safe progress draft for director review — not sent until approved.',
  summarize_curriculum_gaps: 'Show curriculum gap summary — read-only, no data changed.',
  create_coach_briefing: 'Create a coach briefing draft for director review.',
  record_director_note: 'Record a director internal note for review.',
  record_attendance_exception: 'Create an attendance exception draft for director review.',
  flag_unrostered_attendee: 'Flag an unrostered attendee for director review.',
  create_player_observation: 'Create a player observation draft for director review.',
  create_gate_evidence_draft: 'Create a gate evidence candidate for director review.',
  create_session_recap: 'Create a session recap draft covering attendance, observations, and focus.',
  create_gap_signal: 'Create a training gap signal for director attention.',
  create_parent_safe_candidate: 'Create a parent-safe summary candidate — not sent until director approves.',
  alert_director: 'Send an alert to the director review queue.',
  unknown: 'Command not recognized. No action taken. Review the transcript and try again.',
}

// ── Confidence scoring ────────────────────────────────────────────────────────

function scoreConfidence(
  intents: VoiceIntakeIntentType[],
  entities: VoiceExtractedEntity[],
  transcript: string,
): 'high' | 'medium' | 'low' {
  if (intents[0] === 'unknown') return 'low'
  const wordCount = transcript.split(/\s+/).length
  const hasEntities = entities.length > 0
  const multiIntent = intents.length > 2

  if (wordCount >= 8 && hasEntities && !multiIntent) return 'high'
  if (wordCount >= 4 || hasEntities) return 'medium'
  return 'low'
}

// ── What would change / not change ───────────────────────────────────────────

const NEVER_AUTOMATIC: string[] = [
  'No parent message sent — requires director approval before any communication',
  'No player curriculum level changed — requires director/head coach approval',
  'No attendance record written — requires director/head coach confirmation',
  'No player created or removed — roster changes require director action',
  'No session published — sessions require director approval',
  'No billing or enrollment changes — requires director action',
]

function buildWhatWouldChange(intents: VoiceIntakeIntentType[]): string[] {
  const changes: string[] = []
  for (const intent of intents) {
    if (intent === 'unknown') continue
    switch (intent) {
      case 'create_session_draft':
        changes.push('A session plan draft is created in the review queue (pending_review)')
        break
      case 'create_group_draft':
        changes.push('A group change draft is created in the review queue (pending_review)')
        break
      case 'set_group_focus':
        changes.push('A group focus brief draft is created in the review queue (pending_review)')
        break
      case 'create_player_review_request':
        changes.push('A player review request is created in the review queue (pending_review)')
        break
      case 'create_parent_safe_draft':
        changes.push('A parent-safe draft is created in the review queue — not sent until director approves')
        break
      case 'summarize_curriculum_gaps':
        changes.push('Curriculum gap summary is shown — no data written')
        break
      case 'create_coach_briefing':
        changes.push('A coaching briefing draft is created in the review queue (pending_review)')
        break
      case 'record_director_note':
        changes.push('A director note draft is created in the review queue (pending_review)')
        break
      case 'record_attendance_exception':
        changes.push('An attendance exception draft is created in the review queue (pending_review)')
        break
      case 'flag_unrostered_attendee':
        changes.push('An unrostered attendee flag is created for director review (pending_review)')
        break
      case 'create_player_observation':
        changes.push('A player observation draft is created in the review queue (pending_review)')
        break
      case 'create_gate_evidence_draft':
        changes.push('A gate evidence candidate draft is created for director review (pending_review)')
        break
      case 'create_session_recap':
        changes.push('A session recap draft is created covering attendance, observations, and session focus (pending_review)')
        break
      case 'create_gap_signal':
        changes.push('A training gap signal draft is created for director attention (pending_review)')
        break
      case 'create_parent_safe_candidate':
        changes.push('A parent-safe summary candidate is created in the review queue — not sent until director approves')
        break
      case 'alert_director':
        changes.push('A director alert is created in the review queue (pending_review)')
        break
    }
  }
  return Array.from(new Set(changes))
}

// ── Entity building ───────────────────────────────────────────────────────────

function buildEntities(
  text: string,
  playerNames: string[],
  groupNames: string[],
  curriculumLevels: string[],
  focusKeywords: string[],
): VoiceExtractedEntity[] {
  const entities: VoiceExtractedEntity[] = []

  for (const name of playerNames) {
    entities.push({ type: 'player', value: name, confidence: 'medium' })
  }
  for (const group of groupNames) {
    entities.push({ type: 'group', value: group, confidence: 'high' })
  }
  for (const level of curriculumLevels) {
    entities.push({ type: 'curriculum_level', value: level, confidence: 'high' })
  }
  if (focusKeywords.length > 0) {
    entities.push({ type: 'focus', value: focusKeywords.slice(0, 3).join(', '), confidence: 'medium' })
  }

  return entities
}

// ── Gap link inference ────────────────────────────────────────────────────────

const GAP_TERMS: Record<string, string> = {
  'wide ball': 'wide_ball_recovery',
  'recovery': 'recovery',
  'footwork': 'footwork',
  'rushed': 'rushed_transition',
  'consistency': 'consistency',
  'cross-court': 'cross_court_pattern',
  'backhand': 'backhand_development',
  'serve': 'serve_development',
  'movement': 'movement_pattern',
  'gap': 'training_gap',
}

function inferGapLinks(text: string): string[] {
  const lower = text.toLowerCase()
  return Object.entries(GAP_TERMS)
    .filter(([term]) => lower.includes(term))
    .map(([, link]) => link)
}

// ── Main structuring function ─────────────────────────────────────────────────

export function structureVoiceIntake(input: VoiceIntakeStructureInput): VoiceIntakeStructureResult {
  const { role, transcript, context } = input
  const warnings: string[] = []

  if (!transcript.trim()) {
    return {
      draft: {
        role,
        context,
        raw_transcript: '',
        cleaned_summary: '',
        detected_intents: ['unknown'],
        confidence: 'low',
        suggested_destinations: [],
        recommended_primary_action: 'Transcript is empty — nothing to structure.',
        extracted_entities: [],
        affected_players: [],
        affected_groups: [],
        affected_sessions: [],
        curriculum_links: [],
        gap_links: [],
        requires_review: false,
        safety_flags: [],
        what_would_change: [],
        what_would_not_change: NEVER_AUTOMATIC,
      },
      parse_warnings: ['Transcript is empty'],
    }
  }

  const cleaned = cleanTranscript(transcript)
  const playerNames = extractPlayerNames(cleaned)
  const groupNames = extractGroupNames(cleaned)
  const curriculumLevels = extractCurriculumLevels(cleaned)
  const focusKeywords = extractFocusKeywords(cleaned)
  const safetyFlags = detectSafetyFlags(cleaned)
  const detectedIntents = detectIntentsForRole(cleaned, role)
  const entities = buildEntities(cleaned, playerNames, groupNames, curriculumLevels, focusKeywords)
  const confidence = scoreConfidence(detectedIntents, entities, cleaned)

  // Build destination list from all detected intents (deduplicated)
  const destinationSet = new Set<VoiceDestinationModule>()
  for (const intent of detectedIntents) {
    for (const dest of INTENT_TO_DESTINATIONS[intent] ?? []) {
      destinationSet.add(dest)
    }
  }
  const suggestedDestinations = Array.from(destinationSet)

  // Primary action: use the first non-unknown intent
  const primaryIntent = detectedIntents.find(i => i !== 'unknown') ?? 'unknown'
  const recommendedPrimaryAction = INTENT_PRIMARY_ACTION[primaryIntent]

  const whatWouldChange = buildWhatWouldChange(detectedIntents)
  const gapLinks = inferGapLinks(cleaned)

  // All action intents require review
  const requiresReview = detectedIntents.some(i => i !== 'unknown' && i !== 'summarize_curriculum_gaps')

  // Add warnings for safety flags
  if (safetyFlags.includes('auto_execution_requested')) {
    warnings.push('Auto-execution request detected — all actions require human approval. Nothing will execute automatically.')
  }
  if (safetyFlags.includes('level_change_requested')) {
    warnings.push('Curriculum level change language detected — level changes require director/head coach approval.')
  }
  if (safetyFlags.includes('parent_send_requested')) {
    warnings.push('Parent send language detected — no parent message will be sent without explicit director approval.')
  }
  if (safetyFlags.includes('roster_mutation_requested')) {
    warnings.push('Roster change language detected — no player will be added or removed without director action.')
  }

  return {
    draft: {
      role,
      context,
      raw_transcript: transcript,
      cleaned_summary: cleaned,
      detected_intents: detectedIntents,
      confidence,
      suggested_destinations: suggestedDestinations,
      recommended_primary_action: recommendedPrimaryAction,
      extracted_entities: entities,
      affected_players: playerNames,
      affected_groups: groupNames,
      affected_sessions: context.session_id ? [context.session_id] : [],
      curriculum_links: curriculumLevels,
      gap_links: gapLinks,
      requires_review: requiresReview,
      safety_flags: safetyFlags,
      what_would_change: whatWouldChange,
      what_would_not_change: NEVER_AUTOMATIC,
    },
    parse_warnings: warnings,
  }
}
