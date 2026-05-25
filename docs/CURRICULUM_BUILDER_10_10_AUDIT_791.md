# Curriculum Builder 10/10 Audit — Sprint 791

**Date:** 2026-05-25
**Sprint:** 791
**Status:** COMPLETE — Audit only, no code changes

---

## Overview

This audit evaluates the AcademyOS Curriculum Builder system — 7 primary routes, ~50 components, ~37 lib files, and 7 DONNA curriculum lib files — against two standards:

1. **AIQS** (Academy Interface Quality Standard, 100 points, 11 dimensions)
2. **Curriculum Builder rubric** (8 additional dimensions specific to curriculum UX)

**Files audited:**
- `src/app/director/curriculum/page.tsx` — Main landing page
- `src/app/director/curriculum/builder/page.tsx` + `CurriculumSetupBuilder.tsx` — Builder hub
- `src/app/director/curriculum/map/page.tsx` — Level map
- `src/app/director/curriculum/level/[levelId]/page.tsx` + `CurriculumLevelBuilderExperience.tsx` — Level editor
- `src/app/director/curriculum/academy-version/page.tsx` — Override diff viewer
- `src/app/director/curriculum/guided/page.tsx` — Guided review
- `src/app/director/curriculum/learning/page.tsx` — Learning modules preview
- `src/lib/curriculum/donnaCurriculumContext.ts` — DONNA curriculum context model
- `src/lib/donna/curriculumBuilderDonnaContext.ts` — DONNA builder chip context
- `src/lib/donna/curriculumLevelDonnaAnswer.ts` — DONNA curriculum answer engine
- `src/components/curriculum/builder/CurriculumBuilderWelcome.tsx` — DONNA welcome card
- `docs/ACADEMY_INTERFACE_QUALITY_STANDARD.md` — scoring standard

---

## Current AIQS Score

### Dimension Breakdown

| # | Dimension | Max | Score | Status |
|---|---|---|---|---|
| 1 | Purpose Clarity | 10 | 8 | ✅ |
| 2 | Primary Action Clarity | 10 | 7 | ⚠️ |
| 3 | Cognitive Load | 15 | 8 | ⚠️ Gap |
| 4 | Visual Hierarchy | 10 | 8 | ✅ |
| 5 | Typography | 10 | 8 | ✅ |
| 6 | Spacing & Layout | 10 | 8 | ✅ |
| 7 | Role Fit | 10 | 8 | ✅ |
| 8 | Accessibility | 10 | 7 | ⚠️ |
| 9 | State Quality | 5 | 3 | ⚠️ Gap |
| 10 | DONNA Integration | 5 | 4 | ⚠️ |
| 11 | Trust & Safety | 5 | 5 | ✅ Perfect |
| **Total** | | **100** | **74/100** | |

---

### Curriculum Builder Specific Rubric

| # | Dimension | Max | Score | Status |
|---|---|---|---|---|
| CB-1 | Navigation clarity | 10 | 5 | ⚠️ Gap |
| CB-2 | Curriculum data fidelity | 10 | 6 | ⚠️ |
| CB-3 | Edit safety + approval pipeline | 10 | 8 | ✅ |
| CB-4 | DONNA curriculum integration quality | 10 | 7 | ⚠️ |
| CB-5 | Curriculum spine completeness | 10 | 8 | ✅ |
| CB-6 | Voice curriculum input | 10 | 2 | ❌ Blocked |
| CB-7 | Mobile usability | 10 | 4 | ❌ Gap |
| CB-8 | Workflow completeness | 10 | 5 | ⚠️ Gap |
| **Total** | | **80** | **45/80 (56%)** | |

---

### Combined Score

| Standard | Score |
|---|---|
| AIQS | 74/100 |
| Curriculum Builder specific | 45/80 |
| **Overall estimate** | **~65/100** |

---

## AIQS Dimension Detail

### 1. Purpose Clarity — 8/10 ✅

Each page names its job. The main page is "Your Curriculum." The builder is "Curriculum Builder." The map is "Curriculum Map." Directors orient quickly on any single page.

**Why 8 and not 10:**
- The main landing page (`/curriculum`) and the builder hub (`/curriculum/builder`) both feel like primary hubs. A director can't tell from either page which one to start from.
- The subtitle on the main page ("This is where your academy's development system lives") and the builder ("Your academy starts with the master curriculum") say approximately the same thing.

---

### 2. Primary Action Clarity — 7/10 ⚠️

Each page has a clear primary CTA. The main page dynamically surfaces the right CTA based on status (Start Setup / Open Builder / Continue Setup). The builder hub has "Start Guided Review" as a clear teal button.

**Why 7 and not higher:**
- Section 5 of the main page ("Continue customizing your curriculum") has **two primary-weight CTAs side by side**: "Continue Curriculum Setup" (btn-lime) AND "Open Curriculum Builder" (btn-ghost). These point to different destinations with no explanation of the difference.
- This duplicates the status hero CTA above it — the same action appears in section 2 and section 5.
- The `CurriculumBuilderWelcome` chip "Advanced tools" links to `#curriculum-explorer` — an anchor inside a closed `<details>` collapse. Clicking it navigates to the element but does not open the collapse.

---

### 3. Cognitive Load — 8/15 ⚠️

**Why 8 and not higher:**

The main landing page has 11 visible section levels:
1. Header
2. DONNA Welcome card (`CurriculumBuilderWelcome`)
3. Curriculum Status hero card
4. Current Spine (5-stage grid)
5. (Conditional) Empty state
6. Setup Status checklist (5 items)
7. Coverage snapshot (`CurriculumHealthPanel`)
8. Level tree (`CurriculumLevelTree`)
9. "Continue customizing" card (2 CTAs)
10. Connected System grid
11. Next Recommended Actions
12. Advanced tools `<details>` collapse

