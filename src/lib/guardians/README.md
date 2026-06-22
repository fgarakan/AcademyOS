# AcademyOS Guardian Framework

AcademyOS's **permanent architectural immune system**. A registry of read-only
guardians that continuously enforce the AcademyOS Constitution (the product
standards in `docs/`, beginning with `EXECUTIVE_WORKSPACE_STANDARD.md`).

The Constitution defines the laws. The Guardians enforce the laws.

## What a guardian is — and is not

Every guardian only:

- **Observes** — reads an immutable snapshot of the source.
- **Classifies** — turns observations into typed `Finding`s with a severity.
- **Certifies** — produces a pass/fail `GuardianReport`.
- **Reports** — prints human-readable results.
- **Blocks regressions** — fails CI when a new violation appears.

A guardian **never** mutates, **never** repairs, **never** implements. It cannot
change a single byte of source. The framework's only write is the operator
command `--write-baseline`, which is not a guardian action.

## Architecture (one impure boundary, pure guardians)

```
buildRepoSnapshot()        ← the ONLY impure step: read files → immutable snapshot
        │
        ▼
Guardian.inspect(snapshot) ← PURE + DETERMINISTIC. same input → same findings
        │
        ▼
runGuardian()              ← generic pipeline: classify → report → certify → ratchet
```

- `framework/snapshot.ts` — the impure collector. Guardians never touch `fs`.
- `framework/types.ts` — the `Guardian` contract and report shapes.
- `framework/runtime.ts` — the generic pipeline + the ratchet, written once.
- `framework/baseline.ts` — accepted-violation baselines (ratchet-only).
- `framework/registry.ts` — the single plug-in point.
- `runGuardians.ts` — the `npx tsx`-runnable CI entrypoint.

## The ratchet (how a guardian ships GREEN without faking conformance)

When a guardian is introduced, the code usually already violates the standard.
Rather than pretend otherwise, the existing violations are snapshotted into a
**baseline** of accepted fingerprints. From then on:

- a finding **in** the baseline = accepted backlog → `GREEN` (CI passes),
- a finding **not in** the baseline = regression → `REGRESSED` (CI fails),
- the baseline may **shrink** (as a convergence sprint moves work to the page),
  **never grow**.

So the product becomes progressively harder to make worse: every law a guardian
encodes is a regression that can no longer be reintroduced by accident.

## Run it

```bash
# CI mode — exits 1 if any guardian regressed
npx tsx src/lib/guardians/runGuardians.ts

# Operator: snapshot current backlog into baselines (on introduction, or to
# tighten after a convergence sprint removes violations)
npx tsx src/lib/guardians/runGuardians.ts --write-baseline
```

## Add Guardian N

1. Create `src/lib/guardians/<area>/<area>Guardian.ts` exporting a `Guardian`.
   Implement only the pure `inspect(snapshot): Finding[]`. Use `fingerprint(...)`
   for stable, location-light identities.
2. Give it a `baselinePath` and create the JSON (`{ "guardianId": "...",
   "fingerprints": [] }`).
3. Append it to `GUARDIANS` in `framework/registry.ts` — one line.
4. Run `--write-baseline` once to record the current backlog, then run CI mode to
   confirm `GREEN`.

No other framework file changes.

## Roadmap — guardians grow to cover the whole Constitution

| # | Guardian | Standard | Status |
|---|---|---|---|
| 1 | `ExecutiveWorkspaceGuardian` | Executive Workspace Standard | **built** |
| 2 | `CognitiveLoadGuardian` | Cognitive Load Standard | planned |
| 3 | `DonnaGuidanceGuardian` | DONNA Guidance Standard | planned |
| 4 | `PageOwnershipGuardian` | Page Ownership Standard | planned |
| 5 | `InformationHierarchyGuardian` | Information Hierarchy Standard | planned |
| 6 | `DesignSystemGuardian` | Design System Standard | planned |
