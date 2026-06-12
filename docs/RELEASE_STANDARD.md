# AcademyOS Release Standard
## Sprint Completion Gate

A sprint is **not complete** until all five gates pass.

---

## The 5 Gates

### Gate 1 — TypeScript Clean

```bash
npx tsc --noEmit
```

**Expected:** zero errors, zero output.

If TypeScript errors exist in files you touched, the sprint is not complete. Fix only errors caused by sprint changes — do not fix pre-existing errors in unrelated files without explicit approval.

---

### Gate 2 — Sprint Certification Passes

Every sprint that creates intelligence must ship a certification file.

**Curriculum Architect:**
```bash
npx tsx src/lib/donna/curriculum/curriculumArchitectCertification.ts
```
Expected: `ALL PASS — 50/50`

**Curriculum Evolution Engine:**
```bash
npx tsx src/lib/donna/curriculum/curriculumEvolutionCertification.ts
```
Expected: `ALL PASS — 74/74`

If no certification file exists for the sprint, create one before marking complete.

**Run all certifications at once:**
```bash
npx tsx src/lib/donna/releaseCertification.ts
```

---

### Gate 3 — Production Build Passes

```bash
npm run build
```

**Expected:** exit code 0. No prerender errors. All static pages generated.

A build failure is a production blocker. The sprint is not complete if `npm run build` fails for any reason in files you touched.

Known pre-existing failures must be documented in `docs/KNOWN_LIMITATIONS.md`. A new failure introduced by a sprint must be fixed before the sprint is committed.

---

### Gate 4 — Git Status is Clean

```bash
git status --short
```

**Expected:** Only sprint-specific files appear. No unintended changes. No CPU profiles staged. No platform artifacts staged.

Specifically:
- `CPU.main.*.cpuprofile` — **never stage**
- `src/lib/donna/philosophy/_audit_consumption.ts` — **do not stage** without explicit approval
- `.env.local` — **never stage**
- `src/lib/supabase/database.types.ts` — **never stage** manually (only via `supabase gen types`)
- `node_modules/` — never stage
- `.next/` — never stage

---

### Gate 5 — Changelog Updated

```bash
# docs/CHANGELOG.md must have a new dated entry for this sprint
```

**Expected:** Entry includes sprint name, date, files created, files modified, TypeScript result, certification result.

---

## Commit Protocol

Only after all 5 gates pass:

```bash
# Stage only sprint files by name — never git add . or git add -A
git add <file1> <file2> ...

# Commit message format:
git commit -m "Sprint NNN — Short description"
# OR for mega sprints:
git commit -m "Mega Sprint NNNN–NNNN — Description"

# No Co-Authored-By footers.
# No AI attribution in commit messages.
```

**Never commit until the user explicitly says "commit".**

---

## Architecture Non-Negotiables

These rules apply to every sprint. Violating them is not permitted regardless of sprint scope.

| Rule | Why |
|---|---|
| Voice / AI never directly mutates core data | All mutations go through `proposed_actions` pipeline |
| `template_blocks` and `session_blocks` are separate tables | Never merge |
| All tables have RLS | Never create a table without it |
| `finalize_player_placement()` is the only activation function | No direct status mutations |
| `execute_approved_action()` is the only execution function | No bypassing approval |
| All major mutations write to `audit_logs` | Full audit trail required |
| No service role in application code | RLS must be respected |
| No automatic player level movement | Director approval always required |

---

## Quick Reference

```bash
# Run all automated gates:
npx tsc --noEmit && npx tsx src/lib/donna/releaseCertification.ts

# Run full build gate:
npm run build

# Confirm clean git state:
git status --short && git diff --cached --stat
```

---

## What "Sprint Complete" Means

A sprint is complete when:

1. `npx tsc --noEmit` → clean
2. All certification files for this sprint → ALL PASS
3. `npm run build` → exit 0, no prerender errors
4. `git status --short` → only sprint files, no artifacts
5. `docs/CHANGELOG.md` → updated with dated entry
6. User has said "commit"
7. Commit created with exact sprint message
8. Post-commit: `git log -1 --format=%B` confirms message format

**If any gate fails, the sprint continues until it passes.**
