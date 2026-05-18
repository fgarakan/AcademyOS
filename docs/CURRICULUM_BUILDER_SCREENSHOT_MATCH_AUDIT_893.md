# Curriculum Builder Screenshot Match Audit — Sprint 893

**Date:** 2026-05-18
**Purpose:** Audit the current Curriculum Builder implementation against the approved screenshot references.
**Scope:** Audit only. No code changes.

---

## 1. Route Inventory

### Current routes under `/director/curriculum/`

| Route | File | Status | Notes |
|---|---|---|---|
| `/director/curriculum` | `src/app/director/curriculum/page.tsx` | Built | Hub page with setup status, spine overview, checklist, CTA to builder |
| `/director/curriculum/builder` | `src/app/director/curriculum/builder/page.tsx` + `CurriculumSetupBuilder.tsx` | Built | DONNA welcome/intro page. Teal-accented hero, How It Works, pathway overview |
| `/director/curriculum/map` | `src/app/director/curriculum/map/page.tsx` | Built | Level map with lane sections, CurriculumLevelMap, search, data provenance label |
| `/director/curriculum/guided` | `src/app/director/curriculum/guided/page.tsx` | Built | Guided review shell with progress rail, level detail, keep/skip/modify controls |
| `/director/curriculum/level/[levelId]` | `src/app/director/curriculum/level/[levelId]/page.tsx` | Built | Level builder with 8 tabs, DonnaCurriculumContextPanel inline |
| `/director/curriculum/learning` | `src/app/director/curriculum/learning/page.tsx` | Built | Director-only learning module preview (read-only, not DB-persisted) |
| `/director/curriculum/academy-version` | `src/app/director/curriculum/academy-version/page.tsx` | Built | Academy curriculum version + override diff card |

### Routes referenced in sprint description that DO NOT EXIST

| Route from description | Does it exist? | What exists instead |
|---|---|---|
| `/director/curriculum/builder/map` | **NO** | `/director/curriculum/map` |
| `/director/curriculum/builder/guided` | **NO** | `/director/curriculum/guided` |
| `/director/curriculum/builder/jump` | **NO** | Jump is a modal inside `CurriculumSetupBuilder.tsx` and `CurriculumJumpToLevelModal` |
| `/director/curriculum/builder/levels/[levelId]` | **NO** | `/director/curriculum/level/[levelId]` |
| `/director/curriculum/builder/impact-preview` | **NO** | Component `CurriculumImpactPreviewPanel` exists but no standalone route |
| Add Drill route/page | **NO** | `DonnaAddDrillDraft` component renders inline in `CurriculumLevelBuilderShell` |
| Add Fitness route/page | **NO** | `DonnaAddFitnessExerciseDraft` component renders inline in `CurriculumLevelBuilderShell` |

**Route standardization gap:** The approved prototype uses `/director/curriculum/builder/` as the base for all sub-routes. The current implementation uses `/director/curriculum/` as the base. This creates a split that will need to be resolved before or during Sprint 894.

---

## 2. Components Inventory

### `src/components/curriculum/builder/`

