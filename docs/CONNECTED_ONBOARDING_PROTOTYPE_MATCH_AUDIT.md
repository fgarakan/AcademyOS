# Connected Onboarding Prototype Match Audit

**Date:** 2026-05-19
**Sprint:** OF-AUDIT
**Prototype source:** `prototype-reference/academyos-donna-onboarding.zip`
**Sprints audited:** OF-1 through OF-4 (complete), OF-5 through OF-9 (not yet built)

---

## 1. Executive Summary

### Does the current onboarding match the prototype?

**No. The flow has drifted significantly in scope and interaction model.**

The prototype onboarding is a focused 5-decision DNA collection flow — light, fast, one topic per screen. AcademyOS has evolved into an 11-step full setup wizard that also builds templates, uploads players, and adds coaches during onboarding. These are fundamentally different scopes.

The individual step implementations are well-built technically, but the overall architecture has expanded well beyond what the prototype intended. Steps 3 (Curriculum Builder) and 4 (First Class Template) do not exist in the prototype at all — they are post-onboarding setup actions in the prototype's Final Activation screen.

### Where does it match?

- Academy Basics (Step 1): Close match. Same fields, same interaction pattern.
- Coaching DNA (Step 2): Partial match. Same content, but the prototype splits it into two screens.
- DONNA panel: Similar concept. AcademyOS version is actually more informative.
- Progress rail: Exists in both. Different visual approach.
- DNA Review (Step 9): Similar concept. AcademyOS review step exists but needs comparison.
- Draft-only safety model: AcademyOS is stronger here than the prototype.

### Where does it drift?

| Area | Severity |
|---|---|
| Welcome screen — mode selection adds upfront friction | HIGH |
| Coaching DNA — two prototype screens merged into one long step | MEDIUM |
| Curriculum Builder (Step 3) — entirely invented, not in prototype | HIGH |
| First Class Template (Step 4) — within onboarding in AcademyOS, post-onboarding in prototype | VERY HIGH |
| Player Development — no drag-to-reorder in AcademyOS | MEDIUM |
| Parent Communication — deferred to Portal Preview placeholder | MEDIUM |
| DONNA Chat — full screen in prototype, panel-only in AcademyOS | MEDIUM |
| Final Activation — celebration card in prototype vs task checklist in AcademyOS | HIGH |
| DONNA panel — no avatar, no animated pulse indicator | LOW |
| Overall flow scope — 10 focused screens vs 11-step full wizard | VERY HIGH |

### What is the severity?

**Severe enough to pause OF-5 through OF-9.**

If we continue building OF-5 (Fitness Template), OF-6 (Player Upload), OF-7 (Add Coaches), OF-8 (Portal Preview), and OF-9 (DONNA panel repair) on top of the current structure, we will be six more sprints into a flow that does not match the prototype that the user has identified as more user-friendly. The repair cost increases with every step built on the wrong foundation.

### Should OF-5 continue or should we repair flow first?

**Repair the flow first.** OF-5 should not start until the flow scope and Welcome/Coaching DNA/Curriculum Builder mismatch are resolved.

---

## 2. Screen-by-Screen Comparison Table

