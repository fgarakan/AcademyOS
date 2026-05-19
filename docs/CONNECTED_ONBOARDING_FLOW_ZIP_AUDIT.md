# Connected Onboarding Flow Zip Audit

**Date:** 2026-05-19
**Sprint:** OF-1
**Source:** `prototype-reference/academyos-donna-onboarding.zip`

---

## Zip prototype summary

The zip (`academyos-donna-onboarding.zip`) is a standalone Vite/React prototype using a separate design system called "AnglesOS Brand Kit v1.0" with teal/mint accents (`#00C9A7`). It implements 10 onboarding screens focused on the core academy DNA collection flow.

**Zip stack (do not copy):**
- Vite + Wouter routing
- Inline CSS styles with hardcoded hex colors
- `#0A0F0E`, `#00C9A7` teal design system
- CDN images (cloudfront.net)
- `sonner` toast library
- `OnboardingProvider` React context
- `ThemeContext`
- Emoji icons in block cards
- "AnglesOS Brand Kit" fonts (Syne, DM Sans, DM Mono)

---

## Why the zip flow is more user-friendly

| Reason | Detail |
|---|---|
| One topic per screen | Each screen covers exactly one decision domain. No cramming session blocks + priorities + template setup together. |
| DONNA live commentary | DONNA panel updates its message and the live DNA summary as the director makes choices. Director always knows what DONNA is learning. |
| Clear forward path | Progress rail shows exactly which topics are coming next. |
| Separate Coaching Philosophy + Coach Communication | Coaching style and communication voice are distinct decisions — the zip separates them, making each choice feel deliberate. |
| Player Development as its own screen | Priority ranking gets full screen attention rather than being a footnote at the bottom of a long session block step. |
| DNA Summary as a shareable card | The summary screen shows what DONNA has learned as a cohesive document, not a list. |
| DONNA Chat as a distinct adjustment step | The director can talk to DONNA directly before activation, not just click preset buttons. |
| Final Activation as a celebration | Shows "here is what your foundation built" + "what to set up next" as the next journey. |

---

## Zip prototype screen inventory

| Zip Screen | Description | Status for AcademyOS |
|---|---|---|
| `WelcomeScreen` | Full-screen hero with DONNA intro, 5-step preview, "Start with DONNA" CTA | Keep concept, preserve AcademyOS visual style, remove hero CDN image |
| `AcademyBasicsScreen` | Academy name, age groups, academy model | Keep as-is — current Step 2 already covers this |
| `CoachingPhilosophyScreen` | Coaching styles (up to 3) | Merged into AcademyOS "Coaching DNA" step — keep merged |
| `CoachCommunicationScreen` | Primary + secondary communication voice | Merged into AcademyOS "Coaching DNA" step — keep merged |
| `SessionDesignScreen` | Session building blocks + live timeline | Keep session blocks pattern; adapt as input for Curriculum Builder, not standalone |
| `PlayerDevelopmentScreen` | Up to 5 ranked development priorities with drag-to-reorder | Keep ranking concept; priorities belong in Curriculum Builder step |
| `ParentCommunicationScreen` | Parent communication styles | Fold into Portal Preview step |
| `DNASummaryScreen` | Full review card + edit links + "Ask DONNA" button | Keep review concept — current AcademyDnaReviewStep already does this well |
| `DonnaChatScreen` | Conversational adjustment interface with proposal cards | Keep concept — current DonnaAdjustmentDraftPanel covers this in review step |
| `FinalActivationScreen` | Celebration + next-steps cards (curriculum, templates, coaches, players, etc.) | These "next steps" map directly to the new OF-4 through OF-9 onboarding steps |

---

## Current 7-step AcademyOS flow vs. new 11-step target

| Step | Current (7-step) | New (11-step) |
|---|---|---|
| 1 | Welcome / Setup Mode | Welcome / Setup Mode (unchanged) |
| 2 | Academy Basics | Academy Basics (unchanged) |
| 3 | Coaching DNA | Coaching DNA (unchanged, keep merged) |
| 4 | Session + Curriculum Defaults | **Curriculum Builder** (new dedicated step) |
| 5 | Parent + Player Experience | **First Class Template** (new dedicated step) |
| 6 | Academy DNA Review | **First Fitness Template** (new dedicated step) |
| 7 | Activation Checklist | **Player Upload** (new step) |
| — | — | **Add Coaches** (new step) |
| — | — | **Portal Preview** (new step — includes parent/player experience) |
| — | — | Academy DNA Review (moved to step 10) |
| — | — | Activation Checklist (moved to step 11) |

**What happened to "Parent + Player Experience"?**
Parent communication styles and player mission style move into the **Portal Preview** step (step 9). The director configures how parents and players experience the system while previewing the portals.