| Component | What it does | Used in route |
|---|---|---|
| `CurriculumLevelMap.tsx` | Stage-grouped level cards (dots, gate/drill counts, status chip) | `/director/curriculum/map` |
| `CurriculumGuidedReviewShell.tsx` | Step-through guided review with progress, DONNA tips, keep/skip/modify | `/director/curriculum/guided` |
| `CurriculumProgressRail.tsx` | Progress bar + level dot indicators + reviewed count | `/director/curriculum/guided` |
| `CurriculumJumpToLevelModal.tsx` | Full-screen level jump overlay | `/director/curriculum/builder` modal, `/director/curriculum/guided` |
| `CurriculumLevelBuilderShell.tsx` | 8-tab level editor (overview/skills/drills/competition/fitness/gates/missions/language) | `/director/curriculum/level/[levelId]` |
| `DonnaCurriculumContextPanel.tsx` | Inline DONNA panel with gap analysis, quick action buttons | Inside `CurriculumLevelBuilderShell` |
| `DonnaAddDrillDraft.tsx` | Step 1 drill request textarea → submitted draft card | Inside `CurriculumLevelBuilderShell` (drills + skills tabs) |
| `DonnaAddFitnessExerciseDraft.tsx` | Step 1 fitness request textarea → submitted draft card | Inside `CurriculumLevelBuilderShell` (fitness tab) |
| `DonnaAddAssessmentGateDraft.tsx` | Step 1 gate request → submitted draft card | Inside `CurriculumLevelBuilderShell` (gates tab) |
| `DonnaAddPlayerMissionDraft.tsx` | Player mission draft request panel | Inside `CurriculumLevelBuilderShell` (missions tab) |
| `DonnaRewriteLevelDraft.tsx` | Level rewrite draft request | Inside `CurriculumLevelBuilderShell` (overview tab) |
| `DonnaConversationDraftPanel.tsx` | Conversation-style draft session panel | Not currently wired to a main route |
| `CurriculumImpactPreviewPanel.tsx` | Players/Levels/Rollout stat row + impact area list | Not currently wired to a standalone route |
| `CurriculumImpactScopeControls.tsx` | Scope selection buttons for curriculum changes | Not currently wired to a route |
| `CurriculumSectionCard.tsx` | Reusable section card with content slot | Utility component |
| `CurriculumSourceLabel.tsx` | Source/confidence label badges | Wired in curriculum explorer views |
| `CurriculumSufficiencyLabel.tsx` | Sufficiency status labels | Wired in some views |
| `CurriculumSufficiencyDashboard.tsx` | Sufficiency overview dashboard | Not currently on main builder routes |
| `CurriculumChangeQueue.tsx` | Change queue display (draft changes pending approval) | Not currently on main builder routes |
| `CurriculumBlockCompletionAudit.tsx` | Block completion audit panel | Not currently on main builder routes |
| `CurriculumBlockedState.tsx` | Blocked/error state display | Available for blocked states |
| `CurriculumFilters.tsx` | Filtering UI for curriculum lists | Available |
| `CurriculumSearch.tsx` | Search with jump-to capability | Used on `/director/curriculum/map` |
| `CurriculumRelationshipMap.tsx` | Relationship map between levels | Not on main builder routes |
| `CurriculumRelationshipMapNav.tsx` | Nav for relationship map | Used on `/director/curriculum/map` |
| `CurriculumAuditTrailPanel.tsx` | Audit trail display | Available |
| `CurriculumVersionHistoryPanel.tsx` | Version history display | Available |
| `CurriculumSetupState.tsx` | Setup state display | Available |
| `CurriculumReadOnlyBadge.tsx` | Read-only indicator badge | Available |
| `CurriculumEditPermissionGuard.tsx` | Edit permission guard wrapper | Available |
| `CurriculumCoachReadOnlyView.tsx` | Coach-facing read-only view | Available |
| `CurriculumBuilderWelcome.tsx` | DONNA welcome card for curriculum entry | `/director/curriculum` page |
| `CurriculumDraftSummaryPanel.tsx` | Draft summary display | Available |
| `CurriculumDraftCorrectionPanel.tsx` | Draft correction UI | Available |
| `CurriculumFlowQAChecklist.tsx` | QA checklist for flow | Available |
| `CurriculumKeyboardHintBar.tsx` | Keyboard shortcuts bar | Used in `CurriculumSetupBuilder` |
| `CurriculumAdvancedAdminLink.tsx` | Link to advanced admin | Available |
| `CurriculumLevelEmptyState.tsx` | Empty state for level | Available |
| `DonnaSafetyDisclosure.tsx` | Safety disclosure panel | Used in guided review and level builder |
| `DirectorCurriculumWidget.tsx` | Director curriculum summary widget | Available |
| `CoachCurriculumSuggestionPanel.tsx` | Coach suggestion panel | Available |

**Key finding:** Many components exist but are NOT wired into any current main builder routes. The gap is not missing components — it is missing page wiring and the right-side DONNA panel architecture.

---

## 3. Screenshot-by-Screenshot Comparison

---

### A. Curriculum Map Target

**Target spec:**
- Header: "Curriculum Map"
- Subtitle: "15 levels across 5 pathways · 8 need attention"
- Top action buttons: Jump to Level, Start Guided Review
- Stat cards: Total Levels, Ready, Need Attention, Last Updated
- Pathway sections: Red Ball, Orange Ball, Green Ball, Yellow Ball, High Performance
- Each section: 3 large level cards with readiness %, status, skills, drills, gates, missing items, updated time
- Right-side DONNA panel: "Where would you like to start today?", 4 action chips, Curriculum Health breakdown, bottom input

**Current at `/director/curriculum/map`:**

| Element | Exists? | Match? | Gap |
|---|---|---|---|
| Header "Curriculum Map" | ✓ | ✓ | — |
| Subtitle with level/pathway counts + attention count | ✓ | ✗ | Static text: "All levels at a glance. Click any level to explore…" — not dynamic with counts |
| Jump to Level button | ✗ | ✗ | No top-level action buttons at all |
| Start Guided Review button | ✗ | ✗ | Not present |
| Stat cards row (Total/Ready/Need Attention/Last Updated) | ✗ | ✗ | MISSING ENTIRELY |
| Pathway lane sections (5 stages) | ✓ | ✓ | CurriculumLevelMap renders all 5 stages |
| 3 level cards per pathway section | ✓ | Partial | Cards exist but are compact/small, not large |
| Level card: readiness percentage | ✗ | ✗ | Not present (only gate/drill counts) |
| Level card: status chip (Ready/Low/Missing) | ✓ | Partial | Exists but as text chip only, no visual weight |
| Level card: skills count | ✗ | ✗ | Not present |
| Level card: drills count | ✓ | ✓ | Present as font-mono number |
| Level card: gates count | ✓ | ✓ | Present as font-mono number |
| Level card: missing items list | ✗ | ✗ | Not present |
| Level card: updated time | ✗ | ✗ | Not present (no timestamp data) |
| Right-side DONNA panel | ✗ | ✗ | MISSING ENTIRELY — no panel architecture |