Section 6 (setup checklist), section 7 (coverage), and section 8 (level tree) are all on the same page as the primary status hero. The level tree belongs in `/map`, not on the landing page.

The main page and the builder hub are both hubs — two competing surfaces without clear differentiation.

**AIQS fail condition proximity:** 11 sections total approaches the cognitive load fail threshold. No single fail condition is crossed, but the page is borderline.

---

### 4. Visual Hierarchy — 8/10 ✅

**Strengths:**
- Builder hub DONNA hero card is visually premium — teal accent, radial glow, large typography. The hierarchy reads immediately.
- Map page data provenance labels (seed/mixed/live/unavailable) are excellent — 4 distinct states with appropriate colors.
- Level builder: clean desktop split, DONNA aside sticky.

**Why 8 and not 10:**
- The `CurriculumSetupBuilder` uses `background: '#050b09'` and `border: '1px solid rgba(17,217,223,0.18)'` — the teal accent (`#11d9df`) throughout the builder hub is inconsistent with the site-wide lime design system. This creates visual discontinuity entering and leaving the builder.
- The main landing page's 11 sections are visually similar weight — no one section obviously dominates.

---

### 5. Typography — 8/10 ✅

Largely follows the design system. `label-xs` used correctly. Most body text is `text-[12px]` or `text-sm`.

**Why 8 and not higher:**
- `AuditStat` in `academy-version/page.tsx` uses `text-[9px]` for stat labels — below the AIQS minimum of 11px for label chips. The labels are: "Version", "Applied", "Rolled back", "Templates with level", etc. — these are operationally important, not purely decorative.
- `CurriculumBuilderWelcome` chip descriptions and "Next Recommended Actions" items use `text-[11px]` and `text-[12px]` for action text — borderline for operational content.

---

### 6. Spacing and Layout — 8/10 ✅

Main page: `p-6 space-y-8` is consistent. Cards use `px-4 py-3` and `p-5`.  
Builder: `max-w-[1180px] px-6 pt-10 pb-20` — comfortable desktop spacing.  
Map: `flex gap-6 p-4 sm:p-6` — good split.  
Level detail: `flex gap-6 p-4 sm:p-6` — same split pattern.

**Why 8 and not higher:**
- On the main landing page, the level tree (`CurriculumLevelTree`) sits between the coverage snapshot and the "Continue customizing" card, creating an unusually dense mid-page section.
- The `academy-version` page uses `space-y-8` throughout but the AuditStat strip within has `flex-wrap gap-6 px-4 py-3` — slightly cramped on narrow viewports.

---

### 7. Role Fit — 8/10 ✅

The curriculum builder system reads like a director's command center. Language is coaching-domain native (gates, levels, Red Ball, progression spine). The "DONNA reviews and you approve" model is consistently communicated. The builder hub's safety footer ("Nothing changes until you review and approve. Your curriculum is safe.") is excellent tone.

**Why 8 and not higher:**
- The builder hub's teal accent (`#11d9df`) is off-brand relative to the site-wide lime system. While it's internally consistent within the builder, it creates a "different application" feel.
- The learning modules page (`/learning`) is labeled "Director preview only" in an orange pill badge — the "preview" framing is appropriate but makes it feel unfinished rather than like a feature.

---

### 8. Accessibility — 7/10 ⚠️

**Failures:**
- `text-[9px]` in `AuditStat` — below AIQS minimum for operational labels
- The `<details>` hide pattern for advanced tools has no `aria-label`; its summary button has no explicit role description beyond default browser behavior
- "Jump to Level" modal in the builder has no focus trap — when open, focus can escape to the dimmed background
- Several icon-only items (the `ArrowLeft` back links on map and academy-version pages) have no `aria-label`

**Strengths:**
- Color is never the only status signal — all colored dots/badges have paired text labels
- Card hover states are implemented
- Tab order follows visual order on all server-rendered pages

---

### 9. State Quality — 3/5 ⚠️

**Critical failure — hardcoded incomplete items:**

```ts
// src/app/director/curriculum/page.tsx lines 243-255
{
  label: 'Templates connected',
  done: false,           // ← HARDCODED FALSE
  hint: 'Not connected yet.',
},
{
  label: 'Players connected to levels',
  done: false,           // ← HARDCODED FALSE
  hint: 'Not connected yet.',
},
```

Both checklist items are hardcoded as incomplete regardless of actual state. A director who has connected templates and assigned players to levels will see both as "Not connected yet" — a false negative that implies their work didn't register.

**Second failure — VoiceOverrideInputPanel hidden in production:**

```ts
// src/app/director/curriculum/page.tsx line 522
{process.env.NODE_ENV !== 'production' && (
  <VoiceOverrideInputPanel hasActiveVersion={!!activeVersion} />
)}
```

The voice curriculum input — the primary interface for directors to dictate curriculum changes — never renders in production. Directors have no voice entry point into curriculum customization.

**What passes:**
- Data provenance labels (seed/mixed/live/unavailable) are excellent 4-state handling
- Empty state for Academy Version page is clear and action-oriented
- Loading/error states at the route level are handled (auth gates, academy context gates)

---

### 10. DONNA Integration — 4/5 ⚠️

**Strengths:**
- `CurriculumBuilderWelcome` is excellent — state-aware (active/no-version), warm DONNA tone, 4 action chips with descriptions
- `CurriculumDonnaPanel` on the map page shows health stats (Ready / Needs Review / Incomplete / Custom counts)
- `curriculumLevelDonnaAnswer.ts` handles 8 intent pattern families across 12 levels — the deepest DONNA curriculum knowledge in the product
- `donnaCurriculumContext.ts` enforces `canPublish: false`, `canAutoApply: false`, `requiresDirectorApproval: true` at the type level
- Gap chip and explain chip are well-designed entry points from the builder

