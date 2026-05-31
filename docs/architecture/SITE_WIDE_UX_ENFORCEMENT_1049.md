# Site-Wide AcademyOS UX Standard Enforcement — Sprint 1049

**Sprint:** 1049 — Site-Wide AcademyOS UX Standard Enforcement V1
**Date:** 2026-05-31
**File changed:** `src/app/director/fitness/templates/page.tsx`

---

## Enforcement pass scope

Sprints 1034–1048 applied targeted UX simplifications to specific pages. Sprint 1049 is a cross-cutting check for systemic violations that weren't covered in the targeted sprints.

## Finding: Remaining PageExplainerCard

`PageExplainerCard` was removed from the class templates list page in Sprint 1039 (always-visible 4-Q&A block).

A `grep -rn "PageExplainerCard"` revealed one remaining usage:
- `src/app/director/fitness/templates/page.tsx` — same pattern, same problem

The fitness templates page rendered a `PageExplainerCard` with 4 Q&A items unconditionally on every page load, even for directors who have been using fitness templates for months. Identical to the class templates issue fixed in Sprint 1039.

## Change

Removed `PageExplainerCard` render block and unused import from `src/app/director/fitness/templates/page.tsx`.

The page header, stats grid, template list, empty state, and new-template CTA are all unchanged.

---

## Summary: Duplicate DONNA entry points — scan results

Remaining "Ask DONNA" body entries reviewed during this sprint:

| Location | Status |
|---|---|
| `/director/level-up` — Ask DONNA chip for level advancement | KEEP — specific, actionable, no floating button on director pages |
| `/director/today` — Ask DONNA section | KEEP — page-specific chips, not duplicate of sidebar |
| `/coach/sessions/[id]` — DONNA wrap-up chip | KEEP — specific prompt, removed from session detail in Sprint 1045 |
| `/player/missions/[id]` — Ask DONNA | KEEP — specific context, mission-scoped |
| `/player/competition-path` — Ask DONNA link | KEEP — specific link text, no full card |
| `/parent/development` — Ask DONNA | KEEP — page-specific context |

None of the remaining "Ask DONNA" references are full duplicate surfaces — they're single inline links or chips with specific prompts. The Sprint 1040–1048 passes removed the genuine duplicates (body cards that repeated the bottom tab or floating button).