| Prototype Screen | Prototype Purpose | AcademyOS Equivalent | Match Score | What Matches | What Does Not Match | Required Fix | Action |
|---|---|---|---|---|---|---|---|
| Welcome | DONNA intro, 5-step pills, "Start with DONNA" CTA | Step 0: Welcome + Setup Mode | 4/10 | "Start with DONNA" CTA, "Use recommended defaults" link, DONNA intro text | No hero background/glow, no 5-step pill row, no feature cards at bottom, setup mode selection not in prototype, forces a required choice before DONNA intro lands | Remove or defer setup mode selection, add step pill preview, restore compelling hero intro | Adjust |
| Academy Basics | Academy name, age groups (6 colored), academy model (6 cards) | Step 1: AcademyBasicsStep | 8/10 | Same fields, same interaction pattern, DONNA confirmation bubble, age group color dots, model cards | AcademyOS adds "Primary Goals" section not in prototype, age group colors use Tailwind utility classes vs inline colored dots | Remove Primary Goals or move to after activation, otherwise match is strong | Keep |
| Coaching Philosophy | Coaching styles up to 3, rank badges, animated selection indicators | Step 2 (first half): CoachingDnaStep coaching styles | 7/10 | Same 8 styles, same 3-selection cap with rank badges, same progress dots, DONNA summary bubble | Merged with Communication Voice — prototype is one focused screen, AcademyOS is two topics in one step; AcademyOS adds "impact" text per card | Split into two steps to match prototype one-topic-per-screen model | Adjust |
| Coach Communication | Primary + secondary voice, per-card Primary/Secondary buttons | Step 2 (second half): CoachingDnaStep comm voice | 7/10 | Same 6 styles, Primary/Secondary buttons per card, selection indicators, DONNA summary | Same screen as Coaching Philosophy in AcademyOS — creates a long step with two unrelated decisions | Split into own step | Adjust |
| Session Design | 7 building blocks + live timeline preview with colored block rail | Step 3 (subset): CurriculumBuilderStep session blocks | 5/10 | Same 7 session blocks, same live timeline preview with flex-proportional blocks, DONNA summary | In AcademyOS this is buried inside a heavy Curriculum Builder step with 4 sections; prototype gives session design its own full screen with visual focus | Extract session blocks + timeline into their own step OR simplify Curriculum Builder dramatically | Adjust |
| Player Development | Top 5 priorities, select + drag-to-reorder ranked stack | Step 3 (subset): CurriculumBuilderStep dev priorities | 4/10 | Same 10 priorities, same 5-cap, rank numbers shown | Merged into Curriculum Builder with 3 other sections; no drag-to-reorder in AcademyOS (has remove-X only); loses the visual split panel (select on left, rank on right) | Extract into own step with drag-to-reorder as prototype shows | Adjust |
| Parent Communication | 7 parent styles, multi-select, DONNA summary | Planned: Portal Preview (Step 8, placeholder) | 0/10 | Concept planned | Not built; placeholder only | Build as standalone screen within Portal Preview flow | Build |
| DNA Summary | Shareable card + narrative + 2x2 stat grid + section rows + Approve/Edit/Adjust CTAs | Step 9: AcademyDnaReviewStep | 6/10 | Same review concept, section rows, edit links | Not yet fully audited visually; AcademyOS review may lack the shareable DNA card visual design and narrative generation | Add DNA card with narrative + stat grid; ensure Approve CTA is prominent | Adjust |
| DONNA Chat | Full conversational screen, proposal cards with Approve/Edit/Cancel, example prompts, typing indicator | DonnaAdjustmentDraftPanel in Step 9 | 4/10 | Conversational adjustment concept exists | Not a full screen — it is a sidebar panel within DNA Review; lacks typing indicator, lacks example prompts | Expand to full screen or make it far more prominent within review step | Adjust |
| Final Activation | Celebration screen, "Your academy foundation is ready", DNA pills, next-steps grid | Step 10: ActivationChecklistStep | 3/10 | Next-steps concept (get to curriculum, templates, coaches) | AcademyOS is a task checklist with required/optional items and readyCheck flags; prototype is a celebration card that opens the next journey; very different emotional tone | Add celebration header, change framing from "checklist to complete" to "foundation ready, here's what's next" | Adjust |
| DONNA Panel | 320px sidebar, avatar image, live DNA building with animated pulse, step progress | OnboardingDonnaPanel (all steps) | 6/10 | Same 320px right sidebar, step progress list, live DNA building section, DONNA message bubble, "Draft only" principle footer | No avatar image (only Sparkles icon), no animated pulse dot, AcademyOS adds "Why This Matters" + "Next Best Action" (not in prototype but these are good additions) | Add avatar or better visual for DONNA identity; add animated building indicator | Adjust |
| Progress Rail | Thin 3px top bar, percentage-based smooth animation | OnboardingProgressRail (horizontal step nodes across top) | 4/10 | Progress exists; steps are visible | Prototype uses a smooth percentage bar; AcademyOS uses numbered nodes with connectors; AcademyOS shows all 11 steps which is overwhelming vs prototype's 5-step pill row on Welcome + simple bar | Keep AcademyOS node rail for now — it shows more info; but Welcome should show the 5-step pill preview like prototype | Keep (minor adjust) |