**Overall match: 3/13 elements match. Critical gaps: stat cards, DONNA right panel, action buttons, card richness.**

---

### B. Level Builder Target

**Target spec:**
- Header: "[Level name]" (e.g., "Orange Ball 2")
- Subtitle: "Level Builder · Tactical awareness & recovery movement"
- Top buttons: Preview Impact, Back to Review
- Summary row: Level Goal, Development Intent, Evidence for Level-Up (3 columns)
- Main grid: 5 section cards (Skill Path, Competition Path, Fitness Support, Assessment Gates, Player Missions)
- Each card: Ask DONNA button + "+ Add" button
- Right-side DONNA panel: "You're editing Orange Ball 2. What would you like to change?", 7 action chips

**Current at `/director/curriculum/level/[levelId]`:**

| Element | Exists? | Match? | Gap |
|---|---|---|---|
| Header with level name | ✓ | ✓ | `page-title` renders `level.display_name` |
| Subtitle "Level Builder · [tagline]" | ✗ | ✗ | Shows stage name + goal. "Level Builder" label absent |
| Preview Impact button (top) | ✗ | ✗ | Not present |
| Back to Review button (top) | ✗ | ✗ | Back arrow goes to `/map`, not `/guided` |
| 3-column summary row (Goal / Intent / Evidence) | ✗ | ✗ | Has 2-column grid (development intent + advancement requirements), different fields |
| Grid of 5 section cards | ✗ | ✗ | Uses 8-tab navigation, not a grid of cards |
| Skill Path card with Ask DONNA + Add | ✗ | ✗ | Skill Path exists as a tab, not a card |
| Competition Path card with Ask DONNA + Add | ✗ | ✗ | Competition exists as a tab, not a card |
| Fitness Support card with Ask DONNA + Add | ✗ | ✗ | Fitness exists as a tab, not a card |
| Assessment Gates card with Ask DONNA + Add | ✗ | ✗ | Gates exist as a tab, not a card |
| Player Missions card with Ask DONNA + Add | ✗ | ✗ | Missions exist as a tab, not a card |
| Right-side DONNA panel | ✗ | ✗ | `DonnaCurriculumContextPanel` is inline below content, not right-side; different content (gap analysis vs "You're editing…") |
| DONNA action chips (Add skill / drill / gate / fitness / mission / rewrite / skip) | ✗ | ✗ | Quick action buttons in `DonnaCurriculumContextPanel` do exist but as inline buttons, not right-panel chips |

**Overall match: 1/13 elements match. Critical gap: layout must shift from tab-based to card grid with right-side DONNA panel.**

---

### C. Impact Preview Target

**Target spec:**
- Header: "Impact Preview"
- Subtitle: "Review what will change before anything is applied"
- Change summary card (drill name, type, level)
- 4 counter chips: Will Update, Needs Review, Not Affected, Future
- 9 named impact category cards
- Bottom scope actions: Apply to this level only / Apply to all [level] groups / Apply academy-wide / Save as Draft / Cancel
- Right-side DONNA panel explaining impact and scope

**Current:**

| Element | Exists? | Match? | Gap |
|---|---|---|---|
| Standalone `/builder/impact-preview` route | ✗ | ✗ | No route exists |
| `CurriculumImpactPreviewPanel` component | ✓ | Partial | Has stat row (Players/Levels/Rollout) + impact areas list — not the same structure |
| Change summary card | ✗ | ✗ | Not in component |
| Counter chips (Will Update / Needs Review / Not Affected / Future) | ✗ | ✗ | Component has Players/Levels/Rollout — completely different metrics |
| 9 named impact category cards | Partial | Partial | Component has impact area list items (3 per change type), not 9 named categories |
| `CurriculumImpactScopeControls` component | ✓ | — | Exists but not wired into a route; has scope buttons |
| Bottom scope action buttons | ✗ | ✗ | Not on current route |
| Right-side DONNA panel | ✗ | ✗ | MISSING |

**Overall match: 0/7 layout elements match. Component exists but is structurally misaligned and has no route.**

---

### D. Add Drill Target

**Target spec:**
- Page header: "Add Drill"
- Subtitle: "DONNA will create a draft — nothing is applied until you approve"
- Request input card with "Add a drill for forehand recovery after wide balls." textarea + Generate button
- DONNA Draft card with: drill name, development intent, recommended level, pathways, duration, connected skills, assessment evidence, impact preview warning
- Right-side DONNA panel with suggested drill prompts

