// Sprint 242 — QA script for structureVoiceIntake helper
// Run: node scripts/qa-voice-intake-structure.mjs
// Pure JS mirror of the TS logic — does not import the TS file directly.

// ── JS mirror of structureVoiceIntake ────────────────────────────────────────

function cleanTranscript(raw) {
  return raw.trim().replace(/\s+/g, ' ').replace(/["""'']/g, '"')
}

const CURRICULUM_LEVEL_RE = /\b(red|orange|green|yellow|high performance)\s*\d+(?:\s*[-–]\s*\w+)?\b/gi
function extractCurriculumLevels(text) {
  const matches = text.match(CURRICULUM_LEVEL_RE)
  return matches ? [...new Set(matches.map(m => m.trim()))] : []
}

const ABSENCE_RE = /\bexcept\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
const PLAYER_OBS_RE = /\b([A-Z][a-z]+)\s+(?:showed|recovered|understood|executed|demonstrated|struggled|is close|is ready)/g
const UNROSTERED_RE = /\b([A-Z][a-z]+)\s+(?:showed up|turned up|arrived|appeared)\b/gi
function extractPlayerNames(text) {
  const names = []
  let m
  const aRe = new RegExp(ABSENCE_RE.source, ABSENCE_RE.flags)
  while ((m = aRe.exec(text)) !== null) names.push(m[1].trim())
  const oRe = new RegExp(PLAYER_OBS_RE.source, PLAYER_OBS_RE.flags)
  while ((m = oRe.exec(text)) !== null) names.push(m[1].trim())
  const uRe = new RegExp(UNROSTERED_RE.source, UNROSTERED_RE.flags)
  while ((m = uRe.exec(text)) !== null) names.push(m[1].trim())
  return [...new Set(names)]
}

const FOCUS_KEYWORDS = ['movement', 'recovery', 'serve', 'forehand', 'backhand', 'volley',
  'footwork', 'fitness', 'tactical', 'technique', 'consistency', 'competition',
  'mental', 'agility', 'speed', 'strength', 'wide ball', 'cross-court']
function extractFocusKeywords(text) {
  const lower = text.toLowerCase()
  return FOCUS_KEYWORDS.filter(kw => lower.includes(kw))
}

const GROUP_RE = /\b(Orange|Red|Green|Yellow|High Performance)\s*\d+(?:\s+[A-Za-z]+)?\s+(?:group|players|team|squad)\b/gi
function extractGroupNames(text) {
  const matches = text.match(GROUP_RE)
  return matches ? [...new Set(matches.map(m => m.trim()))] : []
}

function detectSafetyFlags(text) {
  const flags = []
  if (
    /\b(send|email|message|notify|tell|contact|update)\b.*(parent|guardian|family|mom|dad)/i.test(text) ||
    /\b(parent|guardian|family)\b.*(update|message|email|draft|explain|notify|send)/i.test(text)
  ) {
    flags.push('parent_exposure_risk', 'parent_send_requested')
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
  if (/\b(billing|invoice|payment|fee|charge|enrollment|enroll|register)\b/i.test(text.toLowerCase())) {
    flags.push('billing_enrollment_risk')
  }
  const allCaps = text.match(/\b[A-Z][a-z]+\b/g) ?? []
  if (new Set(allCaps).size >= 3) flags.push('cross_player_leak_risk')
  return [...new Set(flags)]
}

function detectIntentsForRole(text, role) {
  const intents = []
  const isDirector = role === 'academy_director' || role === 'head_coach'
  const isCoach = role === 'coach' || role === 'head_coach'

  if (isDirector) {
    if ([/create.*session/i, /new.*session/i, /draft.*session/i, /plan.*session/i, /schedule.*session/i].some(p => p.test(text))) intents.push('create_session_draft')
    if ([/create.*group/i, /new.*group/i, /draft.*group/i, /group.*draft/i].some(p => p.test(text))) intents.push('create_group_draft')
    if ([/group.*focus/i, /focus.*group/i, /watching.*for/i, /coaches watching/i, /set.*focus/i].some(p => p.test(text)) && !intents.includes('create_group_draft')) intents.push('set_group_focus')
    if ([/player.*review/i, /review.*player/i, /fast.?track/i, /gate.*review/i, /look at\b/i].some(p => p.test(text))) intents.push('create_player_review_request')
    if ([/parent.*update/i, /draft.*parent/i, /parent.*draft/i, /parent.*message/i, /parent.*explain/i].some(p => p.test(text))) intents.push('create_parent_safe_draft')
    if ([/curriculum.*gap/i, /gap.*suggest/i, /missing.*evidence/i, /missing.*curriculum/i, /no.*curriculum/i].some(p => p.test(text))) intents.push('summarize_curriculum_gaps')
    if ([/coach.*brief/i, /brief.*coach/i, /coaching.*team/i, /briefing/i].some(p => p.test(text))) intents.push('create_coach_briefing')
    if ([/note:/i, /record.*note/i, /save.*note/i, /add.*note/i, /director.*note/i, /log this/i, /remember this/i].some(p => p.test(text))) intents.push('record_director_note')
  }

  if (isCoach) {
    if ([/except\b/i, /absent/i, /not here/i, /didn.t.*come/i, /everyone.*except/i, /not.*attending/i].some(p => p.test(text))) intents.push('record_attendance_exception')
    if ([/showed up/i, /turned up/i, /not.*on.*roster/i, /not.*rostered/i, /don.t.*think.*roster/i].some(p => p.test(text))) intents.push('flag_unrostered_attendee')
    if ([/showed/i, /recovered/i, /understood/i, /executed/i, /demonstrated/i, /improvement/i, /worked on/i, /close to/i, /ready for/i].some(p => p.test(text))) intents.push('create_player_observation')
    if ([/gate/i, /evidence/i, /worth.*director/i, /worth.*look/i, /ready.*advance/i].some(p => p.test(text))) intents.push('create_gate_evidence_draft')
    if ([/session.*today/i, /today.*session/i, /today.*we/i, /group.*today/i, /everyone.*today/i].some(p => p.test(text))) intents.push('create_session_recap')
    if ([/gap/i, /struggling.*with/i, /needs.*work/i, /rushed/i, /can.t.*seem/i].some(p => p.test(text))) intents.push('create_gap_signal')
    if ([/worth.*sharing.*parent/i, /good.*update.*parent/i, /safe.*for.*parent/i].some(p => p.test(text))) intents.push('create_parent_safe_candidate')
    if ([/alert.*director/i, /flag.*director/i, /flag this/i, /director.*should.*know/i].some(p => p.test(text))) intents.push('alert_director')
  }

  if (intents.length === 0) intents.push('unknown')
  return [...new Set(intents)]
}

const INTENT_TO_DESTINATIONS = {
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

const NEVER_AUTOMATIC = [
  'No parent message sent — requires director approval before any communication',
  'No player curriculum level changed — requires director/head coach approval',
  'No attendance record written — requires director/head coach confirmation',
  'No player created or removed — roster changes require director action',
  'No session published — sessions require director approval',
  'No billing or enrollment changes — requires director action',
]

const GAP_TERMS = {
  'wide ball': 'wide_ball_recovery', 'recovery': 'recovery', 'footwork': 'footwork',
  'rushed': 'rushed_transition', 'consistency': 'consistency', 'backhand': 'backhand_development',
  'serve': 'serve_development', 'movement': 'movement_pattern', 'gap': 'training_gap',
}
function inferGapLinks(text) {
  const lower = text.toLowerCase()
  return Object.entries(GAP_TERMS).filter(([term]) => lower.includes(term)).map(([, link]) => link)
}

function scoreConfidence(intents, entities, transcript) {
  if (intents[0] === 'unknown') return 'low'
  const words = transcript.split(/\s+/).length
  const hasEntities = entities.length > 0
  const multiIntent = intents.length > 2
  if (words >= 8 && hasEntities && !multiIntent) return 'high'
  if (words >= 4 || hasEntities) return 'medium'
  return 'low'
}

function structureVoiceIntake({ role, transcript, context }) {
  const warnings = []
  if (!transcript.trim()) {
    return {
      draft: {
        role, context, raw_transcript: '', cleaned_summary: '',
        detected_intents: ['unknown'], confidence: 'low',
        suggested_destinations: [], recommended_primary_action: 'Transcript is empty.',
        extracted_entities: [], affected_players: [], affected_groups: [],
        affected_sessions: [], curriculum_links: [], gap_links: [],
        requires_review: false, safety_flags: [],
        what_would_change: [], what_would_not_change: NEVER_AUTOMATIC,
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
  const entities = []
  for (const n of playerNames) entities.push({ type: 'player', value: n, confidence: 'medium' })
  for (const g of groupNames) entities.push({ type: 'group', value: g, confidence: 'high' })
  for (const l of curriculumLevels) entities.push({ type: 'curriculum_level', value: l, confidence: 'high' })
  if (focusKeywords.length > 0) entities.push({ type: 'focus', value: focusKeywords.slice(0, 3).join(', '), confidence: 'medium' })
  const confidence = scoreConfidence(detectedIntents, entities, cleaned)
  const destinationSet = new Set()
  for (const intent of detectedIntents) {
    for (const dest of INTENT_TO_DESTINATIONS[intent] ?? []) destinationSet.add(dest)
  }
  const gapLinks = inferGapLinks(cleaned)
  const requiresReview = detectedIntents.some(i => i !== 'unknown' && i !== 'summarize_curriculum_gaps')
  if (safetyFlags.includes('auto_execution_requested')) warnings.push('Auto-execution request detected — all actions require human approval. Nothing will execute automatically.')
  if (safetyFlags.includes('level_change_requested')) warnings.push('Curriculum level change language detected — level changes require director/head coach approval.')
  if (safetyFlags.includes('parent_send_requested')) warnings.push('Parent send language detected — no parent message will be sent without explicit director approval.')
  if (safetyFlags.includes('roster_mutation_requested')) warnings.push('Roster change language detected — no player will be added or removed without director action.')
  return {
    draft: {
      role, context,
      raw_transcript: transcript,
      cleaned_summary: cleaned,
      detected_intents: detectedIntents,
      confidence,
      suggested_destinations: [...destinationSet],
      recommended_primary_action: '',
      extracted_entities: entities,
      affected_players: playerNames,
      affected_groups: groupNames,
      affected_sessions: context.session_id ? [context.session_id] : [],
      curriculum_links: curriculumLevels,
      gap_links: gapLinks,
      requires_review: requiresReview,
      safety_flags: safetyFlags,
      what_would_change: [],
      what_would_not_change: NEVER_AUTOMATIC,
    },
    parse_warnings: warnings,
  }
}

// ── Test cases ────────────────────────────────────────────────────────────────

const CONTEXT_DIRECTOR = { page: 'command-center', academy_id: 'test-academy-1' }
const CONTEXT_COACH = { page: 'coach-session', session_id: 'test-session-1', academy_id: 'test-academy-1' }

const tests = [
  {
    name: 'Director — Orange 2 focus command',
    input: { role: 'academy_director', transcript: 'Create an Orange 2 session focused on movement recovery for next Tuesday', context: CONTEXT_DIRECTOR },
    checks: [
      r => r.draft.detected_intents.includes('create_session_draft') || 'should detect create_session_draft',
      r => r.draft.curriculum_links.some(l => /orange.*2/i.test(l)) || 'should extract Orange 2 level',
      r => r.draft.confidence !== 'low' || 'should be medium or high confidence',
      r => r.draft.requires_review === true || 'should require review',
      r => r.draft.what_would_not_change.length > 0 || 'should have what_would_not_change items',
      r => r.draft.suggested_destinations.includes('session_planning') || 'should include session_planning destination',
    ],
  },
  {
    name: 'Director — parent update request',
    input: { role: 'academy_director', transcript: 'Draft a parent update explaining what Orange 2 is working on this month', context: CONTEXT_DIRECTOR },
    checks: [
      r => r.draft.detected_intents.includes('create_parent_safe_draft') || 'should detect create_parent_safe_draft',
      r => r.draft.safety_flags.length > 0 || 'should have safety flags (parent exposure risk)',
      r => r.draft.suggested_destinations.includes('parent_safe_draft') || 'should include parent_safe_draft destination',
      r => r.draft.what_would_not_change.some(w => /parent/i.test(w)) || 'should mention parent in what_would_not_change',
    ],
  },
  {
    name: 'Coach — everyone here except Sarah',
    input: { role: 'coach', transcript: 'Everyone was here except Sarah — she texted that she will be late next week', context: CONTEXT_COACH },
    checks: [
      r => r.draft.detected_intents.includes('record_attendance_exception') || 'should detect record_attendance_exception',
      r => r.draft.affected_players.includes('Sarah') || 'should extract player name Sarah',
      r => r.draft.suggested_destinations.includes('attendance') || 'should include attendance destination',
      r => r.draft.requires_review === true || 'should require review',
    ],
  },
  {
    name: 'Coach — Jeremy showed up unrostered',
    input: { role: 'coach', transcript: "Jeremy showed up today but I don't think he is on the roster for this group", context: CONTEXT_COACH },
    checks: [
      r => r.draft.detected_intents.includes('flag_unrostered_attendee') || 'should detect flag_unrostered_attendee',
      r => r.draft.affected_players.includes('Jeremy') || 'should extract player name Jeremy',
      r => r.draft.suggested_destinations.includes('unrostered_attendee_review') || 'should include unrostered destination',
    ],
  },
  {
    name: 'Coach — Lucas recovered better observation',
    input: { role: 'coach', transcript: 'Lucas recovered much better after wide balls but then rushed the next shot', context: CONTEXT_COACH },
    checks: [
      r => r.draft.detected_intents.includes('create_player_observation') || 'should detect create_player_observation',
      r => r.draft.affected_players.includes('Lucas') || 'should extract player name Lucas',
      r => r.draft.gap_links.length > 0 || 'should infer gap links from wide ball / rushed language',
      r => r.draft.suggested_destinations.includes('player_observation') || 'should include player_observation destination',
    ],
  },
  {
    name: 'Unknown command',
    input: { role: 'academy_director', transcript: 'hello', context: CONTEXT_DIRECTOR },
    checks: [
      r => r.draft.detected_intents.includes('unknown') || 'should classify as unknown',
      r => r.draft.confidence === 'low' || 'should be low confidence',
      r => r.draft.requires_review === false || 'unknown should not require review',
      r => r.draft.suggested_destinations.length === 0 || 'unknown should have no destinations',
    ],
  },
  {
    name: 'Empty transcript',
    input: { role: 'academy_director', transcript: '', context: CONTEXT_DIRECTOR },
    checks: [
      r => r.draft.detected_intents.includes('unknown') || 'empty should classify as unknown',
      r => r.parse_warnings.length > 0 || 'empty should produce warnings',
    ],
  },
  {
    name: 'Safety — auto execution requested',
    input: { role: 'academy_director', transcript: 'Create an Orange 2 session for Tuesday and apply this now', context: CONTEXT_DIRECTOR },
    checks: [
      r => r.draft.safety_flags.includes('auto_execution_requested') || 'should flag auto_execution_requested',
      r => r.parse_warnings.some(w => /auto-execution/i.test(w)) || 'should warn about auto execution',
    ],
  },
  {
    name: 'Safety — level change language',
    input: { role: 'academy_director', transcript: 'Move Lucas up to Orange 2', context: CONTEXT_DIRECTOR },
    checks: [
      r => r.draft.safety_flags.includes('level_change_requested') || 'should flag level_change_requested',
      r => r.draft.what_would_not_change.some(w => /level/i.test(w)) || 'should mention level in what_would_not_change',
    ],
  },
  {
    name: 'What would not change — always present',
    input: { role: 'coach', transcript: 'Maya understood the cross-court pattern today', context: CONTEXT_COACH },
    checks: [
      r => r.draft.what_would_not_change.some(w => /parent/i.test(w)) || 'should always include parent rule',
      r => r.draft.what_would_not_change.some(w => /level/i.test(w)) || 'should always include level rule',
      r => r.draft.what_would_not_change.some(w => /roster/i.test(w)) || 'should always include roster rule',
    ],
  },
]

// ── Destination router (JS mirror) ────────────────────────────────────────────

const DESTINATION_CATALOGUE_MOCK = {
  attendance: { risk_level: 'medium', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  unrostered_attendee_review: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  session_actual: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  player_observation: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  curriculum_evidence: { risk_level: 'medium', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  gap_engine: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  parent_safe_draft: { risk_level: 'medium', requires_approval: true, allowed_roles: ['academy_director', 'head_coach'] },
  player_mission: { risk_level: 'medium', requires_approval: true, allowed_roles: ['academy_director', 'head_coach'] },
  director_review_queue: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  session_planning: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach'] },
  group_planning: { risk_level: 'medium', requires_approval: true, allowed_roles: ['academy_director', 'head_coach'] },
  coach_briefing: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach'] },
  curriculum_note: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach', 'coach'] },
  director_note: { risk_level: 'low', requires_approval: true, allowed_roles: ['academy_director', 'head_coach'] },
}

function getDestinationRiskLevel(module) {
  return DESTINATION_CATALOGUE_MOCK[module]?.risk_level ?? 'medium'
}

function destinationRequiresApproval(module) {
  return DESTINATION_CATALOGUE_MOCK[module]?.requires_approval ?? true
}

function canRoleRouteToDestination(role, module) {
  return DESTINATION_CATALOGUE_MOCK[module]?.allowed_roles.includes(role) ?? false
}

// ── Destination router tests ──────────────────────────────────────────────────

const routerTests = [
  {
    name: 'Router — attendance destination has medium risk',
    check: () => getDestinationRiskLevel('attendance') === 'medium' || 'attendance should be medium risk',
  },
  {
    name: 'Router — all destinations require approval',
    check: () => Object.keys(DESTINATION_CATALOGUE_MOCK).every(d => destinationRequiresApproval(d)) || 'all destinations should require approval',
  },
  {
    name: 'Router — parent_safe_draft not available to coach',
    check: () => !canRoleRouteToDestination('coach', 'parent_safe_draft') || 'coach should not route to parent_safe_draft',
  },
  {
    name: 'Router — attendance available to coach',
    check: () => canRoleRouteToDestination('coach', 'attendance') === true || 'coach should be able to route to attendance',
  },
  {
    name: 'Router — session_planning only for director/head_coach',
    check: () => !canRoleRouteToDestination('coach', 'session_planning') || 'coach should not route to session_planning',
  },
]

// ── Run ───────────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

for (const test of tests) {
  const result = structureVoiceIntake(test.input)
  const failures = []
  for (const check of test.checks) {
    const r = check(result)
    if (r !== true) failures.push(r)
  }
  if (failures.length === 0) {
    console.log('  ✓', test.name)
    passed++
  } else {
    console.log('  ✗', test.name)
    for (const f of failures) console.log('      →', f)
    failed++
  }
}

for (const test of routerTests) {
  const r = test.check()
  if (r === true) {
    console.log('  ✓', test.name)
    passed++
  } else {
    console.log('  ✗', test.name, '→', r)
    failed++
  }
}

console.log('\n=== Summary ===')
console.log(`Tests: ${passed + failed} total — ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.log('FAIL — voice intake structure tests failed')
  process.exit(1)
} else {
  console.log('All voice intake structure tests passed.')
}
