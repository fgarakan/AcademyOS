# Merge Queue — AcademyOS

Tracks commits queued for merge and their status.

**Last updated:** 2026-05-15

---

## How the Merge Queue Works

In the Option A sequential workflow, all work happens on `main`. There is no feature branch merge step — commits land directly on `main` after the Docs Agent confirms all phases are ✓ and the human types "commit".

This file records:
- What was committed and when
- Which phases passed
- Any issues flagged during QA or UI/UX review

---

## Merge Rules

1. **All five phases must be marked ✓ in `SPRINT_BOARD.md`** before commit.
2. **QA must show 0 FAIL** — WARN items allowed only with human approval noted here.
3. **TypeScript must be clean** (`npx tsc --noEmit` exits 0).
4. **Stage only sprint-specific files** — never `git add .` or `git add -A`.
5. **Commit message format:** `Sprint NN — Short description`
6. **Human must say "commit"** — Docs Agent never self-commits.
7. **Push only after human explicitly asks** — commit and push are separate steps.

---

## Committed Sprints

### Sprint 385.5 — Five-Agent Workflow Setup V1

**Date:** 2026-05-15
**Phases:** PLAN ✓ | BUILD ✓ (docs only) | QA ✓ (docs only — no browser QA required) | UIUX ✓ (docs only) | DOCS ✓
**QA result:** Docs only — no browser QA. TypeScript not applicable.
**Files committed:**
- `docs/AGENT_GUARDRAILS.md`
- `docs/AGENT_ASSIGNMENTS.md`
- `docs/SPRINT_BOARD.md`
- `docs/MERGE_QUEUE.md`
- `docs/INTEGRATION_LOG.md`
- `docs/QA_GATE.md`
- `docs/CHANGELOG.md`
**Commit hash:** *(pending — not yet committed)*
**Push result:** *(pending)*
**Issues:** None

---

### Sprint 385 — Prototype Screen Adoption Audit V1

**Date:** 2026-05-15
**Phases:** All ✓ (docs only sprint)
**QA result:** Docs only — no browser QA required.
**Files committed:**
- `docs/PROTOTYPE_SCREEN_ADOPTION_MAP.md`
- `docs/DONNA_SCREEN_CAPABILITY_MAP.md`
- `docs/ROLE_ROUTE_MAP.md`
- `docs/MODULE_MATURITY_MAP.md`
- `docs/SCREEN_BACKEND_READINESS_MAP.md`
- `docs/CHANGELOG.md`
**Commit hash:** d390ca4
**Push result:** `main -> main (fffdd1e..d390ca4)`
**Issues:** None

---

### Sprint 384 — DONNA Modularization for Parallel Agent Development V1

**Date:** 2026-05-15
**Phases:** All ✓
**QA result:** 41 PASS / 0 FAIL / 2 WARN (WARN: voice permissions in headless browser — expected)
**Files committed:**
- `src/components/assistant/DonnaVoiceLayer.tsx`
- `src/components/assistant/DonnaWorkflowCards.tsx`
- `src/components/assistant/DonnaDeveloperTools.tsx`
- `src/components/assistant/DonnaAttendanceLayer.tsx`
- `src/components/assistant/DonnaPanelShell.tsx`
- `src/components/assistant/DonnaCommandDispatcher.ts`
- `src/components/assistant/DonnaDraftLayer.tsx`
- `src/components/assistant/DonnaReviewLayer.tsx`
- `src/components/assistant/DonnaInputBar.tsx`
- `src/components/assistant/DonnaAssistantButton.tsx`
- `docs/DONNA_MODULARIZATION_MAP.md`
- `docs/CHANGELOG.md`
**Commit hash:** fffdd1e
**Push result:** `main -> main`
**Issues:** None

---

## Pending

*(None — queue is clear. Sprint 386 not yet started.)*

---

*Last updated: Sprint 385.5*