**Why 4 and not 5:**
- `CurriculumDonnaPanel` is `hidden lg:block` — DONNA health panel disappears on mobile and tablet
- DONNA can explain curriculum in depth, but the action-to-operation gap is jarring: asking DONNA "what's missing in my curriculum" gives a read-only answer, but DONNA cannot open the level, surface the gap, and draft a fix in sequence

---

### 11. Trust & Safety — 5/5 ✅ Perfect

- `donnaCurriculumContext.ts`: `canPublish: false`, `canAutoApply: false`, `requiresDirectorApproval: true`, `neverAutoApply: true` at the TypeScript type level
- All curriculum overrides flow through `proposed_actions` → Review Queue → director approval
- Builder hub safety footer: "Nothing changes until you review and approve. Your curriculum is safe."
- `isProtectedVoicePhrase()` prevents voice from triggering mutations
- No service-role bypass on any curriculum query
- All tables have RLS
- `academy_curriculum_overrides` table requires `approved_at` before application

No regressions. This is a hard 5/5.

---

## Curriculum Builder Specific Rubric Detail

### CB-1. Navigation Clarity — 5/10 ⚠️

**Route map:**
```
/director/curriculum           → Main hub (overview + status)
/director/curriculum/builder   → DONNA builder hub (setup + jump)
/director/curriculum/map       → Level map (all levels at a glance)
/director/curriculum/level/[id]→ Per-level editor
/director/curriculum/guided    → Step-by-step DONNA review
/director/curriculum/learning  → Learning modules preview (director-only)
/director/curriculum/academy-version → Override diff viewer
```

**Problems:**

1. **Two hubs, unclear distinction.** The main page and builder hub both feel like the "home base" for curriculum. Neither page clearly says "start here for status" vs "start here to build."

2. **To edit a level, a director must navigate 3 pages deep.** `/curriculum` → `/curriculum/builder` → click a level → `/curriculum/level/[id]`. There is no shortcut from the main page to a specific level.

3. **Academy Version page is functionally undiscoverable.** Its only visible links are:
   - A tiny `text-[11px]` text link buried at the bottom of the "How Customization Works" section inside the closed `<details>` collapse
   - Direct URL: `/director/curriculum/academy-version`
   
   There is no chip, card, or nav link to it from any prominent position.

4. **The `CurriculumBuilderWelcome` "Advanced tools" chip** links to `#curriculum-explorer` — an anchor inside the closed `<details>` element. Clicking it scrolls to the element but does not open it.

5. **Guided review is not discoverable from the main page.** It appears in the builder hub and map page, but not from `/curriculum` (except as a chip in `CurriculumBuilderWelcome`).

---

### CB-2. Curriculum Data Fidelity — 6/10 ⚠️

**What's good:**
- Data provenance labels on the map page (seed/mixed/live/unavailable) are excellent — directors always know if they're looking at real or demo data
- Coverage snapshot (`CurriculumHealthPanel`) shows real per-level counts from the DB
- Academy Version page shows real applied overrides, rolled-back overrides, and in-progress overrides

**What's broken:**
- Setup checklist items 4 and 5 are hardcoded false — directors who have connected templates and players see incorrect status
- The main page spine grid (5 stages) is 100% static — it shows the generic stage descriptions regardless of what the director has customized
- `skillCount`, `assessmentCriteriaCount`, `missionCount`, `badgeCount`, `parentGuidanceCount` are all hardcoded as `0` in the coverage model inputs (lines 124-130 of `page.tsx`) — coverage reporting omits half the content types

---

### CB-3. Edit Safety + Approval Pipeline — 8/10 ✅

The approval architecture is impeccable:
- `donnaCurriculumContext.ts` enforces `canPublish: false`, `neverAutoApply: true` at the TypeScript type level — not just runtime guards, but compile-time guarantees
- All overrides route through `proposed_actions` → Review Queue → director approval → `academy_curriculum_overrides`
- `CurriculumEditPermissionGuard` component wraps editable areas
- `ApprovalFlowStatusBar` shows pipeline status

**Why 8 and not 10:**
- The pipeline is architecturally sound but not fully wired: `draft_curriculum_item` action is explicitly `implemented_not_wired` (documented in `curriculumBuilderDonnaContext.ts`) — the safety model is perfect, but the thing it protects (voice curriculum drafts) doesn't flow through it yet
- `execute_approved_action()` exists and is guarded, but the curriculum track through it is incomplete

---

### CB-4. DONNA Curriculum Integration Quality — 7/10 ⚠️

**Strengths:**
- `curriculumLevelDonnaAnswer.ts`: 12 level descriptions, 4 stage summaries, 8 intent pattern families (level structure, explain level, content summary, content explain, gap analysis, template coverage, assessment gaps, "how it works")
- `buildCurriculumGapChip()` and `buildCurriculumBuilderExplainChip()` are clean chip helpers
- Template coverage gap analysis and assessment gap analysis are both wired to DONNA answers
- DONNA answer engine is pure TypeScript — no DB, no AI calls, no side effects

**Why 7 and not higher:**
- DONNA can **explain** curriculum at depth (12 levels, 8 question types) but cannot **operate** it. The gap between "DONNA answers curriculum questions" and "DONNA opens the level, shows the gap, and drafts a fix" is the #1 DONNA integration gap in the product
- `draft_curriculum_item` action is not wired — DONNA cannot create curriculum drafts
- `suggest_drill_attachments` action exists in `donnaCurriculumContext.ts` but its `outputsProposedAction: false` means it only surfaces suggestions for the director to manually attach — no draft creation path
- DONNA's curriculum panel (`CurriculumDonnaPanel`) is not visible on mobile

---

### CB-5. Curriculum Spine Completeness — 8/10 ✅

