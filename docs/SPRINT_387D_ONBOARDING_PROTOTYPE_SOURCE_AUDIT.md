# Sprint 387D — Onboarding Prototype Source Audit V1

**Date:** 2026-05-20
**Sprint:** 387D
**Status:** Complete — Audit Only, no app code changed

---

## 1. Executive Summary

| Metric | Score |
|---|---|
| Overall prototype parity | 6/10 |
| Landing screen parity | 6/10 |
| Internal DNA flow parity (steps 1–9) | 7/10 |
| DONNA panel parity | 7/10 |
| Progress mechanism parity | 3/10 |

**Biggest mismatch:** The progress mechanism. The prototype uses a minimal 3px teal gradient bar at the top of the content area (hidden on Welcome). AcademyOS uses a full horizontal 10-node step rail with labels and connectors as a permanent header. This single structural decision creates the largest visual gap with the prototype.

**Biggest unexpected finding:** The prototype zip contains exactly 10 screens — identical in count and flow to the current AcademyOS OnboardingShell. CurriculumBuilderScreen, ClassTemplateScreen, FitnessTemplateScreen, PlayerUploadScreen, AddCoachesScreen, PortalPreviewScreen, DNAReviewScreen, and ActivationChecklistScreen were listed in the sprint spec but do NOT exist in the prototype zip. These are AcademyOS-specific additions beyond the prototype scope.

**Highest-priority next sprint:** Sprint 387E — Shell Layout and Progress Bar Parity V1. Replace the horizontal 10-node step rail with the prototype's lightweight 3px gradient progress bar. This is the single highest-impact UI change and unblocks all subsequent parity work.

---

## 2. Prototype Screen Sequence

Source: `client/src/contexts/OnboardingContext.tsx`, `SCREENS` array.

```
1. welcome
2. academy-basics
3. coaching-philosophy
4. coach-communication
5. session-design
6. player-development
7. parent-communication
8. dna-summary
9. donna-chat
10. final-activation
```

The prototype's `PROGRESS_STEPS` in `DonnaPanel.tsx` (the right panel checklist) shows 7 labeled milestones:
```
Academy Basics → Coaching Philosophy → Coach Communication →
Session Design → Player Development → Parent Communication → Review Academy DNA
```

The prototype progress bar percentages from `OnboardingLayout.tsx`:
```
welcome: 0% | academy-basics: 14% | coaching-philosophy: 28% |
coach-communication: 42% | session-design: 56% | player-development: 70% |
parent-communication: 84% | dna-summary: 96% | donna-chat: 96% | final-activation: 100%
```

**Screens NOT in the prototype zip:**
CurriculumBuilderScreen, ClassTemplateScreen, FitnessTemplateScreen, PlayerUploadScreen, AddCoachesScreen, PortalPreviewScreen, DNAReviewScreen, ActivationChecklistScreen — none of these exist in `academyos-donna-onboarding.zip`. They are AcademyOS-specific post-DNA setup steps.

---

## 3. Current AcademyOS Screen Sequence

**Pre-flow landing:** `/director/onboarding` → `AcademyDnaLanding`
- Mode selection (Fast Start / Guided Setup / Full Setup; 3 deferred)
- "Begin Setup" enters OnboardingShell at step 1 (Sprint 387B)

**OnboardingShell (10 steps, 0–9):**
```
Step 0: Welcome      (WelcomeStep inline in OnboardingShell.tsx)
Step 1: Academy Basics      (AcademyBasicsStep)
Step 2: Coaching Philosophy (CoachingDnaStep)
Step 3: Coach Communication (CoachCommunicationStep)
Step 4: Session Design      (SessionDesignStep)
Step 5: Player Development  (PlayerDevelopmentStep)
Step 6: Parent Communication (ParentCommunicationStep)
Step 7: DNA Summary         (AcademyDnaReviewStep)
Step 8: DONNA Adjustment    (DonnaAdjustmentStep)
Step 9: Final Activation    (ActivationChecklistStep)
```

**Post-DNA separate routes:**
- `/director/class-templates/new` — Class template builder
- `/director/fitness/templates/new` — Fitness template builder
- `/director/setup` — Old checklist (moved in Sprint 387A)

