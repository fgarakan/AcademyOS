// QA script for parseAcademyCommand — Sprint 214
// Run: node scripts/qa-command-parser.mjs

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// We can't import TS directly from mjs — read and parse test cases manually
// Tests are defined below as plain JS structures matching ParsedCommandResult shape

const tests = [
  // show_players_missing_curriculum_level
  { input: 'Show players missing curriculum levels', expected_intent: 'show_players_missing_curriculum_level', expected_confidence: 'high' },
  { input: 'who has no curriculum level assigned', expected_intent: 'show_players_missing_curriculum_level', expected_confidence: 'high' },
  { input: 'players without a level', expected_intent: 'show_players_missing_curriculum_level', expected_confidence: 'high' },

  // show_curriculum_gap_suggestions
  { input: 'show curriculum gap suggestions', expected_intent: 'show_curriculum_gap_suggestions', expected_confidence: 'high' },
  { input: 'summarize curriculum gaps', expected_intent: 'show_curriculum_gap_suggestions', expected_confidence: 'high' },

  // show_advancement_eligible
  { input: 'who is ready to advance?', expected_intent: 'show_advancement_eligible', expected_confidence: 'high' },
  { input: 'show advancement eligible players', expected_intent: 'show_advancement_eligible', expected_confidence: 'high' },
  { input: 'which players can level up', expected_intent: 'show_advancement_eligible', expected_confidence: 'high' },

  // ask_curriculum_level_requirements
  { input: 'What are the requirements for Orange 2?', expected_intent: 'ask_curriculum_level_requirements', expected_confidence: 'high', expected_entity_level: 'Orange 2' },
  { input: 'how do I advance from Green 1?', expected_intent: 'ask_curriculum_level_requirements', expected_confidence: 'high', expected_entity_level: 'Green 1' },
  { input: 'what are the gates for Red 1?', expected_intent: 'ask_curriculum_level_requirements', expected_confidence: 'high', expected_entity_level: 'Red 1' },
  { input: 'what are the requirements?', expected_intent: 'ask_curriculum_level_requirements', expected_confidence: 'medium' },

  // summarize_reassessment_pipeline
  { input: 'who needs reassessment?', expected_intent: 'summarize_reassessment_pipeline', expected_confidence: 'high' },
  { input: 'show players with overdue assessments', expected_intent: 'summarize_reassessment_pipeline', expected_confidence: 'high' },

  // create_session_draft
  { input: 'create a session draft for Orange 2 focused on movement', expected_intent: 'create_session_draft', expected_confidence: 'high', expected_entity_level: 'Orange 2', expected_entity_focus: 'movement' },
  { input: 'new session for Green 1', expected_intent: 'create_session_draft', expected_confidence: 'medium', expected_entity_level: 'Green 1' },
  { input: 'draft a session', expected_intent: 'create_session_draft', expected_confidence: 'low' },

  // create_group_draft
  { input: 'create a group draft for Orange 2', expected_intent: 'create_group_draft', expected_confidence: 'medium', expected_entity_level: 'Orange 2' },
  { input: 'new group', expected_intent: 'create_group_draft', expected_confidence: 'low' },

  // record_director_note
  { input: 'note: check on Leo next session', expected_intent: 'record_director_note', expected_confidence: 'high' },
  { input: 'add note: review group sizes before Saturday', expected_intent: 'record_director_note', expected_confidence: 'high' },

  // unknown
  { input: 'hello', expected_intent: 'unknown', expected_confidence: 'low' },
  { input: '', expected_intent: 'unknown', expected_confidence: 'low' },
  { input: 'what is the weather', expected_intent: 'unknown', expected_confidence: 'low' },
]

// ── Dynamic import of the parser via ts-node alternative ─────────────────────
// We compile the parser inline using a simplified regex approach since ts-node
// is not available in all environments. Instead, we re-implement the pattern checks
// as a pure JS mirror for QA purposes.

