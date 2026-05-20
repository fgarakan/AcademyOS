# Sprint 390 — Final Activation Next-Steps Card Grid V1

**Date:** 2026-05-20
**Sprint:** 390
**Status:** Complete

---

## Context from Sprint 387D audit

The 387D audit scored `ActivationChecklistStep` at **5/10** with this description:

> "Keep from prototype: Success header (52px circle with CheckCircle2), headline 'Your academy foundation is ready.', DONNA message bubble, DNA Active pills summary row, 6 'next steps' card grid (icon, label, desc, 'Set up →' CTA), 'Continue Setup' primary + 'Go to Director Dashboard' ghost buttons."
> "Required changes: Add the success celebration header (circle + CheckCircle2) above the checklist. Add the 6 'Continue Setup' task cards grid (linking to actual routes like /director/class-templates/new, /director/fitness/templates/new, etc.). Keep the AcademyOS checklist — it's more functional than the prototype version."

The celebration header and DONNA bubble already existed in AcademyOS. The gap was the card grid: the prior implementation had `POST_DNA_TASKS` — a plain 2-column grid of `<a>` tags with no icons, no status badges, and minimal descriptions.

---

## What changed

### `ActivationChecklistStep.tsx` — card grid replaced

**Before (`POST_DNA_TASKS`):**
- 6 plain `<a>` tags in a `sm:grid-cols-2` grid
- No icons
- No status badges
- Short generic descriptions
- "Preview Portals" linked to `/director` (the dashboard — not a real portal preview)
- No visual hierarchy between "do now" vs "do later" tasks

**After (`NEXT_STEP_CARDS`):**
- Full 3-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Each active card: icon badge + status chip + label + description + CTA arrow
- Deferred card (Portal Preview): visually dimmed with `opacity-60`, no navigation, "Not available yet" copy
- Hover state: `group-hover:text-lime` on CTA text and arrow, `group-hover:text-text-primary` on label
- `flex flex-col` on each card with `flex-1` description and `mt-auto` CTA ensures equal-height rows

#### Card list

| # | Card | Route | Status badge | Active? |
|---|---|---|---|---|
| 1 | Review Curriculum | `/director/curriculum` | `Next setup task` (lime) | ✅ Active |
| 2 | Create Class Template | `/director/class-templates/new` | `Draft` (blue) | ✅ Active |
| 3 | Create Fitness Template | `/director/fitness/templates/new` | `Draft` (blue) | ✅ Active |
| 4 | Upload Players | `/director/players` | `Setup later` (muted) | ✅ Active |
| 5 | Add Coaches | `/director/coaches` | `Setup later` (muted) | ✅ Active |
| 6 | Preview Portals | `null` (deferred) | `Coming next` (muted) | ❌ Deferred |

#### Deferred card treatment
Portal Preview has no dedicated director-side route. Rather than linking to `/director` (the dashboard), the card is:
- `href: null`
- `opacity-60` wrapper
- `border-border/50 bg-surface/50` dimmed styling
- CTA label: `"Not available yet"` (no arrow)
- Status badge: `"Coming next"`

#### Icon assignments (lucide-react, no new packages)
| Card | Icon |
|---|---|
| Review Curriculum | `BookOpen` |
| Create Class Template | `LayoutTemplate` |
| Create Fitness Template | `Activity` |
| Upload Players | `Users` |
| Add Coaches | `UserPlus` |
| Preview Portals | `Eye` |

#### Status badge color system
| Status | Style |
|---|---|
| Next setup task | `bg-lime/8 border-lime/20 text-lime` |
| Draft | `bg-status-blue/8 border-status-blue/20 text-status-blue` |
| Setup later | `bg-surface-raised border-border text-text-muted` |
| Coming next | `bg-surface-raised border-border text-text-muted/50` |

---

### Section ordering change

**Before:**
1. Celebration header
2. DONNA bubble
3. DNA pill strip
4. `AcademyDnaSummaryCard` compact
5. DNA Foundation Check
6. Plain task grid
7. DNA status banner
8. Navigation

**After:**
1. Celebration header
2. DONNA bubble
3. DNA pill strip
4. **Continue Setup card grid** (moved up — most actionable content visible first)
5. `AcademyDnaSummaryCard` compact
6. DNA Foundation Check
7. DNA status banner
8. Navigation

---

### DONNA bubble text update

**Before:**
> "Academy DNA is locked in. Required items below confirm your foundation is complete. The tasks in the next section are ready for you in the Director Dashboard."

**After:**
> "Academy DNA is captured. Use the cards below to continue setup — curriculum, templates, and team configuration are ready when you are. Nothing is published until you decide to activate each piece."