---

## 3. Flow Comparison

### Prototype intended flow (10 screens)

```
Welcome
  -> Academy Basics
  -> Coaching Philosophy
  -> Coach Communication
  -> Session Design
  -> Player Development
  -> Parent Communication
  -> DNA Summary
  -> DONNA Chat (optional adjustment)
  -> Final Activation (next steps: curriculum, templates, coaches, players)
```

**Total decisions:** 5 focused DNA questions + 1 review + 1 optional adjustment + 1 celebration.
**Estimated time:** 4 minutes.
**Mental model:** "Tell DONNA who you are. Review what DONNA learned. Approve."

### Current AcademyOS flow (11 steps, Steps 0-10)

```
Welcome + Setup Mode Selection (required choice before proceeding)
  -> Academy Basics + Primary Goals (extra section)
  -> Coaching DNA: Coaching Styles + Communication Voice (two topics, one step)
  -> Curriculum Builder: Curriculum Starter + Focus Levels + Session Blocks + Dev Priorities (FOUR topics, one step)
  -> First Class Template: AcademyOS block model with DONNA suggestion (NOT in prototype DNA flow)
  -> First Fitness Template (placeholder — NOT in prototype DNA flow)
  -> Player Upload (placeholder — NOT in prototype DNA flow)
  -> Add Coaches (placeholder — NOT in prototype DNA flow)
  -> Portal Preview (placeholder — NOT in prototype DNA flow)
  -> Academy DNA Review
  -> Activation Checklist
```

**Total decisions:** 11+ decision areas, template building, player upload, coach setup.
**Estimated time:** 30-45 minutes (per the setup mode labels).
**Mental model:** "Complete a full academy setup wizard before you can use the product."

### Critical flow mismatches

**Missing steps (in prototype, not in AcademyOS as separate steps):**
- Coaching Philosophy standalone screen (merged into Coaching DNA)
- Coach Communication standalone screen (merged into Coaching DNA)
- Session Design standalone screen (merged into Curriculum Builder)
- Player Development standalone screen (merged into Curriculum Builder)
- Parent Communication standalone screen (deferred to Portal Preview)
- DONNA Chat as a full screen (reduced to panel in DNA Review)

**Placeholder steps (defined but not built):**
- First Fitness Template (Step 5)
- Player Upload (Step 6)
- Add Coaches (Step 7)
- Portal Preview (Step 8)

**Wrong order:**
- None — the overall sequence is logical.

**Wrong labels:**
- "Curriculum Builder" (Step 3) suggests DONNA builds the curriculum; prototype never calls it that.
- "Activation Checklist" (Step 10) suggests a task list; prototype calls it "Final Activation" (celebration).

**Wrong interactions:**
- Setup mode selection at Welcome: prototype never asks this — the director just starts.
- Curriculum Builder has 4 sections where prototype Session Design has 1 focused screen.
- Dev priorities have no drag-to-reorder in AcademyOS (prototype has a full drag rank panel).
- DONNA Chat is a sidebar panel in AcademyOS; prototype gives it a full dedicated screen.

**Wrong DONNA guidance:**
- AcademyOS DONNA panel has correct messages but the "Setup Progress" shows all 11 steps at once, which is overwhelming vs prototype's cleaner 7-step progress list.

**Progress rail behavior:**
- Prototype hides the progress bar on Welcome and shows a thin animated bar.
- AcademyOS shows a full node rail always visible including on Welcome (though it starts at 0).

