// AcademyOS Release Certification
// Run: npx tsx src/lib/donna/releaseCertification.ts
//
// Verifies all certification suites pass and TypeScript is clean.
// Production build must be run separately: npm run build
// (cannot be called from within a Next.js source file without a circular build)

import { execSync } from 'child_process'

// Always run from project root: npx tsx src/lib/donna/releaseCertification.ts
const ROOT = process.cwd()

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function section(name: string) {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  ${name}`)
  console.log('─'.repeat(50))
}

function run(label: string, cmd: string): boolean {
  try {
    const output = execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim()
    console.log(`  ✓ ${label}`)
    if (output) {
      const lines = output.split('\n').filter(l => l.includes('PASS') || l.includes('assertions'))
      if (lines.length > 0) console.log(`    ${lines[lines.length - 1]}`)
    }
    passed++
    return true
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; message?: string }
    console.error(`  ✗ FAIL: ${label}`)
    const out = e.stdout?.toString() ?? ''
    const errOut = e.stderr?.toString() ?? ''
    const failLines = (out + '\n' + errOut).split('\n').filter(l => l.includes('✗') || l.includes('error TS') || l.includes('FAILED'))
    failLines.slice(0, 5).forEach(l => console.error(`    ${l.trim()}`))
    failed++
    return false
  }
}

// ── Certification suites ──────────────────────────────────────────────────────

section('1. TypeScript')
run(
  'npx tsc --noEmit (zero type errors)',
  'npx tsc --noEmit',
)

section('2. Curriculum Architect Certification')
run(
  'curriculumArchitectCertification (50 assertions)',
  'npx tsx src/lib/donna/curriculum/curriculumArchitectCertification.ts',
)

section('3. Curriculum Evolution Certification')
run(
  'curriculumEvolutionCertification (74 assertions)',
  'npx tsx src/lib/donna/curriculum/curriculumEvolutionCertification.ts',
)

section('4. Command Center Certification')
// commandCenterCertification.ts if it exists
try {
  execSync('test -f src/lib/donna/operations/commandCenterCertification.ts', { cwd: ROOT })
  run(
    'commandCenterCertification',
    'npx tsx src/lib/donna/operations/commandCenterCertification.ts',
  )
} catch {
  console.log('  — commandCenterCertification.ts not found (skipped)')
}

section('5. Evolution Memory Certification')
run(
  'curriculumEvolutionMemoryCertification (memory retrieval + suppression filter)',
  'npx tsx src/lib/donna/curriculum/curriculumEvolutionMemoryCertification.ts',
)

section('6. Director Operating System Certification')
run(
  'directorOperatingSystemCertification (decisions, returning director, nav, command bar)',
  'npx tsx src/lib/donna/operations/directorOperatingSystemCertification.ts',
)

section('7. Action Execution Certification')
run(
  'donnaActionExecutionCertification (registry, drafts, memory, in-context surfacing, V1 model)',
  'npx tsx src/lib/donna/actions/donnaActionExecutionCertification.ts',
)

section('8. Production Build')
console.log('  — npm run build must be run manually:')
console.log('    npm run build')
console.log('    Expected: exit 0, no prerender errors')
console.log('  NOTE: /login Suspense fix is in place. Build should pass.')

// ── Result ────────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50))
if (failed === 0) {
  console.log(`✓ RELEASE CERTIFICATION PASSED — ${passed}/${passed} checks`)
  console.log('')
  console.log('  Automated checks: PASS')
  console.log('  Manual step remaining: npm run build')
  console.log('')
  console.log('  AcademyOS is ready to commit and deploy.')
} else {
  console.error(`✗ RELEASE CERTIFICATION FAILED — ${failed} check(s) failed`)
  console.error('')
  console.error('  A sprint is not complete while certification fails.')
  console.error('  Fix all failures before committing.')
  process.exit(1)
}
