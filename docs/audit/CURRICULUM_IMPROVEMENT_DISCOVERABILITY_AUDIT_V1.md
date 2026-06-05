# Curriculum Improvement Discoverability Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Finding from prior audit:** "The best-designed feature in the app is hidden behind a URL param that no director will ever find."

---

## What the Feature Is

The DONNA curriculum improvement flow (`DonnaCurriculumContextPanel`) is the most evidence-rich, well-designed DONNA interaction in the app. When activated, it:

1. Reads `player_evidence_records` for the target level
2. Computes level readiness (`levelReadinessEngine`)
3. Identifies development priorities (`developmentPrioritiesEngine`)
4. Ranks improvement suggestions with confidence, evidence count, affected players, reasoning, and pre-filled draft text
5. Renders a full improvement analysis with `DonnaCurriculumImproveDraftButton` for one-click draft creation

---

## Current Entry Point

**URL:** `/director/curriculum?improve=[levelKey]`

**How a director currently discovers this:**
1. Manually know to add `?improve=orange_ball_2` to the curriculum URL
2. Stumble on it via a DONNA suggestion chip that happens to deep-link there (if one exists)
3. Read documentation or receive training

**Discoverability rating: 1/10** — no director will find this without being told.

---

## Why It Is Hidden

The feature was implemented as a server-component that renders when the `improve` search param is present. This is technically clean — no client state, no extra queries on normal load. The hiding was a side effect of implementation choice, not intentional product design.

---

## Safest Way to Surface It

### Option A: "Improve this level" button on each level card (Recommended)
- Add a small lime button/link on each level card in `CurriculumLevelTree`
- Clicking it navigates to `?improve=[levelId]` or `?improve=[levelKey]`
- Zero new infrastructure needed — just a `<Link href={?improve=...}>` on the card
- Zero risk — the panel already degrades gracefully if no evidence exists

**Effort:** 1 file change (`CurriculumLevelTree.tsx` or the level card component)
**Risk:** None — read-only panel, no mutations

### Option B: "Improve" tab in the CurriculumNodeDrawer
- The node drawer already has 12 tabs
- Adding a 13th "DONNA Improve" tab would make it more discoverable when the director opens a level
- But: 13 tabs is already overwhelming — this increases load

**Effort:** Medium (add tab to drawer, pass level context)
**Risk:** Low, but increases drawer cognitive load further

### Option C: Proactive DONNA brief on curriculum landing
- DONNA brief at the top of `/director/curriculum` includes a link to the improvement flow for the most urgent level
- Example: "Orange Ball 2 has 2 gaps affecting 8 players. [Improve with DONNA →]"
- Most discoverable — no action needed from director

**Effort:** Medium (build proactive brief component using existing data)
**Risk:** None — brief is read-only

### Option D: Surface in Academy Health / KPI page
- `/director/kpi` could surface curriculum levels with low scores alongside a "Improve with DONNA" link
- Directors visiting the KPI page are in diagnostic mode — highest intent to act on gaps

**Effort:** Medium (add curriculum section to KPI page)
**Risk:** None

---

## Where It Belongs in the Information Architecture

| Surface | Fit | Why |
|---|---|---|
| Curriculum page (level card button) | Best fit | Closest to the content being improved |
| DONNA chat | Good fit | "Improve Orange Ball 2" in DONNA chat should trigger the same flow |
| Academy Health / KPI page | Good fit | Director in analytical mode — high intent |
| Review Queue | Poor fit | Review queue is for approvals, not exploration |
| Today view | Poor fit | Today is operational — not curriculum strategy |
| Director Dashboard | Possible | Only if there's a critical curriculum gap affecting today's sessions |

---

## Does Surfacing Require UI Redesign or Small Link/Button?

**No redesign needed.** Option A (level card button) requires:

1. One `<Link>` added to the level card component in `CurriculumLevelTree.tsx`
2. The link navigates to `?improve=[level.id]` — the server component handles the rest

This is a 5-line change, not a redesign.

---

## Implementation Note (Not Building Yet)

When this is built:

```tsx
// In CurriculumLevelTree level card:
<Link
  href={`/director/curriculum?improve=${level.id}`}
  className="text-xs text-lime hover:opacity-80 flex items-center gap-1"
>
  <Sparkles className="w-3 h-3" />
  Improve with DONNA
</Link>
```

The `?improve=` param currently accepts a level key string (e.g., `orange_ball_2`). The `extractLevelFromText()` in `curriculumBuilderOperator.ts` uses regex patterns to match level keys. The `DonnaCurriculumContextPanel` resolves the level key to a DB level ID via `LEVEL_LABELS` mapping.

**Improvement needed when building:** Pass `level.id` (UUID) directly as the param to avoid the regex-to-label mapping overhead. The panel should accept either format.

---

## Recommended Next Sprint for This Feature

**Sprint N: Curriculum Improvement Discoverability V1**
- Add "Improve with DONNA" button to each level card in CurriculumLevelTree
- Update `DonnaCurriculumContextPanel` to accept level UUID directly (not just level key)
- Add a proactive DONNA brief on `/director/curriculum` linking to the most urgent level's improvement view
- No redesign — additive only