---

## Session + Curriculum Defaults step changes

The current "Session + Curriculum Defaults" step has two sections:
1. Session Building Blocks (7 generic workflow types)
2. Development Priorities (10 priorities, ranked to 5)

In the new flow:
- Session building blocks remain in the **Curriculum Builder** step as the starting-point session structure
- Development priorities remain in the **Curriculum Builder** step
- The **First Class Template** step (step 5) introduces the REAL AcademyOS class block model
- The **First Fitness Template** step (step 6) introduces the REAL fitness block/exercise model

---

## Class template changes required (OF-4)

Current state: Session + Curriculum Defaults uses generic workflow categories (Technique Blocks, Live Ball Heavy, etc.)

Required: First Class Template step uses the REAL AcademyOS class block model:

| Block | Duration | Notes |
|---|---|---|
| Warm-Up | 10 min | Fixed, always first |
| Drills | 15 min | Selectable |
| Skills | 20 min | Selectable |
| Tactics | 15 min | Selectable |
| Games | 15 min | Selectable |
| Point Play | 10 min | Selectable |
| Match Play | 15 min | Selectable |
| Assessment Moment | 5 min | Selectable |
| Reflection / Wrap-Up | 5 min | Fixed, always last |

Each selected block shows: goal, coach cue, player watch-for, evidence opportunity, optional video placeholder.

---

## Fitness template changes required (OF-5)

New step. No current equivalent. Uses REAL AcademyOS fitness block model:

Movement Prep / Speed / Agility / Coordination / Strength Basics / Mobility / Recovery / Tennis Transfer / Conditioning / Balance / Footwork

Each selected block auto-populates local/demo exercises. Exercises include: name, sets/reps/time, coaching cue, progression, regression, tennis transfer, optional video placeholder.

Duplicate block handling: if the same block type is selected twice, use a different exercise set (pre-defined alternate set, not duplicated exercises).

---

## Player Upload step additions (OF-7)

New step. Options:
- Upload CSV (placeholder - no real DB write)
- Paste player names
- Fast-fill table (name, age, ball level, group, current focus)
- Skip for now

All input is local/demo only. No real DB write. Skipped creates Activation Checklist task.

---

## Add Coaches step additions (OF-8)

New step. Options:
- Add coach card locally (name, role, assigned levels, specialties)
- Import list placeholder
- Skip for now

All input is local/demo only. No real DB write. No email invitations. Skipped creates Activation Checklist task.

---

## Portal Preview step additions (OF-9)

New step. Shows four portal previews:
- Director view
- Coach view
- Player view (with mission style selector)
- Parent view (with parent communication style + privacy rule selectors)

This is where the current "Parent + Player Experience" data gets collected. Preview cards show what each portal will look like based on academy DNA.

No real portal access. No sends. No DB writes.

---

## What must remain skippable

| Step | Skip behavior |
|---|---|
| Curriculum Builder | Skip → Activation Checklist: "Select curriculum starting point" |
| First Class Template | Skip → Activation Checklist: "Finish first class template" |
| First Fitness Template | Skip → Activation Checklist: "Finish first fitness template" |
| Player Upload | Skip → Activation Checklist: "Add your first player" |
| Add Coaches | Skip → Activation Checklist: "Add your first coach" |
| Portal Preview | Skip → Activation Checklist: "Preview portals before activation" |

---

## What remains local/demo only

Everything in the onboarding flow is local draft only:
- All selections are stored in `OnboardingDraft` (localStorage via `useOnboardingDraftPersistence`)
- Class template draft: local blocks array, no DB write
- Fitness template draft: local blocks + exercises, no DB write
- Player upload: local name list, no DB import
- Coach draft: local coach cards, no DB write
- Portal preview: read-only preview, no real portal access

---

## What visual style must be preserved (do not copy from zip)

| Element | Source of truth |
|---|---|
| Background: `#0A0A0A` | `tailwind.config.ts` token `base` |
| Card surface: `#111111` | token `surface` |
| Elevated card: `#1A1A1A` | token `surface-raised` |
| Border: `#222222` | token `border` |
| Accent: `#C8FF00` lime | token `lime` |
| Text: `#FFFFFF` / `#AAAAAA` / `#555555` | tokens `text-primary`, `text-secondary`, `text-muted` |
| Button: `btn-lime`, `btn-ghost` | `src/components/ui/index.ts` |
| Card component | `<Card>` from `src/components/ui/index.ts` |
| Progress rail | `OnboardingProgressRail.tsx` — visual style preserved, step labels updated |
| DONNA panel | `OnboardingDonnaPanel.tsx` — visual style preserved, messages updated |
| Save/resume footer | `OnboardingSaveStatus.tsx` — preserved |
| Step header | `OnboardingStepHeader.tsx` — preserved |