**Current draft model gaps:**
- AcademyOS localStorage/draft model is stronger than prototype (proper save/resume, draft-only safety copy).
- Prototype has no persistence at all (in-memory React state only).
- This is an AcademyOS advantage — keep it.

---

## 4. UI/UX Comparison

### Ease of use

| Dimension | Prototype | AcademyOS | Assessment |
|---|---|---|---|
| First screen cognitive load | Low — DONNA intro, one CTA | High — must pick setup mode before seeing DONNA | Prototype wins |
| Questions per screen | 1 topic per screen | 2-4 topics per step (Steps 2, 3) | Prototype wins |
| Visual engagement | Hero glow, feature cards, animation keyframes | Clean dark surface, no hero | Prototype wins |
| Completion clarity | 5-step pills on Welcome | 11-node rail (hard to grasp scope) | Prototype wins |
| DONNA aliveness | Avatar, animated pulse dot, live building text | Sparkles icon, static panel | Prototype wins |
| Information richness | Low — DONNA message + progress + DNA building | High — "Why This Matters" + "Next Best Action" + progress + DNA building | AcademyOS wins |
| Draft safety | None (in-memory) | Strong — localStorage + save status + resume banner | AcademyOS wins |
| Template building in onboarding | Not included | Steps 4-5 (within onboarding) | Prototype wins for UX; AcademyOS better for director value |

### How much it feels like DONNA is building the academy

**Prototype:** Every screen reinforces "I'll use this to..." — DONNA is visibly learning in the right panel. The DNA building indicator with an animated pulse communicates that DONNA is actively processing. Feels like a conversation.

**AcademyOS:** Similar concept but more static. DONNA messages are correct but read like static help text rather than a live intelligence. The Curriculum Builder step in particular feels like the director is filling in a form, not teaching DONNA.

### Connected setup feeling

**Prototype:** Strong. Each decision connects to the next. Session blocks feed into the final DNA. The DNA Summary is a shareable card that crystallizes everything DONNA learned.

**AcademyOS:** Medium. Connections between steps are implied but not demonstrated visually. The Curriculum Builder step especially feels disconnected — it has four sub-sections that feel like different tasks rather than one coherent question to DONNA.

### Low overwhelm

**Prototype:** Very low. 5 focused questions, 4 minutes.
**AcademyOS:** High. 11 steps with placeholders, up to 45 minutes, setup mode selection before anything starts.

---

## 5. Template Architecture Check

### Class Template — AcademyOS vs desired requirement

**Prototype (SessionDesignScreen):** Abstract building blocks only — Technique Blocks, Live Ball Heavy, Constraint Games, Point Play, Stations, Assessment, Fitness Integrated. No specific named blocks, no fixed blocks architecture.

**AcademyOS FirstClassTemplateStep** (via `ClassTemplateBlockSelector`): Uses the proper AcademyOS block model with named blocks. Warm-Up and Reflection are fixed. The CLASS_BLOCKS model exists in a separate `ClassTemplateBlockSelector.tsx` component.

**Required class template blocks per sprint instructions:**

| Required Block | In AcademyOS CLASS_BLOCKS? |
|---|---|
| Warm-Up | Yes (fixed block) |
| Drills | Yes |
| Skills | Yes |
| Tactics | Yes |
| Games | Yes |
| Point Play | Yes |
| Match Play | Yes |
| Assessment Moment | Yes |
| Reflection / Wrap-Up | Yes (fixed block) |
| Optional video placeholder | Unknown — not visible in FirstClassTemplateStep |
| Coach preview | Present (ClassTemplateDraftPreview component) |
| Evidence opportunity | Assessment Moment covers this |

**Assessment:** The AcademyOS class template block architecture is correct and complete. The DONNA suggestion logic that maps session blocks to class blocks is sound. This should be kept.

### Fitness Template — AcademyOS vs desired requirement

**Required fitness template blocks per sprint instructions:**

