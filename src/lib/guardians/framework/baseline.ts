// Ratchet support — the accepted-violation baseline.
//
// A baseline records the fingerprints of violations that already exist when a
// guardian is introduced. It is the mechanism that lets a guardian ship GREEN on
// day one without pretending the code is conformant: existing violations are
// "accepted backlog" (ratchet-only — they may shrink, never grow), while any
// fingerprint NOT in the baseline is a regression the gate blocks.
//
// Guardians never write baselines. Operators do (runGuardians.ts --write-baseline).

import { existsSync, readFileSync } from 'fs'

export interface BaselineFile {
  guardianId: string
  note?: string
  count?: number
  fingerprints: string[]
}

export function loadBaselineFingerprints(absPath: string): Set<string> {
  if (!existsSync(absPath)) return new Set()
  try {
    const parsed = JSON.parse(readFileSync(absPath, 'utf8')) as Partial<BaselineFile>
    return new Set(parsed.fingerprints ?? [])
  } catch {
    return new Set()
  }
}