**Current `DonnaAddDrillDraft` component:**

| Element | Exists? | Match? | Gap |
|---|---|---|---|
| Page-level header "Add Drill" | ✗ | ✗ | Inline component only; header is "Ask DONNA to draft a drill for [level]" |
| Subtitle about draft safety | ✓ | Partial | "Nothing is added until you approve the draft" present but not as page subtitle |
| Request input textarea | ✓ | ✓ | Exists |
| "Generate" button label | ✗ | ✗ | Button says "Create draft" not "Generate" |
| DONNA Draft card with full structured fields | ✗ | ✗ | After submit, shows only: raw text snippet + "DONNA will structure this…" note. No actual drill name, intent, level, pathways, duration, skills, evidence |
| Impact preview warning in draft card | ✗ | ✗ | Not present |
| Right-side DONNA panel with suggested prompts | ✗ | ✗ | MISSING |
| Standalone route or modal page | ✗ | ✗ | Only inline within level builder tab |

**Overall match: 1/8 elements match. The component is a placeholder that accepts input but shows no structured DONNA output — the draft card is a stub.**

---

### E. Add Fitness Exercise Target

**Target spec:**
- Page header: "Add Fitness Exercise"
- Subtitle: "DONNA will create a draft — nothing is applied until you approve"
- Request input card with textarea + Generate button
- DONNA Draft card with: exercise name, pathway, tennis transfer, recommended levels, use before, curriculum connection chain, Approve and Add / Edit Draft / Add to Another Level / Cancel buttons
- Right-side DONNA panel with suggested fitness prompts

**Current `DonnaAddFitnessExerciseDraft` component:**

| Element | Exists? | Match? | Gap |
|---|---|---|---|
| Page-level header "Add Fitness Exercise" | ✗ | ✗ | Inline component with header "Ask DONNA to draft a fitness exercise for [level]" |
| Subtitle about draft safety | ✓ | Partial | Safety note present but not as page subtitle |
| Request input textarea | ✓ | ✓ | Exists |
| "Generate" button label | ✗ | ✗ | Button says "Create draft" not "Generate" |
| DONNA Draft card with structured fields | ✗ | ✗ | After submit, shows only raw text snippet + note. No exercise name, pathway, tennis transfer, etc. |
| Draft action buttons (Approve / Edit / Add to Another Level / Cancel) | ✗ | ✗ | Only "Done" button |
| Right-side DONNA panel with suggested fitness prompts | ✗ | ✗ | MISSING |
| Standalone route or modal page | ✗ | ✗ | Only inline within level builder fitness tab |

**Overall match: 1/8 elements match. Same structural gap as Add Drill — stub draft card, no right-side panel.**

---

### F. Guided Review Target

**Target spec:**
- Header: "Guided Review"
- Subtitle: "Reviewing Red Ball 1 · 1 of 15" (dynamic, updates as level changes)
- Top button: Jump to Level
- Progress rail: named pill buttons (R1, R2, R3, O1, O2, O3, G1, G2, G3, Y1, Y2, Y3, HP1, HP2, HP3)
- Main card: current level with full detail
- Action buttons: Keep as-is, Modify this level, Skip this level, Jump to another level, Ask DONNA to improve it
- Bottom nav: Start (disabled on first), 1/15 counter, [next level name]
- Right-side DONNA panel with review context and actions

**Current at `/director/curriculum/guided`:**

| Element | Exists? | Match? | Gap |
|---|---|---|---|
| Header "Guided Review" (page-level) | Partial | Partial | Page title is "Guided Level Review" not "Guided Review" |
| Dynamic subtitle "Reviewing [Level] · X of Y" | ✗ | ✗ | Static subtitle in page wrapper only; not updated dynamically |
| Jump to Level top button | ✗ | ✗ | Jump button is buried in progress rail, not a prominent top action |
| Progress rail: named pill buttons (R1, R2…) | ✗ | ✗ | `CurriculumProgressRail` uses small colored dots, not named pill buttons |
| Main level card with full detail | ✓ | ✓ | `CurriculumLevelDetailPanel` renders well |
| Keep as-is button | ✓ | ✓ | Present |
| Modify this level button | ✓ | ✓ | Present as link to `/director/curriculum/level/[id]` |
| Skip this level button | ✓ | ✓ | Present |
| Jump to another level button | ✓ | ✓ | Present (inline link, not top button) |
| Ask DONNA to improve it button | ✗ | ✗ | MISSING from action row |
| Bottom nav: Start (disabled) / counter / next level name | ✗ | ✗ | Has "Previous level" left link + "Jump to another level" right link — different pattern |
| Right-side DONNA panel | ✗ | ✗ | MISSING ENTIRELY |
| DONNA level-specific question/tip | ✓ | Partial | Inline DONNA tip exists but is per-stage, not a right-side panel |