The system can show:
- 5-stage static spine (main page)
- Per-level health data (map page: ready/needs review/incomplete/custom counts)
- Full level detail (level page: gates, drills, competition track, fitness guidance, coach language)
- Academy overrides (academy-version page: applied/rolled-back/in-progress diff view)
- Coverage by content type (CurriculumHealthPanel: gates, drills, coach cues, competition, fitness, volume)
- Learning modules (learning page: player-facing content preview)

**Why 8 and not 10:**
- `skillCount`, `assessmentCriteriaCount`, `missionCount`, `badgeCount`, `parentGuidanceCount` are hardcoded `0` in coverage inputs — half the content dimensions are invisible in the coverage view
- The global spine (master curriculum before academy overrides) and the academy version are never shown side-by-side — directors can't see "what's standard" vs "what we changed" from a single surface

---

### CB-6. Voice Curriculum Input — 2/10 ❌ Blocked

This is the most significant gap in the entire Curriculum Builder surface.

**What is blocked:**

1. **`VoiceOverrideInputPanel` is production-gated:**
```ts
// page.tsx line 522-524
{process.env.NODE_ENV !== 'production' && (
  <VoiceOverrideInputPanel hasActiveVersion={!!activeVersion} />
)}
```
Directors in production have no voice input panel for curriculum customizations.

2. **`draft_curriculum_item` action is not wired:**
From `curriculumBuilderDonnaContext.ts` (explicitly documented):
> "draft_curriculum_item — draft_only, implemented_not_wired. saveCurriculumDraftAction exists in src/lib/actions/curriculumDraft.ts and routes through proposed_actions, but inserts into voice_commands first as a hard dependency. Code comment notes: 'Schema may need voice_command_id to be optional for curriculum drafts.' Do not wire until this dependency is verified or relaxed."

3. **`DonnaAddDrillDraft` and `DonnaCurriculumNodeAddCard` are UI-only mocks** — they set local state only and do not call `saveCurriculumDraftAction`.

**What this means operationally:**
- A director who says "add a cross-court baseline drill to Orange 2" → DONNA understands the intent → nothing actually happens in the database → no draft is created → no review queue item appears
- The entire voice curriculum customization pipeline is architecturally complete but operationally disabled

**What is working:**
- Gap identification: DONNA can identify curriculum gaps and describe them
- Level explanation: DONNA can explain any level in detail
- Navigation: gap chip → DONNA panel → "Take me to Curriculum" CTA

---

### CB-7. Mobile Usability — 4/10 ❌ Gap

**Critical issues:**

1. **Map page DONNA panel is desktop-only:** `<aside className="hidden lg:block w-72 ...">` — the entire health stats panel is invisible on mobile. On small screens, directors get the map with no health context and no DONNA entry point.

2. **Level detail page uses a desktop split layout:** `flex gap-6 items-start overflow-x-hidden max-w-[1440px]` with a sticky DONNA aside panel (`hidden lg:block w-72`). On mobile, the level content shows but DONNA is absent.

3. **Builder hub:** `grid grid-cols-1 md:grid-cols-3` and `grid grid-cols-2 md:grid-cols-5` — these collapse to single-column on mobile, which is reasonable, but the DONNA hero card at `p-8 md:p-10` is not tested for mobile height.

4. **Academy Version page:** The AuditStat strip uses `flex-wrap gap-6` — acceptable on mobile, but with 6 stats it wraps into 2-3 rows.

**What works on mobile:**
- Map page has a dedicated mobile health summary block (`block lg:hidden`) with health chips and "Start Guided Review" link — this is good
- Main landing page is single-column and works on mobile
- `CurriculumBuilderWelcome` grid is `grid-cols-1 sm:grid-cols-2` — mobile-safe

---

### CB-8. Workflow Completeness — 5/10 ⚠️

Can a director complete a full curriculum customization workflow?

| Step | Status | Notes |
|---|---|---|
| View curriculum status | ✅ | Main page status hero |
| Identify gaps | ✅ | DONNA gap chip, map health panel |
| Navigate to a specific level | ✅ | Map, builder jump modal, guided review |
| Understand what a level needs | ✅ | Level page: gates, drills, coach cues |
| Draft a curriculum change | ⚠️ | UI exists but `draft_curriculum_item` not wired |
| Submit draft for approval | ⚠️ | `saveCurriculumDraftAction` exists but has `voice_commands` dependency |
| Review and approve | ✅ | Review Queue + `/director/review` |
| See overrides applied | ✅ | Academy Version page |
| Connect templates to levels | ⚠️ | Instructions exist but no direct UI path |
| Connect players to levels | ⚠️ | Instructions exist but no direct UI path |
| See voice-drafted customization | ❌ | `VoiceOverrideInputPanel` gated to non-production |

---

## Top 10 Blockers

Ordered by impact on the director experience.

### Blocker 1 — Voice curriculum drafting is not wired (CRITICAL)

**What:** `draft_curriculum_item` action is `implemented_not_wired`. `saveCurriculumDraftAction` requires `voice_command_id` which creates a blocking dependency on a `voice_commands` table insert. `VoiceOverrideInputPanel` is production-gated.

**Impact:** The entire curriculum voice customization flow — the most director-native way to make changes — is disabled in production. Directors cannot use voice to propose curriculum changes.

**File:** `src/lib/actions/curriculumDraft.ts` (make `voice_command_id` optional), `src/lib/donna/curriculumBuilderDonnaContext.ts` (wire the action), `src/app/director/curriculum/page.tsx` (remove production gate)

**Sprint estimate:** Medium (1–2 sprints)

---

### Blocker 2 — Hardcoded setup checklist items 4 and 5 (HIGH)

**What:** "Templates connected" and "Players connected to levels" always show `done: false` regardless of actual template and player assignment state.

**Impact:** Directors who have done this work see it as incomplete. A setup progress indicator that's wrong erodes trust in the entire system.

**File:** `src/app/director/curriculum/page.tsx` lines 243–254

**Sprint estimate:** Small — query `templates` for `curriculum_level_id` count and `player_curriculum_states` for active player assignment count