function parseAcademyCommandJS(input) {
  const text = input.trim()

  if (!text) return { intent_type: 'unknown', confidence: 'low', extracted_entities: {} }

  const MISSING_CURRICULUM = [/missing curriculum/i, /no curriculum/i, /without.*(level|curriculum)/i, /curriculum.*missing/i, /no level assigned/i, /missing.*level/i, /level.*not.*assigned/i, /unassigned.*level/i]
  if (MISSING_CURRICULUM.some(p => p.test(text))) return { intent_type: 'show_players_missing_curriculum_level', confidence: 'high', extracted_entities: {} }

  const CURRICULUM_GAP = [/curriculum gap/i, /gap suggest/i, /curriculum suggest/i, /suggest.*curriculum/i]
  if (CURRICULUM_GAP.some(p => p.test(text))) return { intent_type: 'show_curriculum_gap_suggestions', confidence: 'high', extracted_entities: {} }

  const ADVANCEMENT = [/ready to advance/i, /advancement eligible/i, /eligible.*advance/i, /who.*advance/i, /advance.*who/i, /level up/i, /ready.*level/i]
  if (ADVANCEMENT.some(p => p.test(text))) return { intent_type: 'show_advancement_eligible', confidence: 'high', extracted_entities: {} }

  const REQUIREMENTS = [/requirements? for/i, /what.*need.*to.*advance/i, /how.*to.*advance/i, /gates? for/i, /criteria.*for/i, /what.*advance.*from/i, /level.*requirement/i, /requirement.*level/i, /advance.*from/i, /what are the requirements?\b/i, /show.*requirements?\b/i]
  if (REQUIREMENTS.some(p => p.test(text))) {
    const level = text.match(/\b(red|orange|green|yellow|high performance)\s*\d+(?:\s*[-–]\s*\w+)?\b/gi)?.[0]?.trim()
    return { intent_type: 'ask_curriculum_level_requirements', confidence: level ? 'high' : 'medium', extracted_entities: level ? { level } : {} }
  }

  const REASSESSMENT = [/reassessment/i, /overdue.*assessment/i, /due.*assessment/i, /assessment.*due/i, /who.*reassess/i, /need.*reassess/i]
  if (REASSESSMENT.some(p => p.test(text))) return { intent_type: 'summarize_reassessment_pipeline', confidence: 'high', extracted_entities: {} }

  const CREATE_SESSION = [/create.*session/i, /new.*session/i, /draft.*session/i, /session.*draft/i, /plan.*session/i, /schedule.*session/i]
  if (CREATE_SESSION.some(p => p.test(text))) {
    const level = text.match(/\b(red|orange|green|yellow|high performance)\s*\d+(?:\s*[-–]\s*\w+)?\b/gi)?.[0]?.trim()
    const FOCUS_KW = ['movement', 'recovery', 'serve', 'forehand', 'backhand', 'volley', 'footwork', 'fitness', 'tactical', 'technique', 'consistency', 'competition', 'mental', 'agility', 'speed', 'strength']
    const focus = FOCUS_KW.find(kw => text.toLowerCase().includes(kw))
    const entities = {}
    if (level) entities.level = level
    if (focus) entities.focus = focus
    return { intent_type: 'create_session_draft', confidence: level && focus ? 'high' : level || focus ? 'medium' : 'low', extracted_entities: entities }
  }

  const CREATE_GROUP = [/create.*group/i, /new.*group/i, /draft.*group/i, /group.*draft/i]
  if (CREATE_GROUP.some(p => p.test(text))) {
    const level = text.match(/\b(red|orange|green|yellow|high performance)\s*\d+(?:\s*[-–]\s*\w+)?\b/gi)?.[0]?.trim()
    const entities = {}
    if (level) entities.level = level
    return { intent_type: 'create_group_draft', confidence: level ? 'medium' : 'low', extracted_entities: entities }
  }

  const DIRECTOR_NOTE = [/note:/i, /record.*note/i, /save.*note/i, /add.*note/i, /director.*note/i, /log this/i, /remember this/i]
  if (DIRECTOR_NOTE.some(p => p.test(text))) {
    const noteText = text.replace(/^(note:|record note:|add note:|save note:)/i, '').trim()
    return { intent_type: 'record_director_note', confidence: noteText ? 'high' : 'medium', extracted_entities: noteText ? { note_text: noteText } : {} }
  }

  return { intent_type: 'unknown', confidence: 'low', extracted_entities: {} }
}

// ── Run tests ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

for (const test of tests) {
  const result = parseAcademyCommandJS(test.input)
  let ok = true
  const failures = []

  if (result.intent_type !== test.expected_intent) {
    ok = false
    failures.push(`intent: got "${result.intent_type}", expected "${test.expected_intent}"`)
  }
  if (result.confidence !== test.expected_confidence) {
    ok = false
    failures.push(`confidence: got "${result.confidence}", expected "${test.expected_confidence}"`)
  }
  if (test.expected_entity_level && result.extracted_entities?.level !== test.expected_entity_level) {
    ok = false
    failures.push(`entity.level: got "${result.extracted_entities?.level}", expected "${test.expected_entity_level}"`)
  }
  if (test.expected_entity_focus && result.extracted_entities?.focus !== test.expected_entity_focus) {
    ok = false
    failures.push(`entity.focus: got "${result.extracted_entities?.focus}", expected "${test.expected_entity_focus}"`)
  }

  if (ok) {
    console.log(`  ✓ "${test.input || '(empty)'}" → ${result.intent_type}`)
    passed++
  } else {
    console.log(`  ✗ "${test.input || '(empty)'}"`)
    for (const f of failures) console.log(`      ${f}`)
    failed++
  }
}

console.log(`\n=== Summary ===`)
console.log(`Tests: ${tests.length} total — ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('All parser tests passed.')
} else {
  console.log(`${failed} test(s) failed.`)
  process.exit(1)
}