The OnboardingShell also references step components in `steps/` that are not part of the 0–9 flow:
`CurriculumBuilderStep`, `FirstClassTemplateStep`, `SessionCurriculumDefaultsStep`, `ParentPlayerExperienceStep` — these are currently unused in the shell flow but exist in the filesystem.

---

## 4. Page-by-Page Parity Table

### Landing / Welcome

| Field | Value |
|---|---|
| Prototype screen | WelcomeScreen (step 0 in flow, rendered directly without OnboardingLayout) |
| AcademyOS component | `AcademyDnaLanding` + `WelcomeStep` (step 0, now skipped via Sprint 387B) |
| Route / path | `/director/onboarding` → `AcademyDnaLanding.tsx` |
| Match score | **6/10** |
| Keep from prototype | "AcademyOS — Director Onboarding" pill, headline intro pattern, 4 feature cards at bottom, DONNA panel on right, teal/lime ambient glow behind headline |
| Keep from AcademyOS | Mode selection cards (Fast Start / Guided Setup / Full Setup), DONNA panel with input/chips, deferred mode lock treatment, safety notice copy |
| Required changes | Change headline from "Let's build your academy operating system." to "Meet DONNA —" variant or equivalent AcademyOS copy. Add subtle radial glow behind headline. Consider hero background image at low opacity. |
| Safety notes | No DB writes on landing. All local state only. No migration. |
| Priority | Medium — landing is visible but not blocking DNA flow |

---

### Step 1: Academy Basics

| Field | Value |
|---|---|
| Prototype screen | AcademyBasicsScreen |
| AcademyOS component | `AcademyBasicsStep` |
| Route / path | `src/components/onboarding/steps/AcademyBasicsStep.tsx` |
| Match score | **8/10** |
| Keep from prototype | "Step 1 of 5" eyebrow pattern, "Tell me about your academy" headline, age group color dots, academy model grid, DONNA confirmation bubble (Sparkles + teal/lime pill), Back/Continue nav |
| Keep from AcademyOS | `OnboardingStepHeader` component pattern, age group `selectedColor` per-ball token (red/orange/green/yellow), lime accent treatment, conditional canContinue gating |
| Required changes | Minor: eyebrow says "Step 2 of 10" in AcademyOS vs "Step 1 of 5" in prototype. Step count display should reflect skipping Welcome. DONNA confirmation bubble present in prototype — verify it exists in current step. |
| Safety notes | None — no DB writes in step |
| Priority | Low — high parity already |

---

### Step 2: Coaching Philosophy

| Field | Value |
|---|---|
| Prototype screen | CoachingPhilosophyScreen |
| AcademyOS component | `CoachingDnaStep` |
| Route / path | `src/components/onboarding/steps/CoachingDnaStep.tsx` |
| Match score | **7/10** |
| Keep from prototype | 8 coaching styles, up to-3 selection, rank badge (1/2/3 in filled circle), 3 progress bars showing selection count, DONNA inline summary ("Your coaching style: X + Y"), emoji icons on cards |
| Keep from AcademyOS | Lime token styling, `OnboardingStepHeader`, disabled state for 4th+ at 3-max |
| Required changes | Confirm rank badge present. Confirm 3-bar selection counter present. These are likely already implemented. |
| Safety notes | None |
| Priority | Low |

---

### Step 3: Coach Communication

| Field | Value |
|---|---|
| Prototype screen | CoachCommunicationScreen |
| AcademyOS component | `CoachCommunicationStep` |
| Route / path | `src/components/onboarding/steps/CoachCommunicationStep.tsx` |
| Match score | **7/10** |
| Keep from prototype | Dual primary/secondary selection, in-card "Primary" / "Secondary" action buttons, top accent bar (teal gradient for primary, purple for secondary), PRIMARY/SECONDARY badge labels, status indicator chips showing current selection |
| Keep from AcademyOS | Lime + purple-400 dual-tone, AcademyOS token classes |
| Required changes | Verify in-card action buttons are present. In prototype, each card has its own "Primary" and "Secondary" buttons inside — this is the defining UX of this screen. If missing in AcademyOS, this is a sprint gap. |
| Safety notes | None |
| Priority | Medium — if in-card buttons are missing, notable UX gap |