---

### Blocker 3 — Two competing hub pages (HIGH)

**What:** `/director/curriculum` and `/director/curriculum/builder` both serve as primary curriculum hubs with overlapping content. Neither page is clearly the "home base."

**Impact:** Directors don't know where to start. The "Open Curriculum Builder" CTA on the main page leads to a page that says "Welcome to Curriculum Builder" — the director has navigated from one hub to another hub.

**File:** `src/app/director/curriculum/page.tsx`, `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx`

**Sprint estimate:** Medium — requires information architecture redesign

---

### Blocker 4 — Advanced curriculum tools hidden in `<details>` collapse (HIGH)

**What:** `CurriculumExplorer`, `CurriculumCustomizationAssistant`, `AcademyCurriculumVersionCard`, `VoiceOverrideInputPanel`, `CurriculumLoopDiagram`, `PageExplainerCard` are all inside a closed `<details>` element. The `CurriculumBuilderWelcome` "Advanced tools" chip links to an anchor inside this collapse that doesn't auto-open it.

**Impact:** Six major curriculum tools have zero discoverability. A director might use the system for weeks without knowing the Explorer, Academy Version, or Customization Assistant exist.

**File:** `src/app/director/curriculum/page.tsx` lines 462–567, `src/components/curriculum/builder/CurriculumBuilderWelcome.tsx`

**Sprint estimate:** Small — surface tools as visible cards; remove `<details>` wrapper

---

### Blocker 5 — Coverage report omits 6 content dimensions (MEDIUM-HIGH)

**What:** `levelCoverageInputs` construction hardcodes `skillCount: 0`, `assessmentCriteriaCount: 0`, `evidenceRequirementCount: 0`, `missionCount: 0`, `badgeCount: 0`, `parentGuidanceCount: 0`, `learningModuleCount: 0`.

**Impact:** The coverage snapshot shows gates, drills, and coach cues — but not skills, missions, badges, or parent guidance. Directors get an incomplete picture of what each level has.

**File:** `src/app/director/curriculum/page.tsx` lines 118–133

**Sprint estimate:** Medium — requires additional DB queries for each content type count

---

### Blocker 6 — Mobile experience: DONNA panel hidden, no mobile UX for level editing (MEDIUM)

**What:** Map page DONNA panel: `hidden lg:block`. Level detail DONNA panel: `hidden lg:block`. Level editing on mobile shows content but no DONNA context.

**Impact:** Directors on iPad or phone have no DONNA integration on the most important curriculum pages.

**File:** `src/app/director/curriculum/map/page.tsx`, `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`

**Sprint estimate:** Medium — create mobile health bar component + mobile DONNA chip strip

---

### Blocker 7 — Academy Version page is undiscoverable (MEDIUM)

**What:** The only link to `/director/curriculum/academy-version` visible to directors is a tiny `text-[11px]` link buried inside a closed `<details>` section.

**Impact:** Directors cannot find the override diff view — the page that shows them exactly what they've changed from the global spine.

**File:** `src/app/director/curriculum/page.tsx` (add to Connected System or status hero area)

**Sprint estimate:** Tiny — add a chip link from a visible section

---

### Blocker 8 — No direct "edit a level" path from the main curriculum page (MEDIUM)

**What:** The main curriculum page shows a level tree (`CurriculumLevelTree`) and spine grid but clicking anywhere on those doesn't navigate to the level editor. Directors must go to the builder hub, then to the map or jump modal, then to the level.

**Impact:** 3 navigations to edit a level. A director who wants to update Orange 2 gates must go: `/curriculum` → `/curriculum/builder` → click jump modal → select "Orange 2" → `/curriculum/level/[id]`.

**File:** `src/app/director/curriculum/page.tsx`, `src/app/director/curriculum/_components/CurriculumLevelTree.tsx`

**Sprint estimate:** Small — make level tree items link to `/curriculum/level/[id]`

---

### Blocker 9 — Duplicate CTA on main page section 5 (LOW-MEDIUM)

**What:** The main page has:
- Section 2 (status hero): single CTA dynamically set by status → correct
- Section 5 ("Continue customizing"): hardcoded "Continue Curriculum Setup" (btn-lime) + "Open Curriculum Builder" (btn-ghost) regardless of status — duplicates section 2 with conflicting targets

**Impact:** Directors see the same "start/continue curriculum" message twice with different buttons pointing to different places.

**File:** `src/app/director/curriculum/page.tsx` lines 408–426

**Sprint estimate:** Tiny — either remove section 5 CTA block or make it conditional on status

---

### Blocker 10 — Builder hub uses off-brand teal accent system (LOW)

**What:** `CurriculumSetupBuilder.tsx` uses `#11d9df` (teal) as its primary accent, deviating from the site-wide `#C8FF00` (lime) design token. The teal is internally consistent within the builder hub but creates visual discontinuity.

**Impact:** Entering the builder feels like entering a different application. The design system's consistency benefit is lost on this page.

**File:** `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx`

**Sprint estimate:** Medium — full color token alignment pass

---

## Top 5 Quick Wins

Ordered by impact/effort ratio (small effort, high visible impact).

### QW-1 — Fix hardcoded setup checklist items 4 and 5

**File:** `src/app/director/curriculum/page.tsx`

Add two queries to the existing DB fetch block:
```ts
// Query templates with curriculum_level_id set
const { count: templatesWithLevel } = await rawDb
  .from('templates')
  .select('*', { count: 'exact', head: true })
  .eq('academy_id', academyId)
  .eq('is_active', true)
  .not('curriculum_level_id', 'is', null)

// Query active players with curriculum state
const { count: playersWithLevel } = await rawDb
  .from('player_curriculum_states')
  .select('*', { count: 'exact', head: true })
  .eq('academy_id', academyId)
```

