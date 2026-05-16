# Curriculum Ripple Regression QA

**Sprint:** 468 — Curriculum Ripple Regression and Audit V1
**Date:** 2026-05-16
**Block:** Sprints 461–468 (Curriculum Ripple Architecture Block)

---

## Purpose

Confirms that all components and files delivered in the Curriculum Ripple Block (Sprints 461–468) are:
- Preview-only — no curriculum mutations applied
- No parent or player publications
- No player level movement
- No template overwrite
- No schema changes or migrations
- No migration staged

---

## Files Delivered — Sprints 461–468

| Sprint | File | Type |
|---|---|---|
| 461 | `docs/CURRICULUM_RIPPLE_ARCHITECTURE.md` | Documentation |
| 461 | `docs/DONNA_CURRICULUM_IMPACT_MAP.md` | Documentation |
| 462 | `src/lib/curriculum/curriculumChangeScope.ts` | TypeScript model (no DB) |
| 463 | `src/components/curriculum/CurriculumImpactPreview.tsx` | UI component (no DB) |
| 464 | `src/components/curriculum/CurriculumOverrideDraftShell.tsx` | UI component (no DB) |
| 465 | `src/components/curriculum/ReadinessRecalculationPreview.tsx` | UI component (no DB) |
| 466 | `src/components/curriculum/CurriculumLanguagePreview.tsx` | UI component (no DB) |
| 467 | `src/components/curriculum/TemplateCoachBriefImpactPreview.tsx` | UI component (no DB) |

---

## Audit Checklist

### 1. Curriculum Mutation

| Check | Result |
|---|---|
| `curriculumChangeScope.ts` calls no Supabase queries | PASS — pure TypeScript types and helpers, no imports of `supabase`, no DB calls |
| `CurriculumImpactPreview.tsx` mutates no curriculum data | PASS — renders props only, no server actions, no DB writes |
| `CurriculumOverrideDraftShell.tsx` mutates no data | PASS — renders `CurriculumChangeDraft` prop only, no actions wired |
| `ReadinessRecalculationPreview.tsx` mutates no data | PASS — renders `ReadinessRecalculationSummary` prop only, no DB calls |
| `CurriculumLanguagePreview.tsx` does not publish content | PASS — copy button only, no send action, no server action |
| `TemplateCoachBriefImpactPreview.tsx` does not overwrite templates | PASS — renders `TemplateCoachBriefImpactSummary` prop only, no DB writes |

### 2. Parent / Player Publication

| Check | Result |
|---|---|
| No parent-facing send actions in any Sprint 461–468 file | PASS |
| Language preview shows "Not sent" / "Director review required" copy | PASS — `CurriculumLanguagePreview.tsx` footer; each panel shows approval state |
| `is_parent_visible` and `is_player_visible` not set to true in any file | PASS — no curriculum_content_items writes in this block |
| Parent guidance copy labeled "Not sent — director review and approval required before any publication" | PASS |

### 3. Player Level Movement

| Check | Result |
|---|---|
| No call to `finalize_player_placement()` in any Sprint 461–468 file | PASS |
| `player_curriculum_states` not written in any Sprint 461–468 file | PASS |
| Readiness preview explicitly shows `levelChangeApplied: false` per player row | PASS — `ReadinessRecalculationPreview.tsx` renders this guard per row |
| Summary copy reads: "No level changes applied" | PASS — banner in `ReadinessRecalculationPreview.tsx` |

### 4. Template Overwrite

| Check | Result |
|---|---|
| No `template_blocks` INSERT/UPDATE in any Sprint 461–468 file | PASS |
| Template impact preview shows "Template not overwritten — review required" guard | PASS — `TemplateCoachBriefImpactPreview.tsx` renders this per template |
| `templateOverwriteApplied: false` field on `TemplateImpactDetail` type | PASS — literal false type in Sprint 467 |

### 5. Schema and Migration

| Check | Result |
|---|---|
| No new migration files created in Sprints 461–468 | PASS |
| `supabase/migrations/058_template_block_exercises_rls.sql` not staged | PASS — dirty file excluded from all commits |
| `database.types.ts` not modified | PASS |
| No `package.json` or `package-lock.json` changes | PASS |

### 6. DONNA References

| Check | Result |
|---|---|
| No "DANA" references in any Sprint 461–468 file | PASS |
| DONNA referenced correctly in `DONNA_CURRICULUM_IMPACT_MAP.md` | PASS |

### 7. TypeScript

| Sprint | tsc Result |
|---|---|
| 462 — curriculumChangeScope.ts | CLEAN |
| 463 — CurriculumImpactPreview.tsx | CLEAN |
| 464 — CurriculumOverrideDraftShell.tsx | CLEAN |
| 465 — ReadinessRecalculationPreview.tsx | CLEAN |
| 466 — CurriculumLanguagePreview.tsx | CLEAN |
| 467 — TemplateCoachBriefImpactPreview.tsx | CLEAN |

---

## What This Block Does NOT Build (Deferred)

| Capability | Status | Why deferred |
|---|---|---|
| Live DB queries to populate impact previews | Not built | Requires confirmed query patterns and migration state clarity |
| Director-facing curriculum ripple page/route | Not built | Deferred to a future sprint once integration layer is defined |
| Actual curriculum override execution | Not built | Requires `execute_approved_action()` extension — migration or schema confirmation needed |
| Ripple from global/master scope | Not built | System admin scope — deferred until multi-academy architecture is confirmed |

---

## Block Completion Summary

**Sprints 461–468 complete.**

The curriculum ripple block delivers:
1. Architecture definition (Sprint 461)
2. DONNA curriculum impact capability map (Sprint 461)
3. Typed scope model with 7 scopes, guard functions, draft struct (Sprint 462)
4. Impact preview shell — 6 domains (Sprint 463)
5. Override draft shell — review-only (Sprint 464)
6. Readiness recalculation preview — before/after per player (Sprint 465)
7. Parent/player language preview — 3-audience tabs, copy buttons (Sprint 466)
8. Template and coach brief impact preview — block-level and brief-level (Sprint 467)
9. This regression and audit (Sprint 468)

All files are preview-only. All are ready to be wired to real data once integration is approved.
