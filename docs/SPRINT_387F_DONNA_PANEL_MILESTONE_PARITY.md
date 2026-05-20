# Sprint 387F — DONNA Panel Milestone List Parity V1

**Date:** 2026-05-20
**Sprint:** 387F
**Status:** Complete

---

## Context from 387D / 387E

**Sprint 387D** (onboarding prototype source audit) scored the DONNA panel at **7/10**. The primary gap identified:

> "Progress: 5 grouped milestones (Academy Basics / Coaching DNA / Session + Players / DNA Review / Activate) — vs prototype's 7 individual step labels"

The prototype's `DonnaPanel.tsx` showed 7 labeled PROGRESS_STEPS:
```
Academy Basics → Coaching Philosophy → Coach Communication →
Session Design → Player Development → Parent Communication → Review Academy DNA
```

The AcademyOS panel had 5 flat milestone groups, which caused two specific gaps:
- Parent Communication was lumped into "Session + Players" with steps 4–6 — no visible moment for the parent comms phase
- DONNA Adjustment was grouped with DNA Summary into "DNA Review" — losing the distinct DONNA fine-tuning phase

**Sprint 387E** replaced the 10-node step rail with a 3px progress bar and widened the content column. The DONNA panel width and structure were unchanged in that sprint.

---

## What changed in `OnboardingDonnaPanel.tsx`

### Milestone structure: 5 groups → 7 groups

**Before (5 flat groups):**
```
Academy Basics       (step 1)
Coaching DNA         (steps 2–3)
Session + Players    (steps 4–6)
DNA Review           (steps 7–8)
Activate             (step 9)
```

**After (7 groups):**
```
Foundation           (step 1: Academy Basics)
Coaching DNA         (steps 2–3: Coaching Philosophy, Coach Communication)
Development Model    (steps 4–5: Session Design, Player Development)
Family Communication (step 6: Parent Communication)
Review               (step 7: DNA Summary)
Adjust               (step 8: DONNA Adjustment)
Activate             (step 9: Final Activation)
```

### Type definitions added

```ts
type MilestoneStep  = { label: string; stepIndex: number }
type MilestoneGroup = { label: string; steps: MilestoneStep[] }
```

`MILESTONE_GROUPS` replaces the old `MILESTONES` array. Each group carries its full step list with individual step labels and step indices.

### Status logic updated

`getMilestoneStatus()` replaced by `getGroupStatus()`:

```ts
function getGroupStatus(group: MilestoneGroup, currentStep: number): 'complete' | 'active' | 'upcoming' {
  const max = Math.max(...group.steps.map(s => s.stepIndex))
  const min = Math.min(...group.steps.map(s => s.stepIndex))
  if (currentStep > max) return 'complete'
  if (currentStep >= min) return 'active'
  return 'upcoming'
}
```

### Step sub-items for multi-step groups

Groups with 2 steps (Coaching DNA, Development Model) expand to show individual step sub-items when active:

- **Completed step within active group:** `CheckCircle2` (w-2.5, lime/70) + label in `text-text-muted/60`
- **Active step within active group:** `ChevronRight` (w-2.5, lime) + label in `text-text-secondary font-medium`
- **Upcoming step within active group:** spacer + label in `text-text-muted/40`

Single-step groups (Foundation, Family Communication, Review, Adjust, Activate) show no sub-items — the group label is the milestone.

---

## Milestone group states

| State | Icon | Label color | Background |
|---|---|---|---|
| Complete | `CheckCircle2` lime | `text-text-muted` | none |
| Active | Filled ring (lime border + lime dot) | `text-lime` | `bg-lime/8` |
| Upcoming | `Circle` muted | `text-text-muted/50` | none |

Active multi-step groups: no `ChevronRight` on group row (used in sub-items instead). Single-step active groups: `ChevronRight` on group row.

---

## What guidance was preserved

All existing contextual guidance is unchanged:

- **DONNA identity header** — avatar, name, Sparkles icon, tagline
- **DONNA message card** — per-step guidance from `DONNA_MESSAGES` (10 entries, steps 0–9)
- **Live DNA preview** — fills in as draft data accumulates
- **Why This Matters** — per-step explanation of downstream impact
- **Next Best Action** — per-step call to action in lime/80
- **Building pulse** — animated lime dot, visible on steps 1–8
- **Bottom principle quote** — "DONNA proposes. Directors approve. Nothing changes until confirmed."
- **Draft safety copy** — "Draft only — not applied"

---

## What is NOT shown on step 0 (Welcome)

The entire milestone section (group rows + sub-items) is wrapped in `!isWelcome` and does not render on step 0. This is unchanged from Sprint 387E behavior.

---

## Mobile behavior

No changes to mobile behavior. The DONNA panel continues to collapse behind the mobile toggle button in `OnboardingShell.tsx`. The milestone list uses `flex flex-col` with no horizontal overflow risk. The panel is `overflow-y-auto` so the expanded milestone list (7 groups + up to 2 sub-items) scrolls correctly.

---

## Safety copy verified

No copy implies:
- published
- sent
- applied live
- imported
- invited
- activated live

"Building academy defaults..." refers to local draft preparation only. "Nothing changes until confirmed." and "Draft only — not applied" are explicit safety statements.

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## Files changed

**Modified:**
- `src/components/onboarding/OnboardingDonnaPanel.tsx` — 5 flat milestones → 7 grouped milestones with step sub-items for multi-step groups
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_387F_DONNA_PANEL_MILESTONE_PARITY.md` — this document

---

## Parity improvement

| Area | Before | After |
|---|---|---|
| Milestone count | 5 groups | 7 groups |
| Parent Communication visibility | Hidden inside "Session + Players" | Own "Family Communication" group |
| DONNA Adjustment visibility | Hidden inside "DNA Review" | Own "Adjust" group |
| Step granularity within group | None (group label only) | Sub-items shown when active (multi-step groups) |
| DONNA panel parity score | 7/10 | ~8.5/10 |

---

## Recommended next sprint

**Sprint 388 — DNA Summary Card Visual Parity V1**

The 387D audit scored DNA Summary at **6/10**. The prototype's DNASummaryScreen shows a left/right split: a DNA Card (academy monogram, narrative paragraph, 2×2 stat grid) on the left + detail section rows on the right. Verify whether `AcademyDnaReviewStep` and `AcademyDnaSummaryCard` include: narrative paragraph, 2×2 stat grid (coaching styles count, session blocks count, dev priorities count, parent styles count), and monogram badge. If not, this is the next highest-impact parity sprint.