**Overall match: 5/13 elements match. Core content is right; right-side DONNA panel, pill progress rail, dynamic subtitle, Ask DONNA button, and bottom nav pattern all missing.**

---

### G. DONNA Right-Side Curriculum Assistant Panel

**Target spec (appears on every page):**
- Fixed right column (~320px wide)
- DONNA header with Sparkles icon
- Contextual prompt (different per page)
- 4–7 contextual action chips
- Page-specific additional content (Curriculum Health on map, impact explanation on impact-preview, etc.)
- Bottom text input

**Current status:** This panel **does not exist anywhere** in the curriculum builder. There is no right-side DONNA panel on any curriculum page. The `DonnaCurriculumContextPanel` component renders inline within pages, not as a persistent right-side column.

**Gap:** The right-side DONNA panel is the single most impactful missing element across all 6 target pages. It requires:
1. A layout wrapper that creates a left main area + right DONNA sidebar
2. A `DonnaCurriculumSidePanel` component that accepts contextual props
3. All 6 curriculum builder pages to be rebuilt inside this layout

---

### H. Draft / Approve / Review-First Workflow

**Target spec:**
- DONNA creates draft → director sees structured preview → approve/edit/cancel
- Review queue receives the approved draft
- No curriculum mutation until director approves

**Current status:**
- ✓ `proposed_actions` pipeline exists and is the correct path
- ✓ Review Queue at `/director/review` accepts curriculum builder drafts
- ✓ `DonnaAddDrillDraft` → queues to review on submit (simulated — no real AI call)
- ✓ `DonnaAddFitnessExerciseDraft` → same pattern
- ✗ Draft cards do not show structured DONNA output (stub text only)
- ✗ No "Approve and Add" button wired to actual server action on draft cards
- ✓ Safety disclosure present on all draft panels
- ✓ `CurriculumBuilderDraftCard.tsx` in review queue (can display curriculum builder drafts)

**Overall: Pipeline is architecturally correct but draft card output is not structured (no real DONNA generation).**

---

## 4. What Exists and Matches

1. **Page titles** — Curriculum Map header ✓, Level name in level builder header ✓
2. **Pathway/stage sections on map** — 5 color-coded lane sections render correctly
3. **Level cards on map** — cards with status dots and count badges exist (compact form)
4. **Gate and drill counts** per level card ✓
5. **Level content in guided review** — `CurriculumLevelDetailPanel` renders gate, drill, fitness, competition data
6. **Keep as-is / Modify / Skip / Jump** — action buttons in guided review ✓
7. **Progress bar and reviewed count** in progress rail ✓
8. **DONNA inline tips per stage** in guided review ✓
9. **Draft → review pipeline** — correct architecture ✓
10. **Safety disclosures** — present on all draft panels ✓
11. **Tab-based level content** — all 8 tabs (overview/skills/drills/competition/fitness/gates/missions/language) render level data

---

## 5. What Exists but Is Visually Wrong

1. **Curriculum Map subtitle** — static text instead of dynamic "15 levels · 8 need attention"
2. **Level cards** — compact design, missing readiness %, skills count, missing items, updated time
3. **Level Builder layout** — tab-based instead of card grid with Per-section Ask DONNA + Add buttons
4. **Level Builder subtitle** — shows stage name + goal instead of "Level Builder · [tagline]"
5. **Level Builder back button** — links to `/map` instead of `/guided`
6. **Level Builder summary row** — 2-column (intent + advancement) instead of 3-column (Goal / Intent / Evidence)
7. **DonnaCurriculumContextPanel** — renders inline below level content instead of as right-side panel; shows gap analysis and quick-action buttons instead of conversational "You're editing…" prompt with contextual chips
8. **Guided Review title** — "Guided Level Review" not "Guided Review"
9. **Progress rail** — colored dots not named pill buttons (R1, R2, R3…)
10. **Guided Review bottom nav** — "Previous level" + "Jump" instead of [Start disabled] / [counter] / [Next level name]
11. **CurriculumImpactPreviewPanel** — Players/Levels/Rollout stats instead of Will Update/Needs Review/Not Affected/Future; no scope controls
12. **DonnaAddDrillDraft** — "Create draft" button instead of "Generate"; no structured DONNA output card
13. **DonnaAddFitnessExerciseDraft** — same issues as drill draft

---

## 6. What Exists but Is NOT Wired into a Route