| Required Block | Status |
|---|---|
| Movement Prep | Not yet built (Step 5 is placeholder) |
| Speed | Not yet built |
| Agility | Not yet built |
| Coordination | Not yet built |
| Strength Basics | Not yet built |
| Mobility | Not yet built |
| Recovery | Not yet built |
| Tennis Transfer | Not yet built |
| Conditioning | Not yet built |
| Balance | Not yet built |
| Footwork | Not yet built |
| Auto-populated exercises | Not yet built |
| No duplicate exercises across blocks | Not yet built |
| Optional video placeholder | Not yet built |
| Coach preview | Not yet built |

**Assessment:** Fitness template is entirely unbuilt (Step 5 is a placeholder). This should be built to prototype spec, but should NOT be built until the flow repair sprints are complete.

---

## 6. DONNA Panel Comparison

### Prototype DONNA panel

- 320px right sidebar, `#0D1614` background
- Avatar photo (`donna-avatar` CDN image) with animated pulse ring
- Active status dot (animated teal pulse)
- Per-screen contextual message bubble
- Setup Progress section (7 steps, complete/active/upcoming states)
- Live "Academy DNA — Building" section (shows chips as user makes choices)
- Animated building indicator at bottom (pulse dot + "Building academy defaults")
- Welcome screen: shows the "DONNA proposes. Directors approve." principle
- Final screen: shows "Academy DNA Active" completion state

### AcademyOS DONNA panel

- 320px right sidebar, `bg-surface` background
- Sparkles icon in lime circle (no avatar photo)
- Active status dot (static lime dot)
- Per-step contextual message bubble
- Setup Progress section (11 steps — all shown, complete/active/upcoming)
- Live "Academy DNA — Building" section (same chip pattern)
- "Why This Matters" section (not in prototype — strong addition)
- "Next Best Action" section (not in prototype — strong addition)
- "DONNA proposes. Directors approve." principle at bottom

### Gap analysis

| Feature | Prototype | AcademyOS | Gap |
|---|---|---|---|
| Avatar / visual identity | Photo avatar with glow | Sparkles icon | Missing |
| Animated pulse on avatar | Yes | No | Missing |
| Animated building indicator | Yes (pulse dot + text) | No (static) | Missing |
| Per-screen message | Yes | Yes | Matched |
| Live DNA building chips | Yes | Yes | Matched |
| Progress steps | 7 steps | 11 steps (overwhelming) | Too many steps shown |
| "Why This Matters" | No | Yes | AcademyOS advantage |
| "Next Best Action" | No | Yes | AcademyOS advantage |
| Welcome panel | Principle quote | Principle quote | Matched |
| Final panel | "Academy DNA Active" celebration | Not visible (covered by checklist) | Gap |

### Whether DONNA feels like a guide or static sidebar

**Prototype:** Active guide. The avatar glow and animated pulse make DONNA feel present and listening.
**AcademyOS:** Helpful sidebar. Well-written messages, but the static icon and lack of animation make it feel like a tooltip rather than an intelligence.

### Voice readiness

Neither prototype nor current AcademyOS onboarding implements voice input. The prototype does not include voice. AcademyOS has a voice pipeline in the database but not surfaced in onboarding. This is not a mismatch — it is a shared gap for a later sprint.

---

## 7. What Must Be Kept from Current Implementation

- **AcademyOS dark/lime aesthetic** — `#0A0A0A` base, `#C8FF00` lime, surface tokens, typography. Do not switch to teal.
- **Existing component language** — Card, button classes, Tailwind utility patterns. No raw inline styles.
- **localStorage draft persistence** — `useOnboardingDraftPersistence`, save/resume flow, DraftResumeBanner. Prototype has none of this. AcademyOS version is superior.
- **Draft-only safety copy** — "Nothing is applied until Activation Checklist." Keep this language.
- **"DONNA proposes. Directors approve."** — Keep in panel footer.
- **Current DONNA spelling** — Always "DONNA" in all caps.
- **No DB writes during onboarding** — The current model is correct.
- **No fake applied language** — "Draft only" safety language is correct.
- **AcademyOS block model** — `CLASS_BLOCKS` in `ClassTemplateBlockSelector` is the correct architecture. Keep it.
- **DONNA suggestion logic** — `computeDonnaSuggestion()` in `FirstClassTemplateStep` is sound. Keep it.
- **"Why This Matters" + "Next Best Action"** in DONNA panel — these are AcademyOS improvements over the prototype. Keep them.
- **Step model (OnboardingShell draft + updateDraft pattern)** — Clean architecture. Keep it.
- **OnboardingStepHeader component** — Consistent, well-built. Keep it.