---

### Step 4: Session Design

| Field | Value |
|---|---|
| Prototype screen | SessionDesignScreen |
| AcademyOS component | `SessionDesignStep` |
| Route / path | `src/components/onboarding/steps/SessionDesignStep.tsx` |
| Match score | **7/10** |
| Keep from prototype | 7 session blocks, proportional timeline bar (flex widths based on duration values), duration labels below each bar segment, DONNA summary ("I'll generate your session templates with: X → Y") |
| Keep from AcademyOS | Live timeline preview already implemented (color bars + legend pills), barColor tokens, "Default session shape" label |
| Required changes | Prototype timeline uses proportional flex widths (block.duration as flex value) with time labels. AcademyOS uses equal-width bars (flex-1). Add proportional sizing and duration labels to bring timeline preview to prototype standard. |
| Safety notes | None — purely visual change |
| Priority | Medium |

---

### Step 5: Player Development

| Field | Value |
|---|---|
| Prototype screen | PlayerDevelopmentScreen |
| AcademyOS component | `PlayerDevelopmentStep` |
| Route / path | `src/components/onboarding/steps/PlayerDevelopmentStep.tsx` |
| Match score | **7/10** |
| Keep from prototype | 10 priority pills, select up to 5, rank number in filled circle, drag-to-rank right panel with GripVertical, remove (X) button per item, DONNA summary at 3+ selected |
| Keep from AcademyOS | Lime tokens, AcademyOS step structure |
| Required changes | Confirm drag-to-rank panel exists in AcademyOS implementation. |
| Safety notes | None |
| Priority | Low |

---

### Step 6: Parent Communication

| Field | Value |
|---|---|
| Prototype screen | ParentCommunicationScreen |
| AcademyOS component | `ParentCommunicationStep` |
| Route / path | `src/components/onboarding/steps/ParentCommunicationStep.tsx` |
| Match score | **7/10** |
| Keep from prototype | Select-all pattern (no max limit), top accent bar on selected cards, checkmark badge on selected cards, DONNA summary with count |
| Keep from AcademyOS | Lime tokens, AcademyOS option labels (may differ from prototype) |
| Required changes | Prototype has 7 parent styles; verify AcademyOS matches or is equivalent. Prototype CTA says "Review Academy DNA" on Continue button — AcademyOS likely says "Continue". |
| Safety notes | None |
| Priority | Low |

---

### Step 7: DNA Summary

| Field | Value |
|---|---|
| Prototype screen | DNASummaryScreen |
| AcademyOS component | `AcademyDnaReviewStep` |
| Route / path | `src/components/onboarding/steps/AcademyDnaReviewStep.tsx` |
| Match score | **6/10** |
| Keep from prototype | Left/right split layout: 300px DNA Card (left) + detail sections (right), DNA card has: academy initial monogram badge, narrative paragraph, 2×2 stat grid (Coaching Styles / Session Blocks / Dev Priorities / Parent Styles counts), academy model badge pill. Detail sections: SectionRow components with teal-tinted pills. Three action buttons: "Approve Academy DNA" (primary) / "Edit Selections" (ghost) / "Adjust with DONNA" (teal-outline) |
| Keep from AcademyOS | `AcademyDnaSummaryCard` component (verify it exists), edit links back to steps |
| Required changes | Verify AcademyDnaReviewStep has the DNA Card with: narrative summary, 2×2 stat grid, monogram badge. If AcademyDnaSummaryCard does not have the bg-gradient overlay + narrative paragraph, add those. Three-button CTA pattern (Approve / Edit / Adjust) should be present. |
| Safety notes | None — display only |
| Priority | High — this is the most visible "wow" screen; DNA card visual quality matters |

---

### Step 8: DONNA Adjustment (Chat)