| Component | Not yet routed | Should be on |
|---|---|---|
| `CurriculumImpactPreviewPanel` | No standalone page | `/director/curriculum/builder/impact-preview` |
| `CurriculumImpactScopeControls` | Not wired | Impact preview page |
| `DonnaConversationDraftPanel` | Not wired to main flows | Level builder right panel |
| `CurriculumSufficiencyDashboard` | Not on any route | Curriculum map page |
| `CurriculumChangeQueue` | Not on any route | Level builder or builder home |
| `CurriculumBlockCompletionAudit` | Not on any route | Available for sprint 894+ |
| `CurriculumRelationshipMap` | On `/curriculum/map` but buried | Consider surface-level exposure |

---

## 7. What Is Missing Entirely

1. **Right-side DONNA assistant panel** — No layout, no component, not on any page
2. **Standalone Impact Preview page** — No route at `/director/curriculum/builder/impact-preview`
3. **Curriculum Map stat cards** — Total Levels, Ready, Need Attention, Last Updated
4. **Curriculum Map action buttons** — Jump to Level, Start Guided Review as top-level buttons
5. **Structured DONNA draft output** — Draft cards show only raw text snippet, not structured name/intent/level/duration/skills/evidence
6. **Add Drill as standalone page** — Currently inline component only
7. **Add Fitness Exercise as standalone page** — Currently inline component only
8. **Level Builder card grid layout** — 5-card grid replacing current 8-tab layout
9. **Level Builder top action buttons** — Preview Impact, Back to Review
10. **Level Builder 3-column summary row** — Level Goal + Development Intent + Evidence for Level-Up
11. **Guided Review dynamic subtitle** — "Reviewing [Level] · X of Y"
12. **Guided Review pill-based progress rail** — Named abbreviation pills (R1, R2, etc.)
13. **Guided Review "Ask DONNA to improve it" button**
14. **Guided Review 3-part bottom nav** — [Start/Back disabled] + [X/15] + [Next level name button]

---

## 8. Route Standardization Recommendation

**Current vs. target route structure:**

| Current | Target (from screenshot spec) | Recommendation |
|---|---|---|
| `/director/curriculum/builder` | `/director/curriculum/builder` | Keep. This is the entry/welcome page. |
| `/director/curriculum/map` | `/director/curriculum/builder/map` | **Move.** Create `/director/curriculum/builder/map/page.tsx` and redirect or replace `/curriculum/map` |
| `/director/curriculum/guided` | `/director/curriculum/builder/guided` | **Move.** Create `/director/curriculum/builder/guided/page.tsx` and redirect |
| `/director/curriculum/level/[levelId]` | `/director/curriculum/builder/levels/[levelId]` | **Move.** Create `/director/curriculum/builder/levels/[levelId]/page.tsx` |
| *(does not exist)* | `/director/curriculum/builder/impact-preview` | **Create.** New standalone route |
| *(does not exist)* | `/director/curriculum/builder/add-drill` | **Create.** Or handle as modal from level builder |
| *(does not exist)* | `/director/curriculum/builder/add-fitness` | **Create.** Or handle as modal from level builder |

**Recommendation:** Keep existing `/curriculum/map` and `/curriculum/guided` and `/curriculum/level/[id]` routes alive (they already have incoming links). Add new `/builder/...` parallel routes that render the same or improved pages. In sprint 904, once builder routes are stable, the old routes can redirect to the new builder paths.

---

## 9. Sprint Plan for 894–905

### Sprint 894 — Curriculum Builder Layout Shell + Right-Side DONNA Panel

**Goal:** Create the layout wrapper that all curriculum builder pages will use. A `CurriculumBuilderLayout` component (or sub-layout) that renders a 2-column layout: main area (left, flex-1) + DONNA sidebar (right, ~320px, sticky).

**Files:**
- Create `src/components/curriculum/builder/CurriculumBuilderPageShell.tsx` — 2-column layout: main slot + right DONNA slot. Props: `donnaContext: 'map' | 'level' | 'guided' | 'impact' | 'add-drill' | 'add-fitness'`, `levelName?: string`
- Create `src/components/curriculum/builder/DonnaCurriculumSidePanel.tsx` — Right-side DONNA panel: header with Sparkles, contextual prompt, 4–7 action chips (contextual by `donnaContext`), optional health breakdown (for map), bottom input bar

**No migrations. No DB changes.**

---

### Sprint 895 — Curriculum Map Page Rebuild

**Goal:** Rebuild `/director/curriculum/map` to match the screenshot.

**Files:**
- Modify `src/app/director/curriculum/map/page.tsx` — Wrap content in `CurriculumBuilderPageShell` with DONNA map context. Add dynamic subtitle "X levels across Y pathways · Z need attention". Add top action buttons (Jump to Level, Start Guided Review). Add stat cards row (Total Levels, Ready, Need Attention, Last Updated).
- Modify `src/components/curriculum/builder/CurriculumLevelMap.tsx` — Make level cards larger with readiness %, missing items display.

**No migrations. No DB changes.**

---

### Sprint 896 — Level Builder Layout Rebuild

