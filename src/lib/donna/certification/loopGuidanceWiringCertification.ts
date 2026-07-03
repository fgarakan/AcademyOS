// Sprint 4360 — DONNA Loop Guidance Wiring Certification
//
// Behavioral certification that drives processDonnaMessage end-to-end and asserts the
// loop-knowledge wiring is safe and deterministic:
//   • loop-guidance questions on a canonical-loop route are answered from loop knowledge
//   • Step 7.6 "what should I do here?" is enriched with why / what-happens-after
//   • no loop → existing behavior (not intercepted)
//   • answers never write, never navigate, never set requiresApproval, never leak
//
// Run: npx tsx src/lib/donna/certification/loopGuidanceWiringCertification.ts

import {
  processDonnaMessage,
  type DonnaMessageInput,
  type DonnaMessageResult,
} from '@/lib/donna/brain/processDonnaMessage'
import type { DonnaResponseRole } from '@/lib/donna/brain/donnaRoleResponsePolicy'

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

function run(userMessage: string, route: string, role: DonnaResponseRole): DonnaMessageResult {
  const input: DonnaMessageInput = {
    userMessage,
    role,
    route,
    activeGuidedWorkflowId: null,
    cooState: null,
    goalMemory: null,
  }
  return processDonnaMessage(input)
}

const mutationVerbs = /\b(execute|delete|finalize the|write to the database|approve and apply)\b/i

/** Invariants every loop answer must satisfy: explanation-only, no side effects. */
function assertSafeAnswer(tag: string, r: DonnaMessageResult): void {
  check(`${tag}: action is respond`, r.action === 'respond')
  check(`${tag}: requiresApproval is false`, r.requiresApproval === false)
  check(`${tag}: no navigation`, r.navigateTo === null)
  check(`${tag}: no workflow start`, r.startWorkflowId == null && r.startGoalType == null)
  check(`${tag}: no mutation instruction`, !mutationVerbs.test(r.response))
}

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Loop Guidance Wiring Certification\n')
  process.stdout.write('Sprint 4360\n')
  process.stdout.write('============================================================\n')

  const SESSIONS_NEW = '/director/sessions/new'
  const REVIEW = '/director/review'

  // 1. "why do I need to do this?" → grounded Loop 4 answer.
  {
    const r = run('why do I need to do this?', SESSIONS_NEW, 'director')
    assertSafeAnswer('why/sessions-new', r)
    check('why/sessions-new: cites Loop 4 whyItMatters', r.response.includes('A session is the unit'))
  }

  // 2. "who can see this?" → visibility answer, staff-only framing.
  {
    const r = run('who can see this?', SESSIONS_NEW, 'director')
    assertSafeAnswer('who-sees/sessions-new', r)
    check('who-sees/sessions-new: mentions staff-only', /staff-only|Audience:/i.test(r.response))
  }

  // 3. "does this need approval?" on the review queue → informational, not triggering.
  {
    const r = run('does this need approval?', REVIEW, 'director')
    assertSafeAnswer('approval/review', r)
    check('approval/review: explains approval requirement', /approval/i.test(r.response))
    // Critical: explaining approval must NOT set the result's approval flag.
    check('approval/review: requiresApproval stays false (informational)', r.requiresApproval === false)
  }

  // 4. "what happens after?" → downstream linkage.
  {
    const r = run('what happens after?', SESSIONS_NEW, 'director')
    assertSafeAnswer('after/sessions-new', r)
    check('after/sessions-new: cites downstream loop', /wrap-up|execution|review/i.test(r.response))
  }

  // 5. Step 7.6 enrichment: "what should I do here?" gains why + what-happens-after.
  {
    const r = run('what should I do here?', SESSIONS_NEW, 'director')
    check('enrich/sessions-new: action respond', r.action === 'respond')
    check('enrich/sessions-new: has Why this matters', r.response.includes('Why this matters:'))
    check('enrich/sessions-new: has What happens after', r.response.includes('What happens after:'))
    check('enrich/sessions-new: no navigation', r.navigateTo === null)
    check('enrich/sessions-new: requiresApproval false', r.requiresApproval === false)
  }

  // 6. Fallback: unrelated message on a loop route is NOT intercepted as a loop answer.
  {
    const r = run('show me the weather forecast', SESSIONS_NEW, 'director')
    check('fallback/unrelated: not a loop answer lead', !r.response.startsWith('On **Create a session**'))
  }

  // 7. No-loop route: a loop question on a non-loop route is not intercepted.
  {
    const r = run('why do I need to do this?', '/director/kpi', 'director')
    check('fallback/no-loop-route: not a loop answer lead', !r.response.startsWith('On **'))
  }

  // 8. Coach loop: execution route answers as coach, safely.
  {
    const r = run('what happens after?', '/coach/sessions/abc123def456ghi789', 'coach')
    assertSafeAnswer('after/coach-exec', r)
    check('after/coach-exec: cites wrap-up', /wrap-up/i.test(r.response))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`LOOP GUIDANCE WIRING CERTIFICATION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  } else {
    process.stdout.write('\nALL LOOP GUIDANCE WIRING CHECKS PASS.\n')
  }
  process.exit(failed > 0 ? 1 : 0)
}

main()
