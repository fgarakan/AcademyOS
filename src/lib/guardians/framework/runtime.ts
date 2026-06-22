// The generic guardian pipeline — implemented once for every guardian.
//
// scan → classify → report → certify → ratchet. A guardian supplies only the
// pure `inspect()`; this runtime turns its findings into a certified report and
// applies the ratchet (block regressions) against the accepted baseline.
//
// This runtime never mutates source and never repairs findings. It observes and
// certifies. The only write in the framework is the operator-invoked baseline
// snapshot in runGuardians.ts, which is not a guardian action.

import { join } from 'path'
import { loadBaselineFingerprints } from './baseline'
import type {
  FrameworkReport,
  Guardian,
  GuardianReport,
  GuardianStatus,
  Finding,
  RepoSnapshot,
} from './types'

// Stable fingerprint builder for guardian authors. Keep parts location-light.
export function fingerprint(...parts: string[]): string {
  return parts.join('::')
}

function byFingerprint(a: Finding, b: Finding): number {
  return a.fingerprint < b.fingerprint ? -1 : a.fingerprint > b.fingerprint ? 1 : 0
}

export function runGuardian(guardian: Guardian, snapshot: RepoSnapshot): GuardianReport {
  const findings = guardian.inspect(snapshot).slice().sort(byFingerprint)
  const baseline = guardian.baselinePath
    ? loadBaselineFingerprints(join(snapshot.root, guardian.baselinePath))
    : new Set<string>()

  const current = new Set(findings.map((f) => f.fingerprint))
  const newViolations = findings.filter((f) => !baseline.has(f.fingerprint))
  const clearedFromBaseline = Array.from(baseline).filter((fp) => !current.has(fp)).sort()

  const status: GuardianStatus =
    findings.length === 0 ? 'clean' : newViolations.length > 0 ? 'regressed' : 'green'

  return {
    guardianId: guardian.id,
    name: guardian.name,
    standard: guardian.standard,
    findings,
    baselineCount: baseline.size,
    currentCount: findings.length,
    newViolations,
    clearedFromBaseline,
    status,
    conformant: findings.length === 0,
  }
}

export function runAll(guardians: readonly Guardian[], snapshot: RepoSnapshot): FrameworkReport {
  const reports = guardians.map((g) => runGuardian(g, snapshot))
  return {
    reports,
    regressed: reports.some((r) => r.status === 'regressed'),
    totalNew: reports.reduce((n, r) => n + r.newViolations.length, 0),
    totalBacklog: reports.reduce((n, r) => n + r.currentCount, 0),
    fullyConformant: reports.every((r) => r.conformant),
  }
}