| Field | Value |
|---|---|
| Prototype screen | DonnaChatScreen |
| AcademyOS component | `DonnaAdjustmentStep` |
| Route / path | `src/components/onboarding/steps/DonnaAdjustmentStep.tsx` |
| Match score | **5/10** |
| Keep from prototype | Chat message thread UI, DONNA avatar on messages, typing indicator (3-dot bounce), example prompt chips, textarea + Send button, proposal cards (title + "Proposed Changes" list + "Affected Areas" chips + Approve/Edit/Cancel buttons) |
| Keep from AcademyOS | `DonnaAdjustmentDraftPanel` component, local-only draft mutation, safety notice ("nothing is saved until you activate"), Back/Continue nav |
| Required changes | The prototype's simulated chat + proposal card pattern (title, changes list, affected areas, approve/edit/cancel) is the distinctive feature of this screen. AcademyOS uses `DonnaAdjustmentDraftPanel` — verify whether it includes simulated proposal cards. If not, this is the largest content gap. Note: real AI chat is deferred (see Section 9). Simulated proposals are acceptable. |
| Safety notes | Must remain local-draft-only. No DB writes. No real AI calls. |
| Priority | Medium-high — this screen defines the "DONNA proposes, director approves" model visually |

---

### Step 9: Final Activation

| Field | Value |
|---|---|
| Prototype screen | FinalActivationScreen |
| AcademyOS component | `ActivationChecklistStep` |
| Route / path | `src/components/onboarding/steps/ActivationChecklistStep.tsx` |
| Match score | **5/10** |
| Keep from prototype | Success header (52px circle with CheckCircle2, teal glow), headline "Your academy foundation is ready." with accent span, DONNA message bubble, DNA Active pills summary row, 6 "next steps" card grid (icon, label, desc, "Set up →" CTA), "Continue Setup" primary + "Go to Director Dashboard" ghost buttons |
| Keep from AcademyOS | Required/optional readyCheck checklist items (these are more functional than prototype), privacy rules verification, actual activation logic (writing DNA to DB via server action), AcademyDnaSummaryCard display |
| Required changes | Add the success celebration header (circle + CheckCircle2) above the checklist. Add the 6 "Continue Setup" task cards grid (linking to actual routes like /director/class-templates/new, /director/fitness/templates/new, etc.). Keep the AcademyOS checklist — it's more functional than the prototype version. |
| Safety notes | DB write must be gated on checklist completion. Existing `saveAcademyDnaAction` must be used. |
| Priority | High — this is the money screen; both functional and visual quality matter |

---

### Screens listed in sprint spec but absent from prototype zip

| Sprint spec screen | Status |
|---|---|
| CurriculumBuilderScreen | Not in prototype zip. AcademyOS has `CurriculumBuilderStep.tsx` (unused in shell). |
| ClassTemplateScreen | Not in prototype zip. AcademyOS has `/director/class-templates/new` (Sprint 384). |
| FitnessTemplateScreen | Not in prototype zip. AcademyOS has `/director/fitness/templates/new` (Sprint 385). |
| PlayerUploadScreen | Not in prototype zip. Player Upload is a separate route (pending sprint). |
| AddCoachesScreen | Not in prototype zip. Coach invite is a future route. |
| PortalPreviewScreen | Not in prototype zip. Portal Preview is a future route. |
| DNAReviewScreen | Not in prototype zip. Covered by AcademyDnaReviewStep (Step 7). |
| ActivationChecklistScreen | Not in prototype zip. Covered by ActivationChecklistStep (Step 9). |

**Decision:** These screens are AcademyOS-specific. The prototype defined the 10-screen DNA flow only. AcademyOS correctly puts class/fitness template builders on separate routes rather than inside the onboarding shell.

---

## 5. Layout / Shell Audit

### Prototype `OnboardingLayout`

- Container: `display: flex, height: 100vh, width: 100vw, overflow: hidden, background: #0A0F0E`
- Top progress bar: `height: 3px`, background track `rgba(0,201,167,0.08)`, fill bar `linear-gradient(90deg, #00C9A7, #00E5C4)` with 400ms cubic-bezier transition. Hidden on Welcome screen.
- Main content: `flex-1, flexDirection: column, padding: 24px` (0px padding on Welcome)
- `main` element: keyed by `currentScreen` for slide-up animation on screen change
- DONNA panel: 320px fixed, right side

### Prototype `DonnaPanel`