---

## 8. What Must Be Restored from Prototype

- **User-friendly Welcome screen** — Remove upfront setup mode selection or defer it. Add 5-step progress pill row to communicate scope. Add compelling hero intro with ambient glow.
- **One-topic-per-screen discipline** — Coaching Philosophy and Coach Communication should be separate steps. Session Design (blocks + timeline) should be its own step or dramatically simplified within Curriculum Builder.
- **Player Development as its own step** — With drag-to-reorder rank panel (select left, rank right as prototype shows).
- **Prototype screen sequencing after Coaching DNA:**
  - Coaching Philosophy → Coach Communication → Session Design → Player Development → Parent Communication
  - Not: Coaching DNA (merged) → Curriculum Builder (4 sections) → Class Template → [5 placeholders]
- **Parent Communication as a visible step** — Do not bury it inside a placeholder Portal Preview. Build it separately or as a clear section.
- **DONNA Chat as a prominent adjustment interface** — At minimum, make the adjustment panel far more accessible in DNA Review. Ideally give it a full-screen option.
- **Celebration framing at Final Activation** — "Your academy foundation is ready" + DNA summary pills + next-steps grid cards. Not a checklist of incomplete items.
- **Animated DONNA presence** — Avatar (can be an initials avatar or icon, not the CDN photo), animated pulse on active states, live building indicator.
- **5-step pill row on Welcome** — Shows the director what the 5 DNA decisions are before they start. Sets expectations.
- **"Use recommended defaults" path** — Prototype has this. AcademyOS has it but it does not actually skip to defaults — it just goes to Step 1.
- **DNA Summary as a shareable card** — Narrative sentence + 2x2 stat grid + branded Academy DNA card visual.

---

## 9. What Should Be Deleted or Reversed

### Setup mode selection on Welcome

The Welcome screen forces directors to choose between 6 setup modes (Fast Start, Guided Setup, Full Setup, Import Existing, Consultant Setup, Multi-Location). This does not appear in the prototype and adds friction before DONNA has been introduced. Directors should not have to categorize themselves before they understand what they are setting up.

**Delete or defer:** Move setup mode to after the Welcome hero, or after Academy Basics, or remove entirely in favor of a simpler "Do this now vs customize later" pattern per step.

### Curriculum Builder as a 4-section step

The Curriculum Builder step has four independent sections: Curriculum Starting Point, Focus Levels, Session Building Blocks, Development Priorities. This is four decisions in one step. The prototype dedicates one full screen to Session Design alone and one full screen to Player Development alone.

**Reverse or split:** Either split into 2-3 separate steps, or dramatically reduce the Curriculum Builder to only Curriculum Starting Point (the one thing the prototype does not have but that is genuinely useful). Session blocks should be their own step. Player Development should be its own step.

### Primary Goals field in Academy Basics

The AcademyOS Academy Basics step adds "Primary Goals" (7 options) not present in the prototype. This is a fourth section in an already-correct step.

**Delete:** Remove Primary Goals from the onboarding step. This can be configured after activation.

### Activation Checklist framing

The ActivationChecklistStep frames the final screen as a task list with required/optional items and "Not ready" indicators. This is demotivating. A director who has just completed 8-10 steps should be celebrated, not presented with a checklist of things still incomplete.

**Reverse:** Keep the checklist logic (it is useful to show what is complete) but wrap it in a celebration shell as the prototype shows. Headline: "Your academy foundation is ready." Then show what is done and what is next as opportunity cards, not a task list.

---

## 10. Recommended Repair Sprint Plan