Then update `setupItems[3].done` and `setupItems[4].done` to use these counts.

**Effort:** 30 minutes

---

### QW-2 — Surface Academy Version as a visible chip on the main page

**File:** `src/app/director/curriculum/page.tsx`

Add to the Connected System grid (or as a chip in the DONNA Welcome card) when `versionData` exists:

```tsx
<Link href="/director/curriculum/academy-version" className="...">
  <GitBranch ... />
  Academy Curriculum Version
  <p>View your overrides and customizations.</p>
</Link>
```

**Effort:** 20 minutes

---

### QW-3 — Fix `text-[9px]` micro-labels in AuditStat

**File:** `src/app/director/curriculum/academy-version/page.tsx`

Change `text-[9px]` to `text-[10px]` or `text-[11px]` in the `AuditStat` component's label:

```tsx
// Before:
<p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
// After:
<p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
```

**Effort:** 5 minutes

---

### QW-4 — Make level tree items navigable on the main page

**File:** `src/app/director/curriculum/_components/CurriculumLevelTree.tsx`

Wrap each level row in a `<Link href={/director/curriculum/level/${level.id}}>` so directors can go directly from the main page level tree to the level editor.

**Effort:** 30 minutes

---

### QW-5 — Remove duplicate CTA block from section 5

**File:** `src/app/director/curriculum/page.tsx`

The "Continue customizing your curriculum" card (section 5, lines 408–426) is a direct duplicate of the status hero CTA (section 2). Remove section 5 entirely, or replace it with a link to the Guided Review for active-version state.

**Effort:** 5 minutes

---

## Top 5 Structural Changes

These are medium-to-large changes that resolve architectural gaps.

### SC-1 — Wire `draft_curriculum_item` action

**Problem:** `saveCurriculumDraftAction` in `src/lib/actions/curriculumDraft.ts` requires a `voice_command_id`, creating a hard dependency on the `voice_commands` table. This prevents all DONNA curriculum draft creation.

**Resolution:**
1. Make `voice_command_id` optional in `saveCurriculumDraftAction` — curriculum drafts initiated from the UI should not require a voice command record
2. Wire `saveCurriculumDraftAction` to `DonnaAddDrillDraft` and `DonnaCurriculumNodeAddCard` (currently UI-only mocks)
3. Remove the `process.env.NODE_ENV !== 'production'` gate from `VoiceOverrideInputPanel`

**Files:** `src/lib/actions/curriculumDraft.ts`, `src/lib/donna/curriculumBuilderDonnaContext.ts`, `src/app/director/curriculum/page.tsx`

---

### SC-2 — Clarify the two hub pages

**Problem:** `/curriculum` and `/curriculum/builder` both feel like primary hubs.

**Proposed architecture:**
- `/curriculum` → **Status command center** — spine health, coverage, setup checklist, overrides count, level tree. Read-only signals. Single CTA: "Go to Builder" or "Review Levels" based on status.
- `/curriculum/builder` → **DONNA-powered build workspace** — guided review, jump-to-level, gap analysis. All editing entry points here.

**Changes:**
- Remove the level tree from the main page (it belongs on `/map` and the builder)
- Remove the "Continue customizing" section from the main page (the status hero CTA is sufficient)
- Add the Academy Version chip and Learning Modules chip to the main page's connected surface

---

### SC-3 — Mobile DONNA health bar for map and level pages

**Problem:** `CurriculumDonnaPanel` is `hidden lg:block` — mobile directors have no curriculum health data or DONNA entry points.

**Resolution:** Create `CurriculumMobileHealthBar.tsx`:
- Shows as a horizontal chip strip below the page header on mobile
- 4 health counts (Ready / Needs Review / Incomplete / Custom) as compact colored chips
- A "Ask DONNA" chip that opens DONNA panel with the curriculum gap prompt
- `block lg:hidden` — desktop sees the full side panel, mobile sees the chip strip

**Files to create:** `src/components/curriculum/builder/CurriculumMobileHealthBar.tsx`
**Files to modify:** `src/app/director/curriculum/map/page.tsx`, `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`

---

### SC-4 — DONNA curriculum operating mode (explain → operate)

**Problem:** DONNA can explain curriculum at expert depth (12 levels, 8 intent families) but cannot operate it. The gap between "DONNA answers" and "DONNA acts + director approves" is the highest-leverage upgrade in the curriculum system.

**Resolution:** After `draft_curriculum_item` is wired (SC-1), add:
1. A `donna:open` dispatch in the level page that pre-populates DONNA with the level's gap summary — when a director opens a level, DONNA says "Orange 2 has 2 gaps. Want me to draft a drill suggestion?"
2. An inline "Draft with DONNA" entry point on each level section (gates, drills) that triggers the gap chip with section context
3. A post-gap-analysis CTA in DONNA's answer: "I found 3 gaps. Want me to draft additions for director review?"

**Files:** `src/lib/donna/curriculumBuilderDonnaContext.ts`, `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`, `src/components/curriculum/builder/CurriculumDonnaPanel.tsx`

---

### SC-5 — Complete coverage report with all content dimensions

**Problem:** Coverage inputs for 7 of 12 content types (skills, assessment criteria, evidence requirements, missions, badges, parent guidance, learning modules) are hardcoded `0`.

**Resolution:** Add per-level count queries for each content type to `getCurriculumExplorerData()` or to the main page directly. The queries exist in pattern in `src/app/director/curriculum/learning/page.tsx` (drills, gates, coach language). Extend to all content dimensions.

**Files:** `src/lib/backend/curriculumExplorer.ts`, `src/app/director/curriculum/page.tsx`

---

## Desktop UX Audit

### Main Landing Page (`/curriculum`)

