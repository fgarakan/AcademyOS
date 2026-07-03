// Sprint 4359 — DONNA Loop Knowledge Certification
//
// Behavioral certification (executes real code, asserts on real outputs — no
// tautologies, per ARCHITECTURE.md §3.11 / §8.6). Verifies the loop knowledge map:
//   • all 10 canonical loops have knowledge objects
//   • names/ids match the landed atomicLoopUsabilityCertification taxonomy (drift guard)
//   • each loop has the required fields, whyItMatters, whatHappensAfter, safe next
//     actions, visibility/safety rules, and common questions
//   • parent/player-audience loops block ⊇ the role's blocked categories
//   • the resolver round-trips route → loop for every loop
//   • loops 4 and 5 meet an enhanced coverage bar
//
// Run: npx tsx src/lib/donna/certification/loopKnowledgeCertification.ts

import fs from 'fs'
import path from 'path'
import {
  ALL_LOOP_KNOWLEDGE,
  LOOP_KNOWLEDGE,
  type LoopKnowledge,
  type LoopId,
} from '@/lib/donna/loopKnowledge'
import {
  getLoopKnowledgeById,
  getLoopKnowledgeForRoute,
  resolveLoopAnswer,
  classifyLoopQuestion,
  formatLoopAnswer,
  type LoopQuestionKind,
} from '@/lib/donna/loopKnowledgeResolver'
import { getRolePolicy, isResponseSafeForRole } from '@/lib/donna/brain/donnaRoleResponsePolicy'

const ROOT = process.cwd()

// ── Harness ───────────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): boolean {
  if (ok) passed++
  else {
    failed++
    failures.push(label)
  }
  return ok
}

function nonEmptyStr(s: unknown): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

function nonEmptyArr(a: unknown): boolean {
  return Array.isArray(a) && a.length > 0
}

// ── Canonical names from the landed atomic-loop cert (drift guard) ────────────────
// We read the file text rather than importing it (importing would run its main()).

function canonicalNamesFromAtomicCert(): Map<number, string> {
  const map = new Map<number, string>()
  const file = path.join(
    ROOT,
    'src/lib/donna/certification/atomicLoopUsabilityCertification.ts',
  )
  let text = ''
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return map
  }
  // Match "id: N, name: '...'," entries in LOOPS[].
  const re = /id:\s*(\d+),\s*name:\s*'([^']+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    map.set(Number(m[1]), m[2])
  }
  return map
}