---

## What code/CSS must not be copied from zip

- Any inline `style={{...}}` CSS objects from zip components
- `#00C9A7`, `#0A0F0E`, `#111A18`, `#E8F0EE`, `#A0B8B4`, `#5A7A76` colors
- CDN image URLs (`https://d2xsxph8kpxj0f.cloudfront.net/...`)
- Emoji block icons
- `wouter`, `sonner`, or any zip-only dependencies
- `OnboardingProvider` context pattern (use existing shell + useState)
- `ThemeProvider` / `ThemeContext`
- Any CSS animations from `index.css` (`slide-up`, `stagger-in`, `scale-in`, `ease-snappy`)
- `ManusDialog`, `Map`, or any Manus-specific tooling components

---

## OnboardingDraft new fields required

To support the 11-step flow, `OnboardingDraft` needs these new fields:

```typescript
// Step 4 — Curriculum Builder
curriculumStartingPoint: string  // 'academyos-starter' | 'blank' | 'customize-later'
curriculumFocusLevels: string[]  // e.g. ['red-ball', 'orange-ball']
sessionBlocks: string[]          // (already exists)
developmentPriorities: string[]  // (already exists)

// Step 5 — First Class Template
classTemplateDraft: {
  skipped: boolean
  selectedBlocks: string[]
}

// Step 6 — First Fitness Template
fitnessTemplateDraft: {
  skipped: boolean
  selectedBlocks: string[]
}

// Step 7 — Player Upload
playerUploadDraft: {
  skipped: boolean
  playerCount: number
}

// Step 8 — Add Coaches
coachesDraft: {
  skipped: boolean
  coaches: Array<{
    name: string
    role: string
    levels: string[]
  }>
}

// Step 9 — Portal Preview (absorbs Parent + Player Experience)
parentStyles: string[]              // (already exists)
parentVisibilityRules: Record<string, boolean>  // (already exists)
playerMissionStyle: string         // (already exists)
portalPreviewViewed: boolean
```

---

## Storage key migration

The `useOnboardingDraftPersistence` hook uses `academyos_onboarding_draft_v1` as the localStorage key. With the addition of new required fields, bump to `v2` to invalidate old drafts and prevent runtime errors from missing fields.

---

## Backend/RLS issue (logged separately)

**`/director/sessions` — Infinite recursion in RLS policy**

Error: `Failed to load sessions: infinite recursion detected in policy for relation sessions`

This is a backend/RLS issue only. Does not affect onboarding UI. Does not block TypeScript build. Address in a separate backend sprint reviewing `supabase/migrations/007_sessions.sql` and any subsequent sessions RLS policies for circular references.

---

## Sprint OF-1 through OF-12 file map

| Sprint | Creates | Modifies |
|---|---|---|
| OF-1 | `docs/CONNECTED_ONBOARDING_FLOW_ZIP_AUDIT.md` | `docs/CHANGELOG.md` |
| OF-2 | `docs/CONNECTED_ONBOARDING_STEP_MODEL_REFACTOR.md` | `OnboardingShell.tsx`, `OnboardingProgressRail.tsx`, `OnboardingDonnaPanel.tsx`, `OnboardingSaveStatus.tsx` |
| OF-3 | `steps/CurriculumBuilderStep.tsx`, `docs/CONNECTED_ONBOARDING_CURRICULUM_BUILDER_STEP.md` | `OnboardingShell.tsx` |
| OF-4 | `steps/FirstClassTemplateStep.tsx`, `templates/ClassTemplateBlockSelector.tsx`, `templates/ClassTemplateDraftPreview.tsx`, docs | `OnboardingShell.tsx` |
| OF-5 | `steps/FirstFitnessTemplateStep.tsx`, `templates/FitnessBlockSelector.tsx`, `templates/FitnessExerciseDraftPreview.tsx`, docs | `OnboardingShell.tsx` |
| OF-6 | `templates/TemplateVideoPlaceholderCard.tsx`, docs | `FirstClassTemplateStep.tsx`, `FirstFitnessTemplateStep.tsx` |
| OF-7 | `steps/PlayerUploadStep.tsx`, docs | `OnboardingShell.tsx` |
| OF-8 | `steps/AddCoachesStep.tsx`, docs | `OnboardingShell.tsx` |
| OF-9 | `steps/PortalPreviewStep.tsx`, docs | `OnboardingShell.tsx` |
| OF-10 | docs | `AcademyDnaReviewStep.tsx`, `AcademyDnaSummaryCard.tsx` |
| OF-11 | docs | `ActivationChecklistStep.tsx` |
| OF-12 | `docs/CONNECTED_ONBOARDING_FINAL_QA.md` | `docs/CHANGELOG.md` |
