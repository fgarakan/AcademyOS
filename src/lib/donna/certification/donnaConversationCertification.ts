// Sprint 4365 — DONNA Natural Conversation + Learning Rules Certification
//
// Certifies the conversation standard (DONNA_CONVERSATION_STYLE_GUIDE.md) and the
// safe-learning rules (DONNA_LEARNING_RULES_V1.md) against the deterministic corpus that
// already exists — the 10 canonical loops in loopKnowledge.ts, the model system prompt,
// the model adapter's field-preservation, and the existing learning model + approval gate.
//
// This sprint adds NO runtime behaviour: the cert asserts the standard holds over data and
// docs that already exist. It is data-driven and offline (no DB, no network, no model).
//
// Scope of the "spoken surface" (what DONNA actually says to a human), scanned for the
// conversation checks. Internal engineering fields (mutationPath, approvalTier,
// blockedForParentPlayer category slugs) and guardrail instructions (donnaDoNotSay) are
// EXCLUDED — they legitimately contain technical tokens and are never spoken.
//
// Run: npx tsx src/lib/donna/certification/donnaConversationCertification.ts

import fs from 'fs'
import path from 'path'
import { ALL_LOOP_KNOWLEDGE, type LoopKnowledge } from '@/lib/donna/loopKnowledge'
import { DONNA_MODEL_SYSTEM_PROMPT_V1 } from '@/lib/donna/model/modelTypes'
import { LEARNING_EVENT_TYPES, LEARNING_LAYERS } from '@/lib/donna/learning/learningEventTypes'

const ROOT = process.cwd()

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): boolean {
  if (ok) passed++
  else { failed++; failures.push(label) }
  return ok
}

function read(rel: string): string {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8') } catch { return '' }
}

// ── The spoken surface — what DONNA actually says to a human ──────────────────────
// EXCLUDES mutationPath, approvalTier, blockedForParentPlayer, donnaDoNotSay,
// failureStates, browserTestCriteria — engineering/guardrail fields, never spoken.
function spokenStrings(loop: LoopKnowledge): string[] {
  return [
    loop.purpose,
    loop.whyItMatters,
    loop.whatHappensAfter,
    ...loop.safeNextActions,
    loop.approvalRequirements.framing,
    loop.parentPlayerVisibilityRules.note,
    ...Object.values(loop.donnaExplanations),
    ...loop.commonQuestions,
    ...loop.missingStateChecks.map(c => c.unmetMessage),
  ]
}

// The banned technical vocabulary — the source of truth mirrored in the Style Guide.
const BANNED_TECHNICAL_VOCABULARY: RegExp[] = [
  /\bmutation\b/i,
  /\bentity\b/i,
  /\bobject state\b/i,
  /\bschema\b/i,
  /\bbackend process\b/i,
  /\bpipeline unresolved\b/i,
]