// ── Runner ────────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Loop Knowledge Certification\n')
  process.stdout.write('Sprint 4359\n')
  process.stdout.write('============================================================\n')

  // 1. Exactly 10 canonical loops, ids 1..10 present.
  check('exactly 10 loop knowledge objects', ALL_LOOP_KNOWLEDGE.length === 10)
  for (let id = 1 as number; id <= 10; id++) {
    check(`loop ${id} exists`, getLoopKnowledgeById(id) !== null)
  }

  // 2. Drift guard: names/ids match the landed atomic-loop cert taxonomy.
  const canonical = canonicalNamesFromAtomicCert()
  check('canonical names extracted from atomic cert', canonical.size === 10)
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    check(
      `loop ${loop.id} name matches atomic cert ("${loop.name}")`,
      canonical.get(loop.id) === loop.name,
    )
  }

  // 3. Required fields on every loop.
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const tag = `loop ${loop.id} (${loop.name})`
    check(`${tag}: purpose`, nonEmptyStr(loop.purpose))
    check(`${tag}: whyItMatters (min length)`, nonEmptyStr(loop.whyItMatters) && loop.whyItMatters.length >= 40)
    check(`${tag}: whatHappensAfter (min length)`, nonEmptyStr(loop.whatHappensAfter) && loop.whatHappensAfter.length >= 30)
    check(`${tag}: plainEnglishName`, nonEmptyStr(loop.plainEnglishName))
    check(`${tag}: primaryRoutes`, nonEmptyArr(loop.primaryRoutes))
    check(`${tag}: requiredInputs`, nonEmptyArr(loop.requiredInputs))
    check(`${tag}: completionCriteria`, nonEmptyArr(loop.completionCriteria))
    check(`${tag}: missingStateChecks`, nonEmptyArr(loop.missingStateChecks))
    check(`${tag}: safeNextActions`, nonEmptyArr(loop.safeNextActions))
    check(`${tag}: commonQuestions >= 3`, loop.commonQuestions.length >= 3)
    check(`${tag}: donnaExplanations non-empty`, Object.keys(loop.donnaExplanations).length > 0)
    check(`${tag}: donnaDoNotSay`, nonEmptyArr(loop.donnaDoNotSay))
    check(`${tag}: failureStates`, nonEmptyArr(loop.failureStates))
    check(`${tag}: browserTestCriteria`, nonEmptyArr(loop.browserTestCriteria))
    check(`${tag}: approvalRequirements framing`, nonEmptyStr(loop.approvalRequirements.framing))
    check(`${tag}: approvalRequirements mutationPath`, nonEmptyStr(loop.approvalRequirements.mutationPath))
    check(`${tag}: visibility audience non-empty`, nonEmptyArr(loop.parentPlayerVisibilityRules.audience))
    check(`${tag}: visibility note`, nonEmptyStr(loop.parentPlayerVisibilityRules.note))
  }

  // 4. Safety: safeNextActions must not read as direct mutations.
  const mutationVerbs = /\b(delete|execute|finalize|approve and apply|activate the player|write to the database)\b/i
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const offending = loop.safeNextActions.filter(a => mutationVerbs.test(a))
    check(`loop ${loop.id}: safeNextActions are guidance-only (no direct mutation verbs)`, offending.length === 0)
  }

  // 5. Parent/player-audience loops must block ⊇ that role's blocked categories.
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const blocked = new Set(loop.parentPlayerVisibilityRules.blockedForParentPlayer)
    for (const role of ['parent', 'player'] as const) {
      if (loop.parentPlayerVisibilityRules.audience.includes(role)) {
        const roleBlocked = getRolePolicy(role).blockedCategories
        const missing = roleBlocked.filter(c => !blocked.has(c))
        check(
          `loop ${loop.id}: blockedForParentPlayer ⊇ ${role} blocked categories`,
          missing.length === 0,
        )
        check(`loop ${loop.id}: parentPlayerSafe true when ${role} in audience`, loop.parentPlayerVisibilityRules.parentPlayerSafe === true)
      }
    }
  }

  // 6. No obvious PII patterns in static strings.
  const piiPattern = /\b(\d{4}-\d{2}-\d{2}|[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d\s().-]{7,}\d)\b/
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const blob = JSON.stringify(loop)
    check(`loop ${loop.id}: no obvious PII in static strings`, !piiPattern.test(blob))
  }

  // 7. missingStateChecks reference real LivePageState keys (or null).
  const liveKeys = new Set(livePageStateKeys())
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const badSignals = loop.missingStateChecks.filter(
      c => c.liveSignal !== null && !liveKeys.has(c.liveSignal as string),
    )
    check(`loop ${loop.id}: missingStateChecks reference real live signals`, badSignals.length === 0)
  }

  // 8. Resolver round-trip: route → loop for every loop; and resolveLoopAnswer composes.
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const route = loop.primaryRoutes[0]
    const resolved = getLoopKnowledgeForRoute(route.replace(/\[[^\]]+\]/g, 'test-id'))
    check(`loop ${loop.id}: resolver round-trips its primary route`, resolved?.id === loop.id)
    const answer = resolveLoopAnswer({ id: loop.id, role: loop.primaryRole })
    check(`loop ${loop.id}: resolveLoopAnswer composes without error`, answer !== null && answer.loop.id === loop.id)
    check(`loop ${loop.id}: primaryRole is in scope for its own answer`, answer?.roleInScope === true)
  }

  // 9. Enhanced coverage bar for loops 4 and 5.
  for (const id of [4, 5] as LoopId[]) {
    const loop = LOOP_KNOWLEDGE[id]
    const tag = `loop ${id} (enhanced)`
    check(`${tag}: commonQuestions >= 6`, loop.commonQuestions.length >= 6)
    check(`${tag}: missingStateChecks >= 4`, loop.missingStateChecks.length >= 4)
    check(`${tag}: failureStates non-empty`, nonEmptyArr(loop.failureStates))
    check(`${tag}: browserTestCriteria non-empty`, nonEmptyArr(loop.browserTestCriteria))
    check(`${tag}: at least one live-backed missing check`, loop.missingStateChecks.some(c => c.liveSignal !== null))
  }

  // 10. Loop question classifier maps sample phrasings to the right kind.
  const classifierCases: Array<[string, LoopQuestionKind | null]> = [
    ['what is this?', 'what'],
    ['why do I need to do this?', 'why'],
    ["what's missing?", 'missing'],
    ['what do I do next?', 'next'],
    ['what happens after?', 'after'],
    ['who can see this?', 'who_sees'],
    ['does this need approval?', 'approval'],
    ["show me Jake's stats", null],
    ['', null],
  ]
  for (const [msg, expected] of classifierCases) {
    check(`classifyLoopQuestion("${msg}") === ${expected}`, classifyLoopQuestion(msg) === expected)
  }

  // 11. formatLoopAnswer produces grounded, non-empty, mutation-free answers for every
  //     loop × question kind, and stays parent/player-safe.
  const kinds: LoopQuestionKind[] = ['what', 'why', 'missing', 'next', 'after', 'who_sees', 'approval']
  const answerMutationVerbs = /\b(execute|delete|finalize the|write to the database|approve and apply)\b/i
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    for (const kind of kinds) {
      const ans = formatLoopAnswer(loop, kind, loop.primaryRole)
      check(`formatLoopAnswer loop ${loop.id}/${kind}: non-empty display`, nonEmptyStr(ans.display))
      check(`formatLoopAnswer loop ${loop.id}/${kind}: non-empty spoken`, nonEmptyStr(ans.spoken))
      check(`formatLoopAnswer loop ${loop.id}/${kind}: no mutation instruction`, !answerMutationVerbs.test(ans.display))
    }
  }

  // 12. Parent/player role scoping: for loops whose audience includes parent/player,
  //     formatted answers are safe for that role (no blocked content leaks).
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    for (const role of ['parent', 'player'] as const) {
      if (loop.parentPlayerVisibilityRules.audience.includes(role)) {
        for (const kind of kinds) {
          const ans = formatLoopAnswer(loop, kind, role)
          check(
            `formatLoopAnswer loop ${loop.id}/${kind} safe for ${role}`,
            isResponseSafeForRole(ans.display, role),
          )
        }
      }
    }
  }

  // ── Summary ──
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`LOOP KNOWLEDGE CERTIFICATION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  } else {
    process.stdout.write('\nALL LOOP KNOWLEDGE CHECKS PASS.\n')
  }
  process.exit(failed > 0 ? 1 : 0)
}

// LivePageState keys are read from the interface text (avoids importing runtime code).
function livePageStateKeys(): string[] {
  const file = path.join(ROOT, 'src/lib/donna/operating/livePageState.ts')
  let text = ''
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return []
  }
  const block = text.match(/export interface LivePageState\s*\{([\s\S]*?)\}/)
  if (!block) return []
  return Array.from(block[1].matchAll(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*[?:]/gm)).map(m => m[1])
}

main()