**Goal:** Replace the tab-based layout in the Level Builder with the screenshot's card-grid pattern.

**Files:**
- Modify `src/app/director/curriculum/level/[levelId]/page.tsx` — Add "Level Builder" subtitle format, "Preview Impact" and "Back to Review" top buttons. Wrap in `CurriculumBuilderPageShell` with level DONNA context.
- Modify `src/components/curriculum/builder/CurriculumLevelBuilderShell.tsx` — Replace 8-tab navigation with 5-card grid layout (Skill Path / Competition Path / Fitness Support / Assessment Gates / Player Missions). Each card gets Ask DONNA + "+ Add" buttons. Tabs content is preserved but reorganized. Add 3-column summary row.

**No migrations. No DB changes.**

---

### Sprint 897 — Level Builder DONNA Right Panel Wiring

**Goal:** Wire `DonnaCurriculumSidePanel` into the Level Builder with correct content. Replace inline `DonnaCurriculumContextPanel` with the right-side panel.

**Files:**
- Modify `src/components/curriculum/builder/CurriculumLevelBuilderShell.tsx` — Remove inline `DonnaCurriculumContextPanel`. The right-side DONNA panel (from `CurriculumBuilderPageShell`) handles all DONNA interaction.
- Modify `src/components/curriculum/builder/DonnaCurriculumContextPanel.tsx` — Refactor to provide right-panel props shape instead of standalone render.
- Modify `src/components/curriculum/builder/DonnaCurriculumSidePanel.tsx` — Add level-specific chips (Add a skill / Add a drill / Add an assessment gate / Add a fitness exercise / Add a player mission / Rewrite this level / Skip to another level).

**No migrations. No DB changes.**

---

### Sprint 898 — Impact Preview Page

**Goal:** Create standalone Impact Preview page at `/director/curriculum/builder/impact-preview`.

**Files:**
- Create `src/app/director/curriculum/builder/impact-preview/page.tsx` — New page that wraps `CurriculumBuilderPageShell` with impact context.
- Modify `src/components/curriculum/builder/CurriculumImpactPreviewPanel.tsx` — Rebuild to match screenshot: change summary card, 4 counter chips (Will Update / Needs Review / Not Affected / Future), 9 named impact category cards.
- Wire `CurriculumImpactScopeControls.tsx` into the impact preview page bottom area (scope action buttons: Apply to this level only / Apply to all X groups / Apply academy-wide / Save as Draft / Cancel).

**No migrations. No DB changes.**

---

### Sprint 899 — Add Drill Page Rebuild

**Goal:** Rebuild DonnaAddDrillDraft to match the screenshot. Create standalone page or properly designed modal.

**Files:**
- Modify `src/components/curriculum/builder/DonnaAddDrillDraft.tsx` — Change "Create draft" → "Generate". After submit, show a structured DONNA Draft card with all fields: drill name (computed from input), development intent, recommended level, pathways, duration, connected skills, assessment evidence, impact preview warning.
- Optionally create `src/app/director/curriculum/builder/add-drill/page.tsx` if standalone page is preferred over modal.

**No migrations. No DB changes.**

---

### Sprint 900 — Add Fitness Exercise Page Rebuild

**Goal:** Rebuild DonnaAddFitnessExerciseDraft to match the screenshot.

**Files:**
- Modify `src/components/curriculum/builder/DonnaAddFitnessExerciseDraft.tsx` — Change "Create draft" → "Generate". After submit, show structured draft card with exercise name, pathway, tennis transfer, recommended levels, use before, curriculum connection chain. Add Approve and Add / Edit Draft / Add to Another Level / Cancel buttons.

**No migrations. No DB changes.**

---

### Sprint 901 — Guided Review Page Rebuild

**Goal:** Rebuild guided review to match the screenshot.

**Files:**
- Modify `src/app/director/curriculum/guided/page.tsx` — Wrap in `CurriculumBuilderPageShell` with guided DONNA context. Change title to "Guided Review". Add dynamic subtitle "Reviewing [level] · X of Y".
- Modify `src/components/curriculum/builder/CurriculumGuidedReviewShell.tsx` — Add "Ask DONNA to improve it" button. Change bottom nav to 3-part pattern: [Start/Back disabled → active] / [X/Y counter] / [Next Level Name →]. Expose "Jump to Level" as top-level button.
- Modify `src/components/curriculum/builder/CurriculumProgressRail.tsx` — Replace dot indicators with named pill buttons (abbreviated: R1, R2, R3, O1, O2, O3, G1, G2, G3, Y1, Y2, Y3, HP1, HP2, HP3) colored by stage.

**No migrations. No DB changes.**

---

### Sprint 902 — Builder Sub-Route Migration

**Goal:** Create `/director/curriculum/builder/map`, `/builder/guided`, `/builder/levels/[levelId]` routes that mirror the rebuilt pages under the `/builder/` namespace.

