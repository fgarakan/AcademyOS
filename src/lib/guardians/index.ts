// AcademyOS Guardian Framework — public surface.
//
// The framework is AcademyOS's permanent architectural immune system: a registry
// of read-only guardians that enforce the AcademyOS Constitution (docs/). Each
// guardian observes · classifies · certifies · reports · blocks regressions, and
// never mutates, repairs, or implements.

export type {
  CodeFile,
  Finding,
  FrameworkReport,
  Guardian,
  GuardianReport,
  GuardianStatus,
  RepoSnapshot,
  Severity,
} from './framework/types'
export { buildRepoSnapshot } from './framework/snapshot'
export { fingerprint, runAll, runGuardian } from './framework/runtime'
export { loadBaselineFingerprints } from './framework/baseline'
export { GUARDIANS } from './framework/registry'
export { executiveWorkspaceGuardian } from './executiveWorkspace/executiveWorkspaceGuardian'
