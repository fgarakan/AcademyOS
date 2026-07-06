// Sprint 4373 — Dabul Pilot Seeder Certification (offline / static).
//
// Proves the Dabul pilot seeder is canonical, fake/safe, loop-complete, production-guarded,
// pilot-pinned, .env.local-free, a re-skin of the God-Mode structure (not a competing
// system), and gated by an explicit approval phrase. Pure: no database, no network.
//
// Run: npx tsx src/lib/donna/certification/dabulPilotSeederCertification.ts

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  dabulPilotV1 as DS,
  DABUL_PILOT_ACADEMY_ID,
  DABUL_SEED_BATCH_ID,
  DABUL_PILOT_PROJECT_REF,
  isDabulResettable,
} from '../../../../scripts/demo/dabulPilotV1'
import { demoAcademyGodModeV1 as GOD } from '../../../../scripts/demo/demoAcademyGodModeV1'
import { resolveDataset, assertSafeTarget, FORBIDDEN_PROD_REF } from '../../../../scripts/demo/datasets'

let passed = 0
let failed = 0
const failures: string[] = []
function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}
function throws(fn: () => unknown): boolean {
  try { fn(); return false } catch { return true }
}

const root = process.cwd()
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g

function run() {
  process.stdout.write('\nDabul Pilot Seeder Certification\n')
  process.stdout.write('============================================================\n')

  // ── 1. Canonical fixed academy UUID ──────────────────────────────────────────
  process.stdout.write('\n── 1. Canonical Dabul academy UUID ──\n')
  {
    check('1', 'DABUL_PILOT_ACADEMY_ID is the fixed canonical UUID', DABUL_PILOT_ACADEMY_ID === 'dab00000-0000-4000-8000-000000000001')
    check('1', 'the dataset academy uses that exact UUID', DS.academy.id === DABUL_PILOT_ACADEMY_ID)
    const anglesId: string = '00000000-0000-0000-0000-000000000001'
    check('1', 'it is distinct from Angles + God-Mode', (DABUL_PILOT_ACADEMY_ID as string) !== anglesId && DABUL_PILOT_ACADEMY_ID !== GOD.academy.id)
  }

  // ── 2. seed_batch_id ─────────────────────────────────────────────────────────
  process.stdout.write('\n── 2. seed_batch_id ──\n')
  {
    check('2', "seed_batch_id === 'dabul_pilot_v1'", DABUL_SEED_BATCH_ID === 'dabul_pilot_v1')
    check('2', 'dataset carries that batch id', DS.seedBatchId === DABUL_SEED_BATCH_ID)
    check('2', 'the Dabul row is resettable under that batch', isDabulResettable({ is_demo_data: true, seed_batch_id: DABUL_SEED_BATCH_ID }))
    check('2', 'a different batch is NOT resettable', !isDabulResettable({ is_demo_data: true, seed_batch_id: GOD.seedBatchId }))
  }

  // ── 3. Data is fake/safe ─────────────────────────────────────────────────────
  process.stdout.write('\n── 3. Data is fake / safe ──\n')
  {
    check('3', 'academy is tagged is_demo_data', DS.academy.isDemoData === true)
    check('3', 'director is Brian Dabul', DS.director.firstName === 'Brian' && DS.director.lastName === 'Dabul')
    check('3', '1–2 coaches, 5–10 players (pilot scale)', DS.coaches.length >= 1 && DS.coaches.length <= 2 && DS.players.length >= 5 && DS.players.length <= 10)
    check('3', 'every parent maps to a real seeded player', DS.parents.every((par) => DS.players.some((p) => p.id === par.childPlayerId)))
    check('3', 'every player id is a Dabul-prefixed fake UUID', DS.players.every((p) => p.id.startsWith('dab0')))
  }

  // ── 4. No real emails / phones ───────────────────────────────────────────────
  process.stdout.write('\n── 4. No real-looking emails / phones ──\n')
  {
    const blob = JSON.stringify(DS)
    const emails = blob.match(EMAIL_RE) ?? []
    const allTest = emails.every((e) => e.toLowerCase().endsWith(`@${DS.emailDomain}`) && DS.emailDomain.endsWith('.test'))
    check('4', `every email uses the non-routable @${DS.emailDomain} domain`, allTest)
    check('4', 'director email is on the fake domain', DS.director.email.endsWith(`@${DS.emailDomain}`))
    // Scan human content only: strip fixed-format UUIDs and numeric journey/score arrays,
    // which are structural (not contact data) and would false-match a phone pattern.
    const contentOnly = blob
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
      .replace(/\[[\d,\s]*\]/g, '[]')
    check('4', 'no phone-like strings in human content', (contentOnly.match(PHONE_RE) ?? []).length === 0)
    check('4', 'parent/guardian records carry no email or phone field', DS.parents.every((p) => !('email' in p) && !('phone' in p)))
  }

  // ── 5. Covers all 10 atomic loops ────────────────────────────────────────────
  process.stdout.write('\n── 5. Covers all 10 atomic loops ──\n')
  {
    const loops = DS.loopCoverage.map((l) => l.loop).sort((a, b) => a - b)
    check('5', 'exactly loops 1..10 are covered', JSON.stringify(loops) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
    check('5', 'every loop names a seeded element AND a createable path', DS.loopCoverage.every((l) => l.seededElement.length > 0 && l.createablePath.length > 0))
    check('5', 'loop 3 (templates) has seeded templates', DS.templates.length >= 1 && DS.loopCoverage.some((l) => l.loop === 3))
    check('5', 'loop 9 (review) has seeded approvals', DS.approvals.length >= 2)
    check('5', 'loop 7 (wrap-up) has a completed session', DS.sessions.some((s) => s.status === 'completed'))
    check('5', 'DONNA safe + unsafe prompt sets both present', DS.donnaSafePrompts.length >= 3 && DS.donnaUnsafePrompts.length >= 3)
  }

  // ── 6. Does not target production ─────────────────────────────────────────────
  process.stdout.write('\n── 6. Never targets production ──\n')
  {
    const dabul = resolveDataset({ DEMO_DATASET: 'dabul_pilot_v1' })
    check('6', 'FORBIDDEN_PROD_REF is the live backend ref', FORBIDDEN_PROD_REF === 'dbjjhhxdkpdreytsozlq')
    check('6', 'assertSafeTarget REFUSES a production URL', throws(() => assertSafeTarget(dabul, `https://${FORBIDDEN_PROD_REF}.supabase.co`)))
    check('6', 'assertSafeTarget REFUSES an empty/missing URL', throws(() => assertSafeTarget(dabul, undefined)))
  }

  // ── 7. Requires explicit pilot env/target ─────────────────────────────────────
  process.stdout.write('\n── 7. Requires the explicit pilot target ──\n')
  {
    const dabul = resolveDataset({ DEMO_DATASET: 'dabul_pilot_v1' })
    check('7', 'Dabul bundle pins the pilot project ref', dabul.requiredProjectRef === DABUL_PILOT_PROJECT_REF && DABUL_PILOT_PROJECT_REF === 'cctqtapzpcwuffbmapmk')
    check('7', 'assertSafeTarget REFUSES a non-pilot (but non-prod) URL', throws(() => assertSafeTarget(dabul, 'https://some-other-project.supabase.co')))
    check('7', 'assertSafeTarget ACCEPTS the pilot URL', !throws(() => assertSafeTarget(dabul, `https://${DABUL_PILOT_PROJECT_REF}.supabase.co`)))
  }

  // ── 8. Does not use .env.local ────────────────────────────────────────────────
  process.stdout.write('\n── 8. Pilot scripts do not use .env.local ──\n')
  {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    const seedScript = pkg.scripts['dabul:seed:pilot'] ?? ''
    const resetScript = pkg.scripts['dabul:reset:pilot'] ?? ''
    check('8', 'dabul:seed:pilot exists', seedScript.length > 0)
    check('8', 'dabul:reset:pilot exists', resetScript.length > 0)
    check('8', 'neither pilot script references .env.local', !seedScript.includes('.env.local') && !resetScript.includes('.env.local'))
    check('8', 'both pilot scripts set DEMO_DATASET=dabul_pilot_v1', seedScript.includes('DEMO_DATASET=dabul_pilot_v1') && resetScript.includes('DEMO_DATASET=dabul_pilot_v1'))
  }

  // ── 9. Reuses the God-Mode structure (no competing system) ────────────────────
  process.stdout.write('\n── 9. Re-skin of God-Mode, not a competing system ──\n')
  {
    const godKeys = Object.keys(GOD).sort()
    const dabulKeys = Object.keys(DS)
    check('9', 'Dabul dataset is a superset of the God-Mode dataset shape', godKeys.every((k) => dabulKeys.includes(k)))
    check('9', 'reuses the shared seed/reset runner registry (resolveDataset)', resolveDataset({ DEMO_DATASET: 'dabul_pilot_v1' }).dataset === DS)
    check('9', 'God-Mode dataset still resolvable (default preserved)', resolveDataset({}).dataset === GOD)
  }

  // ── 10. Execution gated by explicit approval phrase ───────────────────────────
  process.stdout.write('\n── 10. Execution stays gated by an approval phrase ──\n')
  {
    const planPath = join(root, 'docs/pilot/DABUL_PILOT_RESET_AND_SEED_EXECUTION_PLAN.md')
    let plan = ''
    try { plan = readFileSync(planPath, 'utf8') } catch { /* handled below */ }
    check('10', 'execution plan exists', plan.length > 0)
    check('10', 'plan states the exact seed approval phrase', plan.includes('seed Dabul dabul_pilot_v1 on cctqtapzpcwuffbmapmk, seed approved'))
    const seedSrc = readFileSync(join(root, 'scripts/demo/seed.ts'), 'utf8')
    check('10', 'seeder is dry-run by default (requires --confirm)', seedSrc.includes("includes('--confirm')"))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`DABUL PILOT SEEDER: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nDABUL PILOT SEEDER CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run()