// Positive automatic-action / false-completion claims DONNA must never make. Written to
// match POSITIVE claims only, so legitimate safety negations ("never automatic",
// "no player moves levels automatically") do NOT trip the check.
const AUTO_CLAIM_PATTERNS: RegExp[] = [
  /\bI(?:'ve| have)\s+(?:created|sent|approved|submitted|completed|applied)\b/i,
  /\bautomatically\s+(?:move|moved|assign|assigned|send|sent|approve|approved)\b/i,
  /\bauto-(?:assign|assigned|move|moved|complete|completed)\b/i,
]

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Natural Conversation + Learning Rules Certification\n')
  process.stdout.write('Sprint 4365\n')
  process.stdout.write('============================================================\n')

  const styleGuide = read('docs/donna/DONNA_CONVERSATION_STYLE_GUIDE.md')
  const learningRules = read('docs/donna/DONNA_LEARNING_RULES_V1.md')

  check('docs: conversation style guide present', styleGuide.length > 0)
  check('docs: learning rules present', learningRules.length > 0)
  check('loops: exactly 10 canonical loops', ALL_LOOP_KNOWLEDGE.length === 10)

  // ── Per-loop conversation checks (1, 2, 3, 4, 5, 6, 10) ─────────────────────────
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const tag = `loop ${loop.id} (${loop.plainEnglishName})`
    const spoken = spokenStrings(loop)
    const blob = spoken.join(' • ')

    // 1. Natural "why it matters": substantive, full sentence.
    check(`${tag}: has a natural "why it matters"`,
      typeof loop.whyItMatters === 'string' &&
      loop.whyItMatters.trim().length >= 40 &&
      /[.!?]$/.test(loop.whyItMatters.trim()))

    // 2. One clear next-step example.
    check(`${tag}: has at least one clear next step`,
      loop.safeNextActions.length >= 1 &&
      loop.safeNextActions.every(a => a.trim().length >= 8))

    // 3. Approval + visibility language present.
    check(`${tag}: has approval framing`,
      loop.approvalRequirements.framing.trim().length > 0)
    check(`${tag}: has visibility note`,
      loop.parentPlayerVisibilityRules.note.trim().length > 0)

    // 4. Spoken copy avoids banned technical language.
    const banned = BANNED_TECHNICAL_VOCABULARY.filter(p => p.test(blob))
    check(`${tag}: spoken copy uses no banned technical language`, banned.length === 0)

    // 5. No claim of automatic action / false completion in spoken copy.
    const autoClaims = AUTO_CLAIM_PATTERNS.filter(p => p.test(blob))
    check(`${tag}: makes no automatic-action / false-completion claim`, autoClaims.length === 0)

    // 6. Parent/player visibility only where the loop is parent/player-safe.
    const audience = loop.parentPlayerVisibilityRules.audience
    const exposesFamily = audience.includes('parent') || audience.includes('player')
    if (!loop.parentPlayerVisibilityRules.parentPlayerSafe) {
      check(`${tag}: non-safe loop excludes parent/player from audience`, !exposesFamily)
      check(`${tag}: non-safe loop declares blocked categories`,
        loop.parentPlayerVisibilityRules.blockedForParentPlayer.length > 0)
    } else {
      check(`${tag}: parent/player-safe loop still declares blocked categories`,
        loop.parentPlayerVisibilityRules.blockedForParentPlayer.length > 0)
    }

    // 10. Concise + operational.
    check(`${tag}: "why it matters" is concise (<= 400 chars)`, loop.whyItMatters.length <= 400)
    check(`${tag}: each next step is concise (<= 160 chars)`,
      loop.safeNextActions.every(a => a.length <= 160))
    check(`${tag}: has operational FAQ (>= 3 common questions)`, loop.commonQuestions.length >= 3)
  }

  // ── 7. Learning rules prohibit unsafe sources ───────────────────────────────────
  const FORBIDDEN_SOURCE_PHRASES = [
    'raw parent messages',
    'private player notes',
    'guardian contact details',
    'audit logs',
    'cross-academy data',
    'unapproved AI guesses',
    'sensitive health or personal information',
  ]
  for (const phrase of FORBIDDEN_SOURCE_PHRASES) {
    check(`learning: forbids "${phrase}"`, learningRules.toLowerCase().includes(phrase.toLowerCase()))
  }
  const ALLOWED_SOURCE_PHRASES = [
    'approved academy settings',
    'completed loop outcomes',
    'confirmed corrections from directors',
  ]
  for (const phrase of ALLOWED_SOURCE_PHRASES) {
    check(`learning: allows "${phrase}"`, learningRules.toLowerCase().includes(phrase.toLowerCase()))
  }

  // ── 8. Persistent learning requires explicit approval ───────────────────────────
  check('learning: doc requires Director approval for high-impact',
    /high-impact learning requires director approval/i.test(learningRules))
  check('learning: doc names the reviewing/reviewRequired gate',
    /reviewing/i.test(learningRules) && /reviewRequired/i.test(learningRules))
  // Anchor the doc to the REAL code so the rule isn't just prose.
  const learningModel = read('src/lib/donna/learning/learningEntryModel.ts')
  check('learning: LearningSourceType exists in code', /LearningSourceType/.test(learningModel))
  check('learning: LearningStatus lifecycle exists in code', /LearningStatus/.test(learningModel))
  const execLearning = read('src/lib/donna/executive/donnaExecutiveLearning.ts')
  check('learning: high-impact approval gate exists in code',
    /highImpact/.test(execLearning) && /reviewRequired/.test(execLearning))

  // ── 9. Model-assisted wording cannot override deterministic state ────────────────
  check('model: system prompt forbids inventing state',
    /never invent/i.test(DONNA_MODEL_SYSTEM_PROMPT_V1))
  check('model: system prompt forbids false completion',
    /do not claim it is done/i.test(DONNA_MODEL_SYSTEM_PROMPT_V1))
  const adapter = read('src/lib/donna/model/modelAdapter.ts')
  check('model: adapter copies requiresApproval from deterministic fallback',
    /requiresApproval:\s*fb\.requiresApproval/.test(adapter))
  check('model: adapter copies safeNextActions from deterministic fallback',
    /safeNextActions:\s*fb\.safeNextActions/.test(adapter))

  // ── Style-guide content anchors ─────────────────────────────────────────────────
  check('style: guide documents the banned-technical-language standard',
    /banned technical language/i.test(styleGuide))
  check('style: guide documents the "safest next step" phrasing',
    /safest next step/i.test(styleGuide))

  // ── Sprint 4365 (revised): learning-through-use architecture ─────────────────────
  const architecture = read('docs/donna/ACADEMYOS_LEARNING_THROUGH_USE_ARCHITECTURE.md')
  check('docs: learning-through-use architecture present', architecture.length > 0)

  // Taxonomy constants are complete and canonical.
  const EXPECTED_EVENTS = [
    'usage_event', 'conversation_event', 'correction_event', 'preference_signal',
    'curriculum_signal', 'workflow_signal', 'assessment_signal', 'progression_signal',
    'approval_signal', 'rejection_signal', 'parent_safe_signal', 'coach_signal',
    'product_friction_signal', 'learning_candidate', 'approved_learning', 'rejected_learning',
  ]
  check('taxonomy: 16 learning event types', LEARNING_EVENT_TYPES.length === 16)
  for (const e of EXPECTED_EVENTS) {
    check(`taxonomy: event type "${e}" defined`, (LEARNING_EVENT_TYPES as readonly string[]).includes(e))
  }
  check('taxonomy: 5 learning layers', LEARNING_LAYERS.length === 5)
  check('taxonomy: layers ordered 1..5', LEARNING_LAYERS.map(l => l.order).join(',') === '1,2,3,4,5')

  // 1. Layers separate temporary context from durable memory.
  const ephemeral = LEARNING_LAYERS.filter(l => l.order <= 3)
  const durable = LEARNING_LAYERS.filter(l => l.order >= 4)
  check('layers: 1–3 are ephemeral (not durable)', ephemeral.every(l => l.durable === false))
  check('layers: 4–5 are durable', durable.every(l => l.durable === true))

  // 2. Durable learning requires approval; ephemeral does not.
  check('layers: durable layers require approval', durable.every(l => l.requiresApproval === true))
  check('layers: ephemeral layers require no approval', ephemeral.every(l => l.requiresApproval === false))

  // 4. Cross-academy / global learning requires owner approval + anonymization.
  const global = LEARNING_LAYERS.find(l => l.id === 'owner_approved_global_learning')
  check('layers: global learning is owner-approved', global?.approver === 'owner')
  check('layers: global learning requires anonymization', global?.requiresAnonymization === true)
  check('layers: only the global layer requires anonymization',
    LEARNING_LAYERS.filter(l => l.requiresAnonymization).length === 1)
  check('docs: architecture requires anonymization for cross-academy reuse', /anonymi[sz]/i.test(architecture))

  // Doc ↔ constants consistency: the architecture references every id.
  for (const e of EXPECTED_EVENTS) {
    check(`docs: architecture references event "${e}"`, architecture.includes(e))
  }
  for (const l of LEARNING_LAYERS) {
    check(`docs: architecture references layer "${l.id}"`, architecture.includes(l.id))
  }

  // 5. DONNA cannot claim she learned unless approved memory exists (never-say list).
  const NEVER_SAY = [
    'I learned this automatically.',
    'I updated the academy memory.',
    'I changed how future recommendations work.',
  ]
  for (const phrase of NEVER_SAY) {
    check(`style: documents forbidden claim "${phrase}"`, styleGuide.includes(phrase))
  }

  // 10. Conversation style aligns with the approval model (proposal language).
  const SAY = [
    'I noticed a pattern. Do you want me to remember this?',
    'I can suggest this as a learning candidate for director review.',
  ]
  for (const phrase of SAY) {
    check(`style: documents proposal phrasing "${phrase.slice(0, 30)}…"`, styleGuide.includes(phrase))
  }

  // 6. Model output cannot become memory directly.
  check('docs: architecture states model output never becomes memory directly',
    /never become memory\s+directly/i.test(architecture))
  const draftGen = read('src/lib/donna/knowledgePromotion/donnaKnowledgeDraftGenerator.ts')
  check('code: draft generator bars OpenAI from deciding truth', /what is truth/i.test(draftGen))

  // 7 + 8. All 10 loops identify a safe learning signal and a forbidden signal.
  check('docs: per-loop table has a Safe learning signal column', /Safe learning signal/i.test(architecture))
  check('docs: per-loop table has a Forbidden signal column', /Forbidden signal/i.test(architecture))
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    check(`loop ${loop.id}: has a per-loop learning-signal row`, architecture.includes(`| ${loop.id} ·`))
    check(`loop ${loop.id}: declares forbidden categories (forbidden-signal anchor)`,
      loop.parentPlayerVisibilityRules.blockedForParentPlayer.length > 0)
  }

  // 9. Learning-candidate examples are present (concise/operational proposal list).
  check('docs: architecture lists what DONNA may propose as candidates',
    /may PROPOSE as learning candidates/i.test(architecture))

  // 11. Negative check — the constants file introduces no I/O, persistence, or wiring.
  const constantsFile = read('src/lib/donna/learning/learningEventTypes.ts')
  const FORBIDDEN_IN_CONSTANTS: Array<[string, RegExp]> = [
    ['supabase', /supabase/i],
    ['fetch(', /\bfetch\s*\(/],
    ['openai import', /from\s+['"]openai['"]/],
    ['.insert(', /\.insert\s*\(/],
    ['.update(', /\.update\s*\(/],
    ['.upsert(', /\.upsert\s*\(/],
    ['proposed_actions', /proposed_actions/],
    ['createClient(', /createClient\s*\(/],
  ]
  for (const [label, pattern] of FORBIDDEN_IN_CONSTANTS) {
    check(`no-change: constants file has no "${label}"`, !pattern.test(constantsFile))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`DONNA CONVERSATION CERTIFICATION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  } else {
    process.stdout.write('\nALL DONNA CONVERSATION CHECKS PASS.\n')
  }
  process.exit(failed > 0 ? 1 : 0)
}

main()
