# Sprint 798 — Curriculum Builder DONNA Grid Visual Pass

**Date:** 2026-05-25
**Sprint:** 798
**Type:** Visual polish + safe local state wire
**Files changed:** 4 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 797 certified the Curriculum Builder at **AIQS 91/100 · CB-Specific 74/80 (92.5%) · Combined ~87/100 (Grade A−)**.

Remaining gaps identified in the 797 audit:

| File | Issue |
|---|---|
| `CurriculumDonnaPanel.tsx` | 3× `text-[9px]`, all-teal brand accent |
| `CurriculumLevelBuilderGrid.tsx` | 2× `text-[9px]`, teal "Ask DONNA" button, teal active border |
| Chip-to-DraftPanel wiring | DONNA action chips had no effect on DraftPanel — two isolated surfaces |

Sprint 798 closes all three gaps with zero backend risk.

---

## Changes

### 1. CurriculumDonnaPanel.tsx — Teal-to-lime + typography

**Teal-to-lime replacements (20+ values):**

| Before | After |
|---|---|
| `#11d9df` | `#C8FF00` |
| `rgba(17,217,223,0.55)` | `rgba(200,255,0,0.55)` |
| `rgba(17,217,223,0.30)` | `rgba(200,255,0,0.30)` |
| `rgba(17,217,223,0.28)` | `rgba(200,255,0,0.28)` |
| `rgba(17,217,223,0.22)` | `rgba(200,255,0,0.22)` |
| `rgba(17,217,223,0.16)` | `rgba(200,255,0,0.16)` |
| `rgba(17,217,223,0.12)` | `rgba(200,255,0,0.12)` |
| `rgba(17,217,223,0.10)` | `rgba(200,255,0,0.10)` |
| `rgba(17,217,223,0.08)` | `rgba(200,255,0,0.08)` |
| `rgba(17,217,223,0.06)` | `rgba(200,255,0,0.06)` |
| `rgba(17,217,223,0.05)` | `rgba(200,255,0,0.05)` |
| `rgba(17,217,223,0.04)` | `rgba(200,255,0,0.04)` |
| `rgba(17,217,223,0.03)` | `rgba(200,255,0,0.03)` |

**Typography fixes:**

| Location | Before | After |
|---|---|---|
| "Active" badge | `text-[9px]` | `text-[10px]` |
| "Curriculum Health" label | `text-[9px]` | `text-[10px]` |
| Bottom disclaimer | `text-[9px]` | `text-[10px]` |

**Preserved:** Semantic stage colors in `healthItems` (red, orange, green, yellow, purple) are driven by caller — untouched.

---

### 2. CurriculumLevelBuilderGrid.tsx — Teal-to-lime + typography

| Location | Before | After |
|---|---|---|
| EmptyBlock "Ask DONNA to draft one" | `color: '#11d9df'` | `color: '#C8FF00'` |
| SectionCard active border | `rgba(17,217,223,0.22)` | `rgba(200,255,0,0.22)` |
| "Ask DONNA" button border | `rgba(17,217,223,0.22)` | `rgba(200,255,0,0.22)` |
| "Ask DONNA" button color | `#11d9df` | `#C8FF00` |
| "Ask DONNA" button bg (active) | `rgba(17,217,223,0.10)` | `rgba(200,255,0,0.10)` |
| "Ask DONNA" button bg (inactive) | `rgba(17,217,223,0.05)` | `rgba(200,255,0,0.05)` |
| Status chip label size | `text-[9px]` | `text-[10px]` |
| "Draft only" safety note | `text-[9px]` | `text-[10px]` |

---

### 3. CurriculumChangeDraftPanel.tsx — Export ChangeType + externalChangeType prop

```tsx
// Before
type ChangeType = 'add_drill' | 'add_gate' | 'add_fitness' | 'add_mission' | 'rewrite_level'
interface Props { levelId: string; levelName: string }

// After
export type ChangeType = 'add_drill' | 'add_gate' | 'add_fitness' | 'add_mission' | 'rewrite_level'
interface Props {
  levelId: string
  levelName: string
  externalChangeType?: ChangeType | null  // pre-selection only — no mutation, no auto-submit
}
```

`useEffect` inside component:
```tsx
useEffect(() => {
  if (externalChangeType) {
    setChangeType(externalChangeType)
  }
}, [externalChangeType])
```

- Sets the radio-button selection only
- Does NOT clear description text
- Does NOT submit the form
- Does NOT touch any DB record

---

### 4. CurriculumLevelBuilderExperience.tsx — DONNA chip → DraftPanel pre-selection

#### Mapper function (pure, deterministic)

```
DONNA label               → ChangeType
─────────────────────────────────────────
"Add a skill"             → 'add_drill'
"Add a drill"             → 'add_drill'
"Add an assessment gate"  → 'add_gate'
"Add a fitness exercise"  → 'add_fitness'
"Add a player mission"    → 'add_mission'
"Rewrite this level"      → 'rewrite_level'
"Skip to another level"   → null (no pre-selection)
(any unrecognised label)  → null
```

#### State flow

```
User clicks DONNA chip
       ↓
handleDonnaAction(label)
       ↓
actionLabelToChangeType(label) → ChangeType | null
       ↓
setPendingDraftType(ct)         ← local React state only
       ↓
<CurriculumChangeDraftPanel externalChangeType={pendingDraftType} />
       ↓
useEffect → setChangeType(externalChangeType)  ← radio selection updated
       ↓
User reads the pre-selected type, types a description, clicks Create Draft
       ↓
saveCurriculumDraftAction(...)  ← unchanged, existing safe path
```

**No mutation occurs until the user explicitly clicks Create Draft.**
**No approval is bypassed.**

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation from chip click | ✅ Local state only |
| No auto-submit | ✅ User must type + click |
| `saveCurriculumDraftAction` unchanged | ✅ Not touched |
| Review queue still required | ✅ Draft goes to review queue as before |
| RLS not touched | ✅ No backend changes |
| No migrations | ✅ None |
| No new npm packages | ✅ None |
| Official curriculum records not mutated | ✅ |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift after Sprint 798

| Dimension | Sprint 797 | Sprint 798 estimate |
|---|---|---|
| AIQS overall | 91/100 | ~93/100 |
| CB-Specific | 74/80 | ~76/80 |
| Combined | ~87/100 | ~89/100 |

**Key gains:**
- CB-2 DONNA Integration: chip-to-preselect wiring closes the DONNA action isolation gap (+1–2 pts)
- CB-6 Typography: last `text-[9px]` instances in DonnaPanel + Grid resolved (+1 pt)
- AIQS-3 Visual Consistency: full lime brand across all curriculum builder surfaces (+1 pt)

---

## Recommended Sprint 799

**Suggested:** Curriculum Builder — DONNA Chip Scroll-to-DraftPanel

When the user clicks a DONNA chip, scroll the DraftPanel into view so they see the pre-selection immediately without having to manually scroll down. No DB changes. Pure UX refinement.

Alternative: Curriculum Builder — DraftPanel Reset on Level Change. When the user navigates to a different level, reset `pendingDraftType` and `description` state to avoid stale pre-selection.
