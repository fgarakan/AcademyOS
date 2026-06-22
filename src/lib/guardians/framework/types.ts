// AcademyOS Guardian Framework — core contracts.
//
// The Guardian Framework is AcademyOS's permanent architectural immune system.
// It exists SOLELY to enforce the AcademyOS Constitution (the product standards
// in docs/, beginning with docs/EXECUTIVE_WORKSPACE_STANDARD.md).
//
// Guardians are READ-ONLY. They never mutate, never repair, never implement.
// They only: observe · classify · certify · report · block regressions.
//
// Architecture: ONE impure boundary (the RepoSnapshot collector in snapshot.ts)
// reads files into an immutable snapshot; every Guardian is a PURE, DETERMINISTIC
// function over that snapshot. The generic pipeline (classify → report → certify →
// ratchet) lives once in runtime.ts, so a guardian author writes only `inspect()`.
//
// Adding Guardian N = one rule file + one line in registry.ts. See README.md.

export type Severity = 'critical' | 'high' | 'medium' | 'low'

// clean    — zero findings (fully conformant with the standard)
// green    — findings exist but all are in the accepted baseline (backlog not growing) → CI passes
// regressed — a finding exists outside the baseline (new sidebar ownership introduced) → CI fails
export type GuardianStatus = 'clean' | 'green' | 'regressed'

export interface CodeFile {
  readonly path: string // repo-relative, posix-separated
  readonly ext: string
  readonly source: string
}

export interface RepoSnapshot {
  readonly root: string
  readonly files: readonly CodeFile[]
  // Select the files a guardian inspects, by glob (supports `*` and `**`).
  surface(globs: readonly string[]): readonly CodeFile[]
}

export interface Finding {
  readonly guardianId: string
  readonly ruleId: string
  readonly severity: Severity
  readonly file: string
  readonly line?: number
  readonly message: string
  readonly evidence: string
  // Stable identity used by the ratchet. Location-light (no line numbers) so it
  // survives unrelated edits; changes only when the real violation changes.
  readonly fingerprint: string
}

export interface Guardian {
  readonly id: string // 'executive-workspace'
  readonly name: string // 'ExecutiveWorkspaceGuardian'
  readonly standard: string // doc path the guardian enforces
  readonly description: string
  readonly surface: readonly string[] // globs the guardian inspects
  readonly baselinePath?: string // repo-relative JSON of accepted-violation fingerprints
  // PURE + DETERMINISTIC. Same snapshot in → same findings out. No I/O, no mutation.
  inspect(snapshot: RepoSnapshot): Finding[]
}

export interface GuardianReport {
  readonly guardianId: string
  readonly name: string
  readonly standard: string
  readonly findings: readonly Finding[]
  readonly baselineCount: number
  readonly currentCount: number
  readonly newViolations: readonly Finding[] // findings NOT in the baseline → regressions
  readonly clearedFromBaseline: readonly string[] // baseline fingerprints no longer present → tighten
  readonly status: GuardianStatus
  readonly conformant: boolean // currentCount === 0
}

export interface FrameworkReport {
  readonly reports: readonly GuardianReport[]
  readonly regressed: boolean
  readonly totalNew: number
  readonly totalBacklog: number
  readonly fullyConformant: boolean
}