### Current state before repairs

- OF-1 through OF-4 are committed and code exists.
- Steps 5-8 are placeholders only.
- The biggest damage is in the scope and Welcome/Curriculum Builder/Activation framing — not in the individual built steps.

### Recommended repair sprints

**OF-FIX-1: Restore prototype-matched flow shell**
- Remove setup mode selection from Welcome (or defer it as non-blocking)
- Add 5-step pill row to Welcome (matching prototype)
- Add ambient glow element to Welcome hero section
- Add DONNA avatar (initials or icon) with animated status dot to DONNA panel
- Add animated building pulse indicator to DONNA panel
- Reduce DONNA panel progress list to show 7 key steps (not all 11)
- Change ActivationChecklistStep header to celebration framing
- Files: `OnboardingShell.tsx`, `OnboardingDonnaPanel.tsx`, `ActivationChecklistStep.tsx`

**OF-FIX-2: Restore Welcome + Academy Basics to prototype match**
- Welcome: Finalize hero with ambient glow, 5-step pills, feature cards strip (Curriculum Builder, Player Pathways, Analytics, Parent Reports)
- Academy Basics: Remove Primary Goals section; it can be post-activation
- Academy Basics: Restore age group colored dot indicators (matching prototype's per-ball-color dots)
- Files: `OnboardingShell.tsx` (WelcomeStep), `AcademyBasicsStep.tsx`

**OF-FIX-3: Split Coaching DNA into two steps**
- Step 3A: Coaching Philosophy — coaching styles only (up to 3, rank badges, DONNA live summary)
- Step 3B: Coach Communication — primary + secondary voice (current implementation is correct, just needs its own screen)
- Update OnboardingShell step count to 12
- Update OnboardingProgressRail, OnboardingDonnaPanel step lists
- Files: `OnboardingShell.tsx`, `CoachingDnaStep.tsx` (split), `OnboardingProgressRail.tsx`, `OnboardingDonnaPanel.tsx`

**OF-FIX-4: Simplify Curriculum Builder + restore Session Design as its own step**
- Curriculum Builder (Step 5): Keep only Curriculum Starting Point + Focus Levels. Remove session blocks and dev priorities from this step.
- New Step 6: Session Design — session building blocks + live timeline preview (matching prototype SessionDesignScreen, AcademyOS aesthetic)
- New Step 7: Player Development — top 5 priorities with drag-to-reorder (matching prototype PlayerDevelopmentScreen + left-select / right-rank panel)
- Update step counts, progress rail, DONNA messages
- Files: `CurriculumBuilderStep.tsx`, new `SessionDesignStep.tsx`, new `PlayerDevelopmentStep.tsx`, `OnboardingShell.tsx`, `OnboardingProgressRail.tsx`, `OnboardingDonnaPanel.tsx`

**OF-FIX-5: Build Class Template screen to prototype flow + AcademyOS block model**
- Keep existing `FirstClassTemplateStep.tsx` — architecture is correct
- Add visual timeline with colored block segments (matching prototype's colored block rail)
- Add block duration controls inline (not just via `ClassTemplateDraftPreview`)
- Improve DONNA suggestion panel to feel more like DONNA is proposing, not a static button
- Files: `FirstClassTemplateStep.tsx`, `ClassTemplateBlockSelector.tsx`, `ClassTemplateDraftPreview.tsx`

**OF-FIX-6: Build Fitness Template screen to prototype flow + AcademyOS exercise model**
- Build `FirstFitnessTemplateStep.tsx` replacing the placeholder
- 11 required fitness blocks with auto-populated exercises
- No duplicate exercises when same block repeated
- Coach preview + DONNA suggestion based on coaching DNA
- Optional video placeholder per block
- Files: `FirstFitnessTemplateStep.tsx` (new), `OnboardingShell.tsx`

**OF-FIX-7: Build Player Upload + Add Coaches screens**
- Player Upload: CSV upload or fast-fill (name, age group, level) — draft only
- Add Coaches: Name, role, level assignments — draft only
- Both: Skip option prominent, DONNA summary of what was added
- Files: `PlayerUploadStep.tsx` (new), `AddCoachesStep.tsx` (new), `OnboardingShell.tsx`

**OF-FIX-8: Build Portal Preview + Parent Communication + DNA Review match**
- Portal Preview: Tab through Director / Coach / Player / Parent portal previews
- Parent Communication: Prototype's 7-style card selection (moved from prototype screen 7) within Portal Preview
- Player Mission Style: simple single choice
- DNA Review: Add DNA Summary Card (narrative + 2x2 stat grid + academy name/model) matching prototype DNASummaryScreen visual
- Files: `PortalPreviewStep.tsx` (new), `AcademyDnaReviewStep.tsx`, `OnboardingShell.tsx`

**OF-FIX-9: DONNA Chat panel upgrade + voice readiness**
- DONNA Chat: Expand DonnaAdjustmentDraftPanel to be more prominent — scrollable within review step, or launch as a drawer
- Add example prompts strip (matching prototype's example prompt chips)
- Add typing indicator (3-dot animation)
- Add proposal card pattern (proposed changes + affected areas + Approve/Cancel)
- No live API calls — use canned responses for now (matching prototype pattern)
- Files: `DonnaAdjustmentDraftPanel.tsx`, `AcademyDnaReviewStep.tsx`

**OF-FIX-10: Activation Checklist + Final QA**
- Wrap ActivationChecklistStep in celebration framing
- Add "Your academy foundation is ready" headline
- Add Academy DNA summary pill strip (matching prototype's active DNA pills)
- Add next-steps opportunity cards (Curriculum, Templates, Coaches, Players, Parent Rules, Dashboard)
- Keep readyCheck logic but present as "already done" vs "continue setup" rather than "required / incomplete"
- Final prototype match QA across all steps
- Files: `ActivationChecklistStep.tsx`

---

## 11. Final Recommendation

### Is the current onboarding ready to continue?

**No.** The flow has drifted from the prototype in ways that will compound with every additional sprint. The Welcome screen is too heavy, the Curriculum Builder is too wide, the setup scope has expanded beyond the prototype's DNA-collection intent.

### Should OF-5 (First Fitness Template) continue?

**No.** OF-5 should not start. Building a fitness template placeholder-to-full step on top of a flow that needs repair is wasted work. The flow repair sprints (OF-FIX-1 through OF-FIX-4) should happen first.

### Should we repair mismatch first?

**Yes.** Repairs in OF-FIX-1 through OF-FIX-4 are relatively contained (Welcome, Academy Basics cleanup, Coaching DNA split, Curriculum Builder simplification + Session Design + Player Development extraction). These are the highest-value repairs and unblock the rest.

### What is the next exact sprint?

**OF-FIX-1: Restore prototype-matched flow shell**

Start there: Welcome hero, DONNA panel animation, step count repair, Activation Checklist celebration framing. These are the cheapest highest-impact changes and they affect how every subsequent step feels.

### Overall match score

**4.5 / 10**

The individual step implementations are technically sound. The flow architecture and scope have drifted too far from the prototype to continue adding steps without repair.

### Biggest mismatch

Curriculum Builder (Step 3) containing four separate decision areas, where the prototype dedicates a full screen to just Session Design and a full screen to just Player Development.

### What should be kept

AcademyOS block model, localStorage draft persistence, DONNA panel "Why This Matters" + "Next Best Action" sections, AcademyOS lime/dark aesthetic, draft-only safety model.

### What should be rebuilt

Welcome screen (no mode selection, add hero + pills), Curriculum Builder (strip to 2 sections), add Session Design step, add Player Development step with drag-to-reorder, Activation Checklist (celebration framing).

---

*OF-4 status: committed (c353e8a) — First Class Template architecture is correct, should be kept with visual improvements in OF-FIX-5.*
*OF-5 through OF-9 status: placeholders only — hold until OF-FIX-1 through OF-FIX-4 complete.*