---

### Celebration header subtitle update

**Before:**
> "Your foundation is set. Head to the Director Dashboard to continue setup."

**After:**
> "Your foundation is set. Review curriculum, build templates, and continue setup below."

---

## Safety copy

No copy implies:
- Published
- Sent
- Applied live
- Activated live
- Players imported
- Coaches invited
- Portal is live

Copy used:
- `"Continue Setup"` — section header
- `"Next setup task"` — curriculum card badge
- `"Draft"` — template card badges
- `"Setup later"` — player/coach card badges
- `"Coming next"` — portal preview badge
- `"Not available yet"` — portal preview CTA
- `"Nothing is published until you decide to activate each piece."` — DONNA bubble
- `"Your Academy DNA is saved to your draft. Settings are applied when you complete setup in the Director Dashboard."` — footer safety note (preserved from before)

---

## What was preserved

- Celebration header (`CheckCircle2` in lime circle, "Step 10 of 10 — DNA Ready", "Your Academy DNA is ready.")
- DNA pill strip (coachingStyles + sessionBlocks + developmentPriorities, max 6)
- `AcademyDnaSummaryCard` compact mode (unchanged component)
- DNA Foundation Check (5 checklist items with required/optional/ready state)
- DNA status banner (`canActivate` gating, required-items-remaining copy)
- Back button + "Go to Director Dashboard" primary CTA
- Footer safety note

---

## Routes audit

| Card | Route | Route exists? |
|---|---|---|
| Review Curriculum | `/director/curriculum` | ✅ `src/app/director/curriculum/page.tsx` |
| Create Class Template | `/director/class-templates/new` | ✅ `src/app/director/class-templates/new/page.tsx` |
| Create Fitness Template | `/director/fitness/templates/new` | ✅ `src/app/director/fitness/templates/new/page.tsx` |
| Upload Players | `/director/players` | ✅ `src/app/director/players/page.tsx` |
| Add Coaches | `/director/coaches` | ✅ `src/app/director/coaches/page.tsx` |
| Preview Portals | `null` | ❌ No dedicated portal preview route — deferred |

---

## Save behavior

No save action is wired in `ActivationChecklistStep`. The existing behavior (navigate to `/director` via "Go to Director Dashboard" button) was preserved unchanged. No new DB writes added. The sprint spec noted "No DB writes except existing safe Save Academy DNA behavior already wired in Final Activation" — since no save was wired, none was added.

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

The `NextStepCard` interface uses `Icon: typeof BookOpen` — this captures the lucide-react component type, which all lucide icons share the same signature as, so `LayoutTemplate`, `Activity`, `Users`, `UserPlus`, and `Eye` all satisfy the type without any casts.

---

## Files changed

**Modified:**
- `src/components/onboarding/steps/ActivationChecklistStep.tsx` — card grid upgraded; section reordered; DONNA bubble text updated
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_390_FINAL_ACTIVATION_NEXT_STEPS_GRID.md` — this document

---

## Parity improvement

| Area | Before | After |
|---|---|---|
| Card icons | Missing | Added (BookOpen, LayoutTemplate, Activity, Users, UserPlus, Eye) |
| Status badges | Missing | Added (Next setup task / Draft / Setup later / Coming next) |
| 3-column responsive grid | Missing (2-column only) | Added (lg:grid-cols-3) |
| Deferred Portal Preview | Linked to /director (wrong) | Deferred with "Not available yet" |
| Card descriptions | Generic | Specific (Fitness mentions plyometrics) |
| Hover CTA (lime arrow) | Missing | Added |
| Section order | Grid buried after checklist | Grid promoted above checklist |
| Final Activation parity score | 5/10 | ~8/10 |

---

## Recommended next sprint

**Sprint 391 — Session Design Proportional Timeline V1**

The 387D audit gave `SessionDesignStep` a **7/10** with one clear gap: "Prototype timeline uses proportional flex widths (block.duration as flex value) with time labels. AcademyOS uses equal-width bars (flex-1). Add proportional sizing and duration labels to bring timeline preview to prototype standard."

This is a pure visual/layout change — no DB writes, no new packages, no schema changes. The live timeline in `SessionDesignStep` already exists; it just needs to switch from `flex-1` (equal widths) to `flex-[duration]` (proportional widths) with duration labels below each segment.

Alternatively: **Sprint 391 — AcademyDna Landing Visual Polish V1** — the 387D audit gave the landing screen 6/10. The prototype has a subtle radial glow behind the headline and a slightly different copy pattern ("Meet DONNA" vs AcademyOS's current headline). This is a lower-effort visual improvement.
