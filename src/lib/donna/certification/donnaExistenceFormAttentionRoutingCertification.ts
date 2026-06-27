// Sprint 4351 — Existence-Form Attention Routing Certification
// Regression guard for the audit fix: an existence / enumeration-form attention
// question ("Are there any players that I need to…", "Any players I should look
// at?", "Are there players who need attention?", "Do any players need review?")
// must reach the players / roster-attention engine on BOTH live routers, instead
// of falling through to defer_to_brain / general_guidance ("Get general guidance").
//
// Pure / offline: detector → both routers, the same path the live app runs.
//
// Run: npx tsx src/lib/donna/certification/donnaExistenceFormAttentionRoutingCertification.ts

import { detectRosterAttentionQuestion } from '@/lib/donna/directorPlayersDonnaIntelligence'
import { routeDonnaConversation } from '@/lib/donna/brain/donnaCanonicalRouter'
import { routeDonnaPrompt } from '@/lib/donna/donnaConversationalRouter'
import { buildDemoContext, type DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(label) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

// Live Today-page context with a watched flag + a no-level backlog — the audited
// case. attentionItems carry a player so the roster hub answer is concrete.
function todayCtx(): DirectorDonnaContext {
  return {
    ...buildDemoContext(),
    isLive: true,
    confidence: 'high',
    playerCount: 51,
    playerCurriculumStateCount: 2,
    attentionItems: [
      { playerId: 'p-alex', playerName: 'Alex Chen', reason: 'watched flag', risk: 'high', source: 'manual' },
    ],
    highRiskPlayerCount: 1,
    mediumRiskPlayerCount: 0,
  }
}

// The exact phrasings the fix must recognize (the audited prompt + the approved list).
const EXISTENCE_FORMS = [
  'Are there any players that I need to look at?',
  'Are there any players that I need to...',
  'Any players I should look at?',
  'Are there players who need attention?',
  'Do any players need review?',
  'Who needs attention?',
]

// Must NOT be pulled into roster attention — anchors the over-match guard.
const NON_ROSTER = [
  'are there any courts free?',
  'how many players are in Orange 2?',
  'are there any players in Orange 2?',
]

function run() {
  process.stdout.write('\nExistence-Form Attention Routing Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Detector recognizes every existence-form phrasing ─────────────────────
  process.stdout.write('\n── A. detectRosterAttentionQuestion recognizes existence-form ──\n')
  for (const t of EXISTENCE_FORMS) {
    check(`detects: "${t}"`, detectRosterAttentionQuestion(t))
  }
  for (const t of NON_ROSTER) {
    check(`does NOT over-match: "${t}"`, !detectRosterAttentionQuestion(t))
  }

  // ── B. routeDonnaConversation (floating DONNA / Today) → players engine ───────
  process.stdout.write('\n── B. routeDonnaConversation → players stage, not defer ──\n')
  for (const t of EXISTENCE_FORMS) {
    const r = routeDonnaConversation({ text: t, directorCtx: todayCtx(), route: '/director/today' })
    check(`"${t}" → stage 'players'`, r.matched && r.stage === 'players')
    check(`"${t}" → does NOT defer to brain`, r.stage !== 'defer_to_brain')
    check(`"${t}" → has a reality-grounded answer`, !!r.answer && r.realityGrounded)
  }
  // Over-match guard on the same router.
  {
    const r = routeDonnaConversation({ text: 'are there any courts free?', directorCtx: todayCtx(), route: '/director/today' })
    check('non-roster question does NOT hit players stage', r.stage !== 'players')
  }

  // ── C. routeDonnaPrompt (/director/donna shell) → use_roster_intel ───────────
  process.stdout.write('\n── C. routeDonnaPrompt → roster_attention / use_roster_intel ──\n')
  for (const t of EXISTENCE_FORMS) {
    const r = routeDonnaPrompt(t, '/director/today')
    check(`"${t}" → intent roster_attention`, r.intent === 'roster_attention')
    check(`"${t}" → responseMode use_roster_intel`, r.responseMode === 'use_roster_intel')
    check(`"${t}" → not a clarification`, r.shouldAskClarification === false)
  }
  // Over-match guard on the shell router.
  {
    const r = routeDonnaPrompt('are there any courts free?', '/director/today')
    check('non-roster question does NOT route to roster intel', r.responseMode !== 'use_roster_intel')
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`Existence-Form Attention Routing: ${passed}/${passed + failed} checks passed\n`)
  if (failed > 0) {
    process.stdout.write('\nFailures:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write('============================================================\n')
  process.exit(failed > 0 ? 1 : 0)
}

run()