- Width: 320px, background: `#0D1614`, border-left: `1px solid rgba(0,201,167,0.08)`
- Avatar: external photo image (`DONNA_AVATAR_URL` on CDN), 36px circle with teal gradient bg + box-shadow
- Progress: 7 individual step labels with CheckCircle2/filled-ring/Circle per step
- Live DNA summary: shows as data fills in, teal-tinted pills
- Bottom pulse: "Building academy defaults" with 6px teal animated dot
- Welcome principle quote at bottom on Welcome screen
- Final completion card on final-activation screen
- Sections visible on non-welcome, non-final, non-chat screens

### Prototype `ProgressRail` (none — uses inline bar in layout)

The prototype has no top step rail. The 3px gradient bar IS the progress indicator.

---

### Current `OnboardingShell`

- Container: `flex flex-col min-h-screen bg-base` — vertical flex, full-height
- Top: `OnboardingProgressRail` — full horizontal rail with 10 nodes, step numbers, labels, lime connectors. Always visible.
- Content area: `max-w-2xl mx-auto px-6 py-8` — centered, 672px max
- DONNA panel: `OnboardingDonnaPanel`, `w-80` (320px), `bg-surface`, `border-l border-border`
- Mobile: `OnboardingProgressRail` is scrollable horizontally; DONNA panel is collapsed behind toggle button

### Current `OnboardingDonnaPanel`