| Section | Assessment | Action |
|---|---|---|
| Header | ✅ Clear | — |
| DONNA Welcome | ✅ Warm, state-aware | Fix "Advanced tools" anchor → open details |
| Status hero | ✅ 3-state, correct CTA | — |
| Current Spine | ⚠️ Static, not linked | Make stages link to `/curriculum/map?stage=X` |
| Setup Checklist | ❌ Items 4-5 hardcoded false | Fix with live queries (QW-1) |
| Coverage Snapshot | ⚠️ 6 dimensions missing | Fix with full content type counts (SC-5) |
| Level Tree | ⚠️ Not navigable | Make rows link to level editor (QW-4) |
| Continue Builder card | ❌ Duplicate CTA | Remove section 5 (QW-5) |
| Connected System | ⚠️ Generic descriptions | Add Academy Version chip (QW-2) |
| Next Actions | ✅ Dynamic, clear | — |
| Advanced Tools `<details>` | ❌ Undiscoverable | Surface as visible section (Blocker 4) |

### Builder Hub (`/curriculum/builder`)

| Section | Assessment | Action |
|---|---|---|
| DONNA Hero card | ✅ Premium, clear | Change teal accent → lime for brand alignment |
| How It Works | ✅ 3 steps, clear | — |
| Master Curriculum Overview | ✅ 5 pathways, visual | Make pathway cards link to stage filter on map |
| Keyboard Hint Bar | ✅ Good | — |
| Safety Footer | ✅ Excellent | — |
| Jump to Level modal | ✅ Good UX | Add focus trap |

### Map Page (`/curriculum/map`)

| Section | Assessment | Action |
|---|---|---|
| Header | ✅ | — |
| Data provenance label | ✅ Excellent | — |
| CurriculumSearch | ✅ | — |
| CurriculumRelationshipMapNav | ✅ | — |
| CurriculumLevelMap | ✅ | — |
| DONNA panel (desktop) | ✅ | — |
| DONNA panel (mobile) | ❌ Hidden | Add mobile health bar (SC-3) |

### Academy Version Page (`/curriculum/academy-version`)

| Section | Assessment | Action |
|---|---|---|
| Back link | ✅ | Add `aria-label` |
| Version summary card | ✅ | — |
| Applied overrides list | ✅ | — |
| Rolled back / in-progress | ✅ | — |
| Connection Audit strip | ⚠️ `text-[9px]` labels | Fix to `text-[10px]` (QW-3) |
| Action items | ✅ Clear | — |

---

## Mobile UX Audit

| Page | Mobile Status | Issues | Fix |
|---|---|---|---|
| `/curriculum` | ✅ Acceptable | 11 sections is long | Remove duplicate sections |
| `/curriculum/builder` | ⚠️ Usable | DONNA hero tall on mobile, grid collapses OK | Reduce hero padding at `sm:` |
| `/curriculum/map` | ⚠️ Degraded | DONNA health panel hidden | Mobile health bar (SC-3) |
| `/curriculum/level/[id]` | ⚠️ Degraded | DONNA panel hidden, complex split layout | Stacked layout on mobile, DONNA chip strip |
| `/curriculum/academy-version` | ✅ Acceptable | AuditStat strip wraps | Fine as-is |
| `/curriculum/guided` | Unknown | `CurriculumGuidedReviewExperience` not audited | Should be audited separately |
| `/curriculum/learning` | ✅ Good | `max-w-4xl` single-column, mobile-safe | — |

---

## DONNA Integration Audit

| Dimension | Current State | Score | Next Step |
|---|---|---|---|
| DONNA knowledge depth | 12 levels, 8 intent families | ✅ Strong | Extend gap analysis to template/assessment gaps (already done in 742C/D) |
| DONNA can explain | Full level descriptions, content types, how-it-works | ✅ Strong | — |
| DONNA can identify gaps | Gap chip → gap analysis answer | ✅ Working | Wire to level navigation post-answer |
| DONNA can draft curriculum | `draft_curriculum_item` not wired | ❌ Blocked | SC-1 |
| DONNA can submit for approval | `saveCurriculumDraftAction` has voice_commands dependency | ❌ Blocked | SC-1 |
| DONNA presence on desktop | Map + level: DONNA panel with health items | ✅ Good | — |
| DONNA presence on mobile | Hidden (`hidden lg:block`) | ❌ Missing | SC-3 |
| DONNA safety boundary | `canPublish: false`, `neverAutoApply: true` | ✅ Perfect | — |
| DONNA context on main page | `CurriculumBuilderWelcome` only | ⚠️ Partial | Add gap chip entry point to main page |

---

## Edit Safety Audit

| Safety Layer | Status | Notes |
|---|---|---|
| `canPublish: false` | ✅ TypeScript type-level | Cannot be bypassed at compile time |
| `canAutoApply: false` | ✅ TypeScript type-level | Same |
| `requiresDirectorApproval: true` | ✅ TypeScript type-level | Same |
| `neverAutoApply: true` | ✅ TypeScript type-level | Same |
| Voice → `proposed_actions` only | ✅ Enforced | `isProtectedVoicePhrase()` blocks mutations |
| Overrides → Review Queue → apply | ✅ Three-step | `proposed_actions` → `approved_at` → `applied_at` |
| `CurriculumEditPermissionGuard` | ✅ Wraps editable areas | Director-only enforcement |
| `audit_logs` writes | ✅ On all major mutations | — |
| RLS on all curriculum tables | ✅ | `curriculum_levels`, `curriculum_gates`, `curriculum_drills`, `academy_curriculum_versions`, `academy_curriculum_overrides` all have RLS |

**Edit safety score: 10/10 — No gaps found.**

---

## Versioning and Approval Audit

