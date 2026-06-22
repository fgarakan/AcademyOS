// Certification gate runner — runs every suite in the manifest and fails (exit 1)
// if any suite fails. Each suite is a self-contained `tsx`-runnable script that
// exits non-zero on failure; this runner just sequences them and aggregates.
//
// Add/remove suites in scripts/certificationSuites.ts — never here, never in CI.

import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { CERTIFICATION_SUITES } from './certificationSuites'

const root = process.cwd()
const results: { suite: string; ok: boolean }[] = []

process.stdout.write('\nAcademyOS Certification Gate — running ' + CERTIFICATION_SUITES.length + ' suite(s)\n\n')

for (const rel of CERTIFICATION_SUITES) {
  const abs = join(root, rel)
  if (!existsSync(abs)) {
    process.stdout.write(`✗ MISSING: ${rel}\n`)
    results.push({ suite: rel, ok: false })
    continue
  }
  process.stdout.write(`──────── ${rel}\n`)
  const run = spawnSync('npx', ['tsx', abs], { stdio: 'inherit', cwd: root })
  const ok = run.status === 0
  results.push({ suite: rel, ok })
  process.stdout.write(ok ? `✓ PASS — ${rel}\n\n` : `✗ FAIL — ${rel}\n\n`)
}

const failed = results.filter((r) => !r.ok)
process.stdout.write('============================================================\n')
process.stdout.write(`CERTIFICATION GATE: ${results.length - failed.length}/${results.length} suites passed\n`)
if (failed.length) {
  process.stdout.write('\nFailed suites:\n')
  failed.forEach((f) => process.stdout.write(`  ✗ ${f.suite}\n`))
}
process.stdout.write('============================================================\n')
process.exit(failed.length > 0 ? 1 : 0)
