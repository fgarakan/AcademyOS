// AcademyOS Guardian Framework — CI entrypoint.
//
// Run (CI mode — exits 1 if any guardian regressed):
//   npx tsx src/lib/guardians/runGuardians.ts
//
// Operator command — snapshot the current backlog into each guardian's baseline
// (used once when a guardian is introduced, and to TIGHTEN the baseline after a
// convergence sprint removes violations). This is an operator action, not a
// guardian action — guardians themselves never write:
//   npx tsx src/lib/guardians/runGuardians.ts --write-baseline

import { writeFileSync } from 'fs'
import { join } from 'path'
import { buildRepoSnapshot } from './framework/snapshot'
import { runAll } from './framework/runtime'
import { GUARDIANS } from './framework/registry'

const root = process.cwd()
const snapshot = buildRepoSnapshot(root)

if (process.argv.includes('--write-baseline')) {
  for (const g of GUARDIANS) {
    if (!g.baselinePath) continue
    const fingerprints = Array.from(new Set(g.inspect(snapshot).map((f) => f.fingerprint))).sort()
    const body = {
      guardianId: g.id,
      note: 'Accepted backlog — ratchet-only. Guardians never repair; this records existing violations so the gate blocks NEW ones. Shrinks as the owning convergence sprint moves work to the page; never grows.',
      count: fingerprints.length,
      fingerprints,
    }
    writeFileSync(join(root, g.baselinePath), JSON.stringify(body, null, 2) + '\n')
    process.stdout.write(`baseline written: ${g.baselinePath} (${fingerprints.length} accepted)\n`)
  }
  process.exit(0)
}

const report = runAll(GUARDIANS, snapshot)

process.stdout.write('\nAcademyOS Guardian Framework — architectural immune system\n')
process.stdout.write('Guardians observe · classify · certify · report · block regressions. They never mutate.\n\n')

for (const r of report.reports) {
  const tag =
    r.status === 'clean' ? 'CLEAN ✓' : r.status === 'green' ? 'GREEN ✓ (ratcheting)' : 'REGRESSED ✗'
  process.stdout.write(`${r.name} — ${r.standard}\n`)
  process.stdout.write(
    `  status: ${tag}   backlog: ${r.currentCount}   new: ${r.newViolations.length}   cleared: ${r.clearedFromBaseline.length}\n`,
  )
  for (const f of r.newViolations) {
    process.stdout.write(`  ✗ NEW [${f.ruleId}] ${f.file}:${f.line ?? '?'} — ${f.message}\n`)
  }
  if (r.clearedFromBaseline.length) {
    process.stdout.write(
      `  ↘ ${r.clearedFromBaseline.length} baseline item(s) cleared — run --write-baseline to tighten the ratchet.\n`,
    )
  }
  process.stdout.write('\n')
}

if (report.regressed) {
  process.stdout.write(
    `RESULT: REGRESSED — ${report.totalNew} new violation(s). The sidebar may not gain new workflow ownership.\n`,
  )
  process.exit(1)
}

process.stdout.write(
  report.fullyConformant
    ? 'RESULT: FULLY CONFORMANT — all guardians clean.\n'
    : `RESULT: GREEN — no new violations. Accepted backlog: ${report.totalBacklog} (ratchet-only).\n`,
)
process.exit(0)