| Capability | Status | Notes |
|---|---|---|
| Global spine → academy clone | ✅ Implemented | `academy_curriculum_versions` tracks the clone |
| Academy overrides | ✅ Implemented | `academy_curriculum_overrides` table |
| Version numbering | ✅ `version_number` field | Auto-incremented |
| Override diff view | ✅ `CurriculumOverrideDiffCard` | Original snapshot vs proposed change |
| Rolled-back overrides visible | ✅ Academy Version page | Historical record preserved |
| Director approval required | ✅ `approved_at` required before apply | — |
| Multi-version support | ⚠️ Partial | One active + one draft; no historical version comparison UI |
| Override reason field | ✅ `override_reason` in schema | Shown in diff card |
| Voice-submitted drafts | ❌ Not wired | `draft_curriculum_item` blocked |
| Override count on main page | ✅ Shown in status description | `${overrideCount} override${...}` |

---

## Exact Files to Modify in Future Sprints

### Sprint 792 (recommended next — Quick Wins)

| File | Change |
|---|---|
| `src/app/director/curriculum/page.tsx` | Fix checklist items 4-5 (live queries), remove duplicate CTA section 5, make level tree rows navigable, add Academy Version chip to Connected System |
| `src/app/director/curriculum/_components/CurriculumLevelTree.tsx` | Wrap level rows in `<Link href={/curriculum/level/${level.id}}>` |
| `src/app/director/curriculum/academy-version/page.tsx` | Fix `text-[9px]` → `text-[10px]` in AuditStat |

### Sprint 793 — Voice Curriculum Drafting Unblock

| File | Change |
|---|---|
| `src/lib/actions/curriculumDraft.ts` | Make `voice_command_id` optional |
| `src/lib/donna/curriculumBuilderDonnaContext.ts` | Wire `draft_curriculum_item` action |
| `src/app/director/curriculum/page.tsx` | Remove `process.env.NODE_ENV !== 'production'` gate from `VoiceOverrideInputPanel` |
| `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx` | Wire `DonnaAddDrillDraft` to `saveCurriculumDraftAction` |

### Sprint 794 — Information Architecture Cleanup

| File | Change |
|---|---|
| `src/app/director/curriculum/page.tsx` | Move advanced tools out of `<details>`, surface as visible section, reduce total sections to 6 max |
| `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` | Clarify builder hub role vs main page (add "← Back to Curriculum Overview" breadcrumb, remove overlap) |
| `src/components/curriculum/builder/CurriculumBuilderWelcome.tsx` | Fix "Advanced tools" chip → link directly to `/curriculum/academy-version` not anchor |

### Sprint 795 — Mobile Curriculum Experience

| File | Change |
|---|---|
| `src/components/curriculum/builder/CurriculumMobileHealthBar.tsx` | **New file** — mobile-only health chip strip with 4 stat chips + DONNA entry point |
| `src/app/director/curriculum/map/page.tsx` | Add `CurriculumMobileHealthBar` below header (mobile-only) |
| `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx` | Add mobile-only DONNA chip strip; convert split layout to stacked on mobile |

### Sprint 796 — Coverage Completeness

| File | Change |
|---|---|
| `src/lib/backend/curriculumExplorer.ts` | Extend `getCurriculumExplorerData` to return per-level counts for skills, missions, badges, parent guidance |
| `src/app/director/curriculum/page.tsx` | Wire new counts into `levelCoverageInputs` (replace hardcoded `0` values) |

---

## Final Decision

### Current State: 65/100 — Not yet a 10/10 curriculum command center

The AcademyOS Curriculum Builder has strong bones:
- ✅ Impeccable safety architecture (`canPublish: false`, `neverAutoApply: true` at type level)
- ✅ Deep DONNA curriculum knowledge (12 levels, 8 intent families)
- ✅ Complete versioning and override model (three-layer: global → academy → overrides)
- ✅ Premium visual quality on the builder hub and map page
- ✅ Guided review experience
- ✅ Learning modules preview

But it has five critical gaps that prevent it from being a 10/10 director-grade curriculum command center:

1. **Voice curriculum drafting is not wired** — the #1 DONNA capability gap in the product
2. **Two competing hub pages** — navigation is genuinely confusing
3. **Advanced tools buried in a `<details>` collapse** — Explorer, Academy Version, Customization Assistant are discovery-dead
4. **Hardcoded false on setup checklist** — broken trust signal
5. **Mobile experience is severely limited** — DONNA absent, layouts not adapted

### Path to 10/10

| Sprint | Work | Score impact |
|---|---|---|
| 792 (Quick Wins) | Fix checklist, add Academy Version chip, navigable level tree, remove duplicate CTA | +5 points |
| 793 (Voice Unblock) | Wire `draft_curriculum_item`, ungate VoiceOverrideInputPanel | +8 points |
| 794 (IA Cleanup) | Surface advanced tools, clarify hub pages | +5 points |
| 795 (Mobile) | Mobile health bar, stacked level layout, mobile DONNA | +5 points |
| 796 (Coverage) | Full 12-dimension coverage report | +3 points |
| **Post-796 estimate** | | **~91/100** |

The gap from 91 to 100 requires production usage data, director feedback on the guided review experience, and the DONNA operating mode sprint (SC-4 — DONNA explains → DONNA operates + director approves).

---

## Score Summary

| Standard | Score | Status |
|---|---|---|
| AIQS | 74/100 | Passing — no hard fail conditions triggered |
| Curriculum Builder specific | 45/80 (56%) | Three gaps (voice input, mobile, workflow completeness) |
| Combined | ~65/100 | Solid architecture, significant UX and capability gaps |
| Edit Safety | 10/10 | Perfect — no regressions |
| Path to 10/10 | 4–5 targeted sprints | Achievable within current architecture |

**DONNA's curriculum capability sits at the right level of depth to support a 10/10 surface — the product needs to catch up to what DONNA already knows.**

---

## Files Changed in Sprint 791

- `docs/CURRICULUM_BUILDER_10_10_AUDIT_791.md` — this document
- `docs/CHANGELOG.md` — Sprint 791 entry

No code changes in Sprint 791. Audit-only sprint, as specified.