**Files:**
- Create `src/app/director/curriculum/builder/map/page.tsx` — Re-export or render `CurriculumMapPage` logic
- Create `src/app/director/curriculum/builder/guided/page.tsx` — Re-export or render `CurriculumGuidedPage` logic
- Create `src/app/director/curriculum/builder/levels/[levelId]/page.tsx` — Re-export or render `CurriculumLevelPage` logic
- Update all internal links (from `CurriculumSetupBuilder.tsx`, back buttons, navigation) to use `/builder/...` paths

**No migrations. No DB changes.**

---

### Sprint 903 — Curriculum Map DONNA Panel Wiring

**Goal:** Wire the Curriculum Map page DONNA panel with correct context (Curriculum Health breakdown + "Where would you like to start today?" + 4 chips).

**Files:**
- Modify `src/components/curriculum/builder/DonnaCurriculumSidePanel.tsx` — Add 'map' context: shows "Where would you like to start today?", 4 chips (Start from Red Ball 1 / Jump to Orange Ball 2 / Review only incomplete levels / Help me customize this curriculum), Curriculum Health breakdown (levels ready, levels needing attention, last updated).
- Modify `src/app/director/curriculum/map/page.tsx` — Pass health stats (ready count, need-attention count) to DONNA panel.

**No migrations. No DB changes.**

---

### Sprint 904 — Polish Pass + Navigation Audit

**Goal:** Full navigation audit, broken link fixes, mobile layout check. Ensure every page-to-page link is correct and no dead ends exist.

**Files:**
- Audit and fix all `href` values in curriculum builder pages and components
- Fix Sidebar nav link (currently `/director/curriculum/builder` — verify still correct)
- Confirm all back-button links point to the right parent

**No migrations. No DB changes.**

---

### Sprint 905 — Full Flow QA + Demo Readiness

**Goal:** End-to-end QA of the curriculum builder flow from builder entry → map → level → guided review → impact preview → drill/fitness add → review queue. Verify Brian-facing demo path works cleanly.

**Deliverable:** `docs/CURRICULUM_BUILDER_DEMO_FLOW_QA_905.md`

---

## 10. Whether 843–892 Work Should Be Reused, Moved, or Replaced

### Reuse (keep as-is):

- **`CurriculumSetupBuilder.tsx` (Sprint 841)** — The DONNA hero welcome page matches the spirit of the builder entry. Keep it.
- **All 8 tab content implementations in `CurriculumLevelBuilderShell`** — The content is correct; only the layout (tabs → card grid) changes.
- **`CurriculumGuidedReviewShell.tsx`** — Core logic (step through, reviewed state, skip, DONNA tips) is solid. Needs layout updates only.
- **`CurriculumProgressRail.tsx`** — Replace dots with pill buttons; keep logic.
- **`CurriculumJumpToLevelModal.tsx`** — Keep as-is.
- **`DonnaCurriculumContextPanel.tsx`** — Refactor to feed the new right-side panel.
- **`DonnaAddDrillDraft.tsx`** — Keep textarea + submit logic; replace draft output card.
- **`DonnaAddFitnessExerciseDraft.tsx`** — Same as drill.
- **`DonnaAddAssessmentGateDraft.tsx`** — Keep.
- **`DonnaSafetyDisclosure.tsx`** — Keep.
- **`CurriculumImpactPreviewPanel.tsx`** — Rebuild interior, keep component shell.
- **`CurriculumImpactScopeControls.tsx`** — Keep and wire in.

### Move:

- `/director/curriculum/map`, `/director/curriculum/guided`, `/director/curriculum/level/[levelId]` content should be mirrored under `/director/curriculum/builder/...` in Sprint 902. Old routes can stay alive to avoid broken links from external references.

### Replace:

- **`CurriculumLevelBuilderShell.tsx` layout** — The tab pattern must be replaced with the 5-card grid. Content of tabs is preserved but surfaced as cards.
- **`CurriculumLevelMap.tsx` level cards** — Cards need to be larger and richer (readiness %, missing items, updated time).
- **`CurriculumProgressRail.tsx` dots → pills** — Visual replacement of the dot indicators.

---

## Summary

| Category | Count |
|---|---|
| Elements that match the screenshot | ~15 out of ~65 audited |
| Pages with DONNA right panel | 0 of 6 target pages |
| Standalone routes missing | 5 (builder/map, builder/guided, builder/levels/[id], builder/impact-preview, add-drill page) |
| Components existing but not wired | 7 |
| Layout pattern mismatches | 2 (tab-based level builder; dot-based progress rail) |
| Sprints needed to close all gaps | 894–905 (12 sprints) |

The largest single gap is the **right-side DONNA panel architecture**, which must be built first (Sprint 894) since it is required by all subsequent page rebuilds.