- Width: w-80 (320px) — matches prototype
- Background: bg-surface (#111111) vs prototype #0D1614 — less dark, no green tint
- Avatar: "D" initial letter, lime/10 bg, lime/30 border, animated ping dot — no photo
- Progress: 5 grouped milestones (Academy Basics / Coaching DNA / Session + Players / DNA Review / Activate) — vs prototype's 7 individual step labels
- DONNA message: per-step from `DONNA_MESSAGES` dict — more informative than prototype
- Live DNA preview: smaller text, shows data values as they fill in
- "Why This Matters" + "Next Best Action" sections — AcademyOS-specific addition, good UX
- "Building academy defaults..." pulse — matches prototype
- Bottom principle quote — matches prototype

### Current `OnboardingProgressRail`

- 10 circular nodes with step numbers/check marks + labels + connectors
- `bg-lime/20 border-lime/40` for complete, `bg-lime/10 border-2 border-lime` for active
- Always visible at top of shell on every step
- Labels hidden on non-lg breakpoints

---

### What already matches

- Overall split layout (content left + DONNA panel right) ✓
- DONNA panel width (320px) ✓
- DONNA header (name, sparkle icon, status tagline) ✓
- Milestone progress list in DONNA panel (structure matches, detail differs) ✓
- Live DNA building section in DONNA panel ✓
- Bottom principle quote ✓
- Building pulse indicator ✓
- Mobile collapse behavior (DONNA panel collapses on mobile) ✓

### What feels off

- **Progress mechanism**: 10-node step rail vs 3px gradient bar — largest visual gap
- **DONNA panel background**: surface (#111111) feels slightly lighter/greyer than prototype #0D1614 (dark green tint) — not wrong, just different
- **Avatar**: "D" initial vs photo avatar — acceptable without CDN photo, but could be a gradient circle with "D" (teal/lime gradient rather than flat lime/10)
- **Step count display**: "Step 2 of 10" vs prototype "Step 1 of 5" — prototype counted only DNA steps; AcademyOS counts all 10 steps

### What should be rebuilt first

1. Replace `OnboardingProgressRail` (full 10-node header) with a 3px gradient progress bar at the top of the content area — this is Sprint 387E
2. Adjust `OnboardingDonnaPanel` milestone list from 5 grouped milestones to 7 individual step labels (matching prototype's 7-step PROGRESS_STEPS)
3. DNA Summary card: add narrative paragraph and 2×2 stat grid to match prototype DNA card visual quality

### What should NOT be copied

- Prototype CDN image URLs — not available in AcademyOS
- Prototype raw inline styles — use AcademyOS Tailwind design tokens
- Prototype teal `#00C9A7` — map to lime `#C8FF00` / `text-lime` / `bg-lime/X`
- Prototype `#0A0F0E` background — use AcademyOS `bg-base` (#0A0A0A)
- Prototype `#0D1614` sidebar — use AcademyOS `bg-surface` (#111111)
- Prototype `#111A18` card surfaces — use AcademyOS `bg-surface-raised` (#1A1A1A)
- Prototype simulated toast messages ("Feature coming soon in the full AnglesOS platform.") — AcademyOS has real routes for these
- Prototype `wouter` routing — AcademyOS uses Next.js App Router

---

## 6. Class Template Exception Plan

**Do not copy `ClassTemplateScreen` from prototype** — this screen does not exist in the zip and was never prototyped.

**Keep AcademyOS block model** (Sprint 384, `/director/class-templates/new`):
```
Warm-Up
Technical Skills
Drills
Tactical Patterns
Games
Point Play
Match Play
Assessment Moment
Reflection / Wrap-Up
```

**Future connection:** These blocks will pull drills, skills, tactics, games, and point-play exercises from the curriculum spine as it is built out. The block model is the correct abstraction.

**Current route/source:**
- Page: `src/app/director/class-templates/new/page.tsx`
- Form: `src/app/director/class-templates/new/NewClassTemplateForm.tsx`
- Action: `src/app/director/class-templates/createClassTemplateWithBlocksAction.ts`

**Visual alignment assessment:** The current builder (DONNA guidance card + block catalog + coach preview + draft safety notice + save button) follows the same structural pattern as the prototype's style screens. No major UX realignment needed. Only token/accent consistency should be verified.

---

## 7. Fitness Template Exception Plan

**Do not copy `FitnessTemplateScreen` from prototype** — this screen does not exist in the zip and was never prototyped.

**Keep AcademyOS block model** (Sprint 385 + Sprint 387C, `/director/fitness/templates/new`):
```
Movement Prep
Speed
Agility
Plyometrics       ← added Sprint 387C
Coordination
Strength Basics
Mobility
Recovery
Tennis Transfer
Conditioning
Balance
Footwork
```

**Plyometrics specifics:**
- `dbType: 'fitness'` — valid DB enum, no migration required
- Colors: `bg-status-orange/8 border-status-orange/25` / `bg-status-orange/15 text-status-orange border-status-orange/30`
- In `STANDARD_STRUCTURES` for: `standard`, `high_intensity`, `assessment`
- `inferFitnessBlockType` keywords: `plyometric`, `jump`, `bound`, `hop`, `box jump`, `depth jump`, `medicine ball`, `explosive`, `lateral bound`, `single leg jump`

**Future connection:** Blocks will pull exercises from the fitness/exercise library as that system expands. Current fallback copy when no library exercises match: "Plyometrics block selected. Exercises will connect from the fitness library as that system is expanded."

**Current route/source:**
- Page: `src/app/director/fitness/templates/new/page.tsx`
- Form: `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx`
- Action: `src/app/director/fitness/createFitnessTemplateWithBlocksAction.ts`

**Visual alignment assessment:** Current builder (DONNA card, template type chips, 12-block catalog, duration tracker, coach preview, draft notice) matches AcademyOS style and requires no UX realignment. Only verify lime token consistency.

---

## 8. What Should Be Implemented Next

**Sprint 387E — Onboarding Shell Layout Parity V1**

Replace the horizontal 10-node `OnboardingProgressRail` header with the prototype's 3px gradient progress bar approach:
- Remove `OnboardingProgressRail` from OnboardingShell layout
- Add a 3px top progress bar to `OnboardingShell`, hidden on step 0 (Welcome)
- Progress percentages should map: step 1→14%, step 2→28%, step 3→42%, step 4→56%, step 5→70%, step 6→84%, step 7→96%, step 8→96%, step 9→100%
- Bar uses lime gradient: `linear-gradient(90deg, #C8FF00, #E5FF4D)` with 400ms cubic-bezier transition
- No migration. No schema changes. Only `OnboardingShell.tsx` and `OnboardingProgressRail.tsx` change.

This is the single highest-impact sprint and resolves the biggest structural mismatch.

After Sprint 387E, recommended sequence:
- **Sprint 387F** — DONNA Panel Milestone List Parity (7 individual steps vs 5 grouped, matching prototype right-panel)
- **Sprint 388** — DNA Summary Card Visual Parity (add narrative paragraph + 2×2 stat grid to `AcademyDnaSummaryCard`)
- **Sprint 389** — DonnaChat Proposal Cards (add simulated proposal card with changes list + affected areas + Approve/Edit/Cancel to `DonnaAdjustmentStep`)
- **Sprint 390** — Final Activation Next Steps Cards (add 6-card success grid to `ActivationChecklistStep`)

---

## 9. What Should Be Deferred

The following must NOT be implemented in parity sprints:

| Feature | Why deferred |
|---|---|
| Real AI chat (DONNA responding to free-text) | Requires AI API integration, proposed_actions pipeline, and director approval flow |
| Real voice input | Voice pipeline not yet wired in onboarding context |
| Automatic parent sends | Parent comms trigger must be director-approved only |
| Automatic coach invites | Coach invites require auth tokens and email integration |
| Automatic curriculum mutation | Curriculum changes require migration + director approval |
| Automatic template publishing | Templates must stay as drafts until director reviews |
| Automatic player import | Player import is a separate sprint with its own parser and validation |
| Multi-location setup | Multi-location is locked (deferred mode in landing) |
| Consultant scheduling | Consultant mode is locked (deferred mode in landing) |
| True import existing academy | Import mode is locked (deferred mode in landing) |

The `DonnaAdjustmentStep` may use simulated proposals (matching the prototype's hardcoded DONNA_RESPONSES) as long as they clearly state "Draft only — not applied until activation." This is acceptable because it teaches the "propose / approve" model visually without requiring real AI.

---

## 10. Final Recommendation

**Is the current onboarding close enough to demo?**
Yes — with caveats. The DNA flow (Academy Basics through Final Activation) is structurally correct and content-complete. The landing screen and progress mechanism create visual noise that an informed stakeholder would notice. For an internal demo, acceptable. For an investor or partner demo, Sprint 387E (progress bar) should land first.

**How many parity sprints remain before the flow matches the zip?**
Approximately 5 sprints:
1. Sprint 387E — Shell Layout + Progress Bar (highest priority)
2. Sprint 387F — DONNA Panel Milestone List (7 individual steps)
3. Sprint 388 — DNA Summary Card visual treatment
4. Sprint 389 — DonnaChat proposal card UI
5. Sprint 390 — Final Activation next-steps card grid

The landing screen (AcademyDnaLanding) parity is lower priority and can be Sprint 391 or later — it is already functionally correct.

**What is the next exact sprint?**

**Sprint 387E — Onboarding Shell Layout Parity V1**
Files to change:
- `src/components/onboarding/OnboardingShell.tsx` — remove `OnboardingProgressRail`, add 3px gradient progress bar (hidden on step 0)
- `src/components/onboarding/OnboardingProgressRail.tsx` — either repurpose or deprecate

---

## Appendix: Color Token Mapping (prototype → AcademyOS)

| Prototype | AcademyOS token | Value |
|---|---|---|
| `#00C9A7` (teal accent) | `text-lime` / `bg-lime` | `#C8FF00` |
| `rgba(0,201,167,0.08)` (teal bg) | `bg-lime/8` | — |
| `rgba(0,201,167,0.20)` (teal border) | `border-lime/20` | — |
| `#0A0F0E` (bg) | `bg-base` | `#0A0A0A` |
| `#111A18` (surface) | `bg-surface-raised` | `#1A1A1A` |
| `#0D1614` (sidebar) | `bg-surface` | `#111111` |
| `#E8F0EE` (text primary) | `text-text-primary` | `#FFFFFF` |
| `#A0B8B4` (text secondary) | `text-text-secondary` | `#AAAAAA` |
| `#5A7A76` (text muted) | `text-text-muted` | `#555555` |
| `rgba(0,201,167,0.10)` (border) | `border-border` | — |
| `#A07DE0` (purple secondary) | `text-purple-400` | — |

**Note:** AcademyOS uses lime (`#C8FF00`) as its primary accent. Teal (`#00C9A7`) is the prototype's accent and belongs to a different visual identity. The lime accent is correct and intentional for AcademyOS. Do not copy the prototype's teal.
