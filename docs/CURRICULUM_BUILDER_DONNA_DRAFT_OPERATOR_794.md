# Curriculum Builder DONNA Draft Operator — Sprint 794

**Date:** 2026-05-25
**Sprint:** 794
**Depends on:** Sprint 793 (Curriculum Builder Navigation Clarity)
**Status:** COMPLETE

---

## Overview

Sprint 794 unblocks curriculum draft proposals from the level editor. A root cause bug prevented `saveCurriculumDraftAction` from ever succeeding, and no director-visible UI existed to call it. This sprint fixes the bug (application code only, no migration) and adds a visible "Propose a Change" panel to every level editor page.

---

## Bug Fix — `processing_status: 'processed'` → `'normalized'`

**File:** `src/lib/actions/curriculumDraft.ts`

**Root cause:** `saveCurriculumDraftAction` was inserting into `voice_commands` with `processing_status: 'processed'`. The `voice_commands` table has a CHECK constraint that only allows: `'pending', 'normalizing', 'normalized', 'ambiguous', 'failed'`. `'processed'` is not in the list — the INSERT always failed with a constraint violation.

**Fix:** Changed `processing_status: 'processed'` → `processing_status: 'normalized'` (one character change, no schema change). `'normalized'` is the semantically correct status: the input has been received and the intent has been normalized — no further AI processing needed for a typed curriculum draft.

**Impact:** `saveCurriculumDraftAction` now completes successfully:
1. Inserts into `voice_commands` (processing_status: 'normalized') → returns `voiceCommand.id`
2. Inserts into `proposed_actions` with `voice_command_id`, `status: 'pending_review'`, `risk_level: 'low'` → returns `proposedAction.id`
3. Returns `{ ok: true, draftId: proposedAction.id }`

**Safety invariants preserved:**
- `voice_command_id` remains required in `proposed_actions` — the voice_commands insert must succeed first
- No direct curriculum mutation — draft goes to `proposed_actions` with `status: 'pending_review'`
- All draft changes require director approval in the Review Queue before any effect
- `risk_level: 'low'` and `risk_notes` are preserved

---

## New Component — `CurriculumChangeDraftPanel`

**File:** `src/components/curriculum/builder/CurriculumChangeDraftPanel.tsx`

A client component rendered on every level editor page below the 5-card builder grid.

### Features

**Change type selector** — 5 options with expanded hint on active:
| Value | Label |
|---|---|
| `add_drill` | Add a drill |
| `add_gate` | Add an assessment gate |
| `add_fitness` | Add a fitness exercise |
| `add_mission` | Add a player mission |
| `rewrite_level` | Rewrite this level |

**Description textarea** — placeholder adapts to selected change type and level name.

**Safety note** (always visible, cannot be dismissed):
> "Draft mode — Nothing changes in your curriculum until you review and approve this in the Review Queue. Official curriculum records are never mutated directly."

**Submit behavior:**
- Calls `saveCurriculumDraftAction({ levelId, levelName, changeType, description })`
- Disabled while submitting (prevents double-submission)
- Shows "Creating draft…" during pending state

**Success state:**
- Green confirmation card: "Draft created — pending your review"
- "Go to Review Queue" button (lime primary, links to `/director/review`)
- "Propose another change" button (ghost, resets form)
- Description cleared on success

**Error state:**
- Red error card shows the action's error message verbatim
- "Try again" link restores the form without clearing description

**Not production-gated** — visible in all environments. Previous `VoiceOverrideInputPanel` was wrapped in `{process.env.NODE_ENV !== 'production' && ...}`. This panel is always rendered.

### Design

- Dark card: `background: '#060f0d'`, `border: rgba(200,255,0,0.12)` — matches builder page
- Header: DONNA `Sparkles` icon, "Propose a Change" title, "Draft Only" lime chip
- Change type selector: radio-style buttons, lime accent on active
- Textarea: transparent bg with lime focus border
- Submit: lime primary button (`#C8FF00`, `color: #0A0A0A`)
- Safety note: `Shield` icon, always visible above form

---

## Wiring in `CurriculumLevelBuilderExperience`

**File:** `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`

Added `import { CurriculumChangeDraftPanel } from './CurriculumChangeDraftPanel'`.

Rendered between the 5-card `CurriculumLevelBuilderGrid` and the "Advanced Editor" `<details>` block:

```jsx
{/* ── Propose a Change panel ───────────────────────────────── */}
<CurriculumChangeDraftPanel levelId={level.id} levelName={level.display_name} />
```

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/actions/curriculumDraft.ts` | Fix `processing_status: 'processed'` → `'normalized'` |
| `src/components/curriculum/builder/CurriculumChangeDraftPanel.tsx` | New component — draft proposal form for level editor |
| `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx` | Import + render `CurriculumChangeDraftPanel` |
| `docs/CURRICULUM_BUILDER_DONNA_DRAFT_OPERATOR_794.md` | This document |
| `docs/CHANGELOG.md` | Sprint 794 entry |

---

## TypeScript Result

Clean. `npx tsc --noEmit` passes with zero errors.

---

## Safety Audit

| Rule | Status |
|---|---|
| Voice never directly mutates core data | ✅ — draft routes through `proposed_actions`, status `pending_review` |
| No automatic application of changes | ✅ — director must explicitly approve in Review Queue |
| `execute_approved_action()` is the only execution path | ✅ — not touched |
| All mutations write to `audit_logs` | ✅ — `saveCurriculumDraftAction` unchanged except status fix |
| RLS preserved | ✅ — no schema changes |
| `canPublish: false` / `neverAutoApply: true` | ✅ — `curriculumBuilderDonnaContext.ts` not touched |
| No production gate removed from unsafe path | ✅ — `VoiceOverrideInputPanel` (unsafe) still gated; new panel is safe draft-only |

---

## Expected Score Lift

| Dimension | Before (post-793) | Expected After |
|---|---|---|
| CB-2 DONNA Wiring | 5/10 | 8/10 (+3) — draft panel now functional, not just mock |
| AIQS Primary Action Clarity (2) | 9/10 | 10/10 (+1) — level page now has a clear primary action |
| **AIQS Total** | **~87/100** | **~90/100** |
| **CB Specific** | **~58/80** | **~64/80** |
| **Combined** | **~76/100** | **~80/100** |

---

## Remaining Blockers from Sprint 791 (after Sprint 794)

1. **Coverage report hardcoded zeros** (Blocker 5) — 6 content dimensions still show 0 — target Sprint 795
2. **Mobile DONNA panel hidden** (Blocker 6) — `hidden lg:block` on level builder page — target Sprint 796

---

## Recommended Sprint 795

**Sprint 795 — Curriculum Coverage Report Live Dimensions V1**

Replace the 6 hardcoded zero inputs in the coverage model (`skillCount`, `assessmentCriteriaCount`, `evidenceRequirementCount`, `missionCount`, `badgeCount`, `parentGuidanceCount`) with honest live queries or clearly-labelled "Not connected yet" indicators. Normalize scores to available dimensions so the coverage bar is not misleadingly low.
