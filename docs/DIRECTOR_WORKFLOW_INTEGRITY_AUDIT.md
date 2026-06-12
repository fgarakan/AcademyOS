# Director Workflow Integrity Audit V1

**Sprint 2140C**
**Date: 2026-06-12**
**Scope: All director-facing workflows**
**Method: Code inspection + git history. No speculation.**
**Status: AUDIT ONLY — no code changed**

---

## Summary

Seven workflow domains have duplication. Eleven wrong navigation links were identified across Today setup steps, DONNA engine files, and legacy components. Seven dead routes exist. Feature development should not resume until the canonical path for each workflow is confirmed and the wrong links are corrected.

---

## How To Read This Document

For each workflow, the answers follow this structure:

1. **Canonical path** — the version that should survive
2. **Legacy path** — the version to be deprecated
3. **Which should survive**
4. **Which should be deprecated**
5. **Navigation links pointing to the wrong version**
6. **Today actions pointing to the wrong version**
7. **DONNA actions pointing to the wrong version**

---

## Workflow 1 — Today / Director Dashboard

### 1. Canonical path

`/director` → `src/app/director/page.tsx` (664 lines)

Current Fable Mission Control. Implements Sprint 2051–2140 architecture: `DonnaCommandBrief`, `DonnaQuickActions`, `DirectorDecisionCenter`, `DonnaAlertsAndMomentum`, `WhatChangedPanel`, `WhatCanWaitPanel`, `DonnaCOOPanel`. Real Supabase data. No demo mode.

### 2. Legacy path

`/director/today` → `src/app/director/today/page.tsx` (631 lines)

Pre-Fable command center. Uses `isDemoMode()` from `src/lib/donna/cooDemo.ts`, `DEMO_SESSIONS`, `DEMO_COMMAND_BRIEF_DATA`, `DEMO_PLAYER_ATTENTION_RISK`, and `loadCommandBriefLive`. Renders `TodayCommandBrief`, `DonnaTodayBriefPanel`, `TodayDonnaSuggestionChip`. Entirely superseded by `src/app/director/page.tsx`.

### 3. Which should survive

`/director`

### 4. Which should be deprecated

`/director/today`

### 5. Navigation links pointing to the wrong version

None — `/director/today` is not in the sidebar.

### 6. Today actions pointing to the wrong version

None — the setup card does not link to `/director/today`.

### 7. DONNA actions pointing to the wrong version

| File | Line | Wrong link | Should be |
|---|---|---|---|
| `src/lib/donna/donnaInsightEngine.ts` | 154 | `/director/today` | `/director` |
| `src/lib/donna/donnaQuickActions.ts` | 51 | `/director/today` | `/director` |
| `src/lib/donna/briefings/directorBriefing.ts` | 44 | `/director/today` | `/director` |

**Additional wrong links (not DONNA, but in legacy components):**

| File | Line | Wrong link | Should be |
|---|---|---|---|
| `src/app/director/_components/AcademyHealthBreakdown.tsx` | 251 | `/director/today` | `/director` |
| `src/app/director/sessions/page.tsx` | 116 | `/director/today` | `/director` |

---

## Workflow 2 — Class Templates

### 1. Canonical path

`/director/class-templates` → `src/app/director/class-templates/page.tsx`

Real Supabase data only. No mock fallback. Direct `templates` table query with `academy_id` scoping. List, detail, and builder all use live data.

Sub-routes:
- `/director/class-templates` — list (`src/app/director/class-templates/page.tsx`)
- `/director/class-templates/[templateId]` — detail + builder (`src/app/director/class-templates/[templateId]/page.tsx`)
- `/director/class-templates/new` — create form (`src/app/director/class-templates/new/page.tsx`)

Create action: `createClassTemplateWithBlocksAction` in `src/app/director/class-templates/createClassTemplateWithBlocksAction.ts`.

**Architecture note:** `createClassTemplateWithBlocksAction` performs a direct database write. It does not go through the `proposed_actions` pipeline. This is a deviation from the "AI proposes → Director approves → System records → System executes" model. The legacy tree (below) routes through `proposed_actions`. This conflict must be resolved before either path is declared canonical.

### 2. Legacy path

`/director/templates/class` → `src/app/director/templates/class/page.tsx`

Uses `DEMO_CLASS_TEMPLATES` from `src/lib/templates/templateMockData.ts` as default. Overlays live data when available (`dataSource === 'live'`). Template detail pages use the same demo-first pattern.

Sub-routes:
- `/director/templates/class` — list with demo fallback
- `/director/templates/class/[templateId]` — detail with demo fallback
- `/director/templates/class/create` — 5-step wizard

Create action: `saveClassTemplateDraftFromWizardAction` in `src/lib/actions/templateDraftAction.ts` → routes through `proposed_actions` pipeline.

Also part of this tree: `/director/templates` hub page (`src/app/director/templates/page.tsx`), which links to both class and fitness create flows at the `/director/templates/*` paths.

### 3. Which should survive

`/director/class-templates` — pending resolution of the pipeline conflict noted above.

### 4. Which should be deprecated

`/director/templates/class` and `/director/templates/class/create` and `/director/templates/class/[templateId]`.

The hub `/director/templates` contains useful UI (stats, DONNA panel, action cards) but routes to the wrong sub-paths. It should be deprecated or redirected to the canonical tree after the pipeline question is resolved.

### 5. Navigation links pointing to the wrong version

None — neither tree is in the sidebar.

### 6. Today actions pointing to the wrong version

| File | Line | Wrong link | Should be |
|---|---|---|---|
| `src/lib/donna/today/todayBriefEngine.ts` | 87 | `/director/templates` (Tree 1 hub) | `/director/class-templates` |

This is the setup step "Session templates created" — it sends new directors to the demo-data tree.

### 7. DONNA actions pointing to the wrong version

DONNA dispatcher correctly points to `/director/class-templates` (Tree 2). No wrong links in DONNA.

---

## Workflow 3 — Fitness Templates

### 1. Canonical path

`/director/fitness/templates` → `src/app/director/fitness/templates/page.tsx`

Real Supabase data only. Filters by `fitness_template:true` tag. Full builder including `FitnessBuilderStepper`, `TemplateEditor`, `GenerateSessionPanel`.

Sub-routes:
- `/director/fitness/templates` — list
- `/director/fitness/templates/[templateId]` — detail + builder
- `/director/fitness/templates/new` — create form

Create action: `src/app/director/fitness/fitnessTemplateActions.ts` — direct database write, does not go through `proposed_actions`. Same pipeline conflict as class templates.

### 2. Legacy path

`/director/templates/fitness` → `src/app/director/templates/fitness/page.tsx`

Uses `DEMO_FITNESS_TEMPLATES` from `src/lib/templates/templateMockData.ts` as fallback. Same demo-overlay pattern as class templates legacy tree.

Sub-routes:
- `/director/templates/fitness` — list with demo fallback
- `/director/templates/fitness/[templateId]` — detail with demo fallback
- `/director/templates/fitness/create` — wizard → `saveClassTemplateDraftFromWizardAction` → `proposed_actions`

### 3. Which should survive

`/director/fitness/templates` — pending resolution of the pipeline conflict.

### 4. Which should be deprecated

`/director/templates/fitness` and `/director/templates/fitness/create` and `/director/templates/fitness/[templateId]`.

### 5. Navigation links pointing to the wrong version

None — neither is in the sidebar.

### 6. Today actions pointing to the wrong version

None directly. The setup step "Session templates created" links to `/director/templates` (Tree 1 hub), which links to `/director/templates/fitness/create` (wrong tree). Fixing the setup step to point to `/director/class-templates` (canonical class tree) resolves this indirectly; fitness templates have a separate entry point.

### 7. DONNA actions pointing to the wrong version

DONNA dispatcher correctly points to `/director/fitness/templates`. No wrong links in DONNA.

---

## Workflow 4 — Director Onboarding (Academy Setup)

### 1. Canonical path

`/director/onboarding` + sub-routes → DONNA-guided setup

Entry: `src/app/director/onboarding/page.tsx` → renders `AcademyDnaLanding`

Sub-routes:
- `/director/onboarding/interview` — Director interview (academy profile + DNA)
- `/director/onboarding/curriculum` → `CurriculumSetupBuilder`
- `/director/onboarding/level-gates` — Level gate configuration
- `/director/onboarding/programs-groups` — Programs + groups
- `/director/onboarding/coaches-permissions` — Coach roles
- `/director/onboarding/players-placement` → `PlayersPlacementForm`

In sidebar `SYSTEM_ITEMS`: "Onboarding" → `/director/onboarding` ✓

### 2. Legacy path

`/director/setup` → `src/app/director/setup/page.tsx`

12-step static checklist UI. Uses `AnimatedOnboardingDeck` from `../onboarding/`. Steps 1–9 have `href` + `ctaLabel`; steps 10–12 ("Session Templates", "Demo Week", "Launch Checklist") have no `href` — their CTAs are inert. Not linked from sidebar or Today. Ends with link to `/director`.

### 3. Which should survive

`/director/onboarding` (DONNA-guided flow).

### 4. Which should be deprecated

`/director/setup` (12-step checklist).

### 5. Navigation links pointing to the wrong version

None — `/director/setup` is not in the sidebar.

### 6. Today actions pointing to the wrong version

| File | Line | Wrong link | Should be |
|---|---|---|---|
| `src/lib/donna/today/todayBriefEngine.ts` | 75 | `/onboarding` | `/director/onboarding` |

The setup step "Academy identity set up" links to `/onboarding` — the root-level generic onboarding route (`src/app/onboarding/page.tsx`), not the director-specific DONNA guided flow at `/director/onboarding`. This is a broken link for a director.

### 7. DONNA actions pointing to the wrong version

No wrong links in DONNA dispatcher — it correctly routes onboarding queries to `/director/onboarding`.

---

## Workflow 5 — Review / Approval

### 1. Canonical path

`/director/review` → `src/app/director/review/page.tsx`

4-tab interface: Needs Approval / Player Signals / Sessions & Curriculum / Done. Reads from `proposed_actions` table. All AI-generated drafts, voice intakes, wrap-up reviews, placement decisions, and curriculum overrides flow here.

Sub-route: `/director/review/[actionId]` — single action detail.

In sidebar `ACADEMY_ITEMS`: "Approvals" → `/director/review` ✓

### 2. Legacy paths (two parallel approval surfaces)

**Path A — AI Suggestions:**
`/director/ai-suggestions` → `src/app/director/ai-suggestions/page.tsx`

Reads from `academy_suggestions` table (not `proposed_actions`). Has its own accept/deny/defer/generate actions. Does not share state with the main review queue. Not in sidebar. The `FABLE_SCREEN_PRIORITY_MAP.md` notes: "Surfaced inline now — may be redundant."

**Path B — Alerts:**
`/director/alerts` → `src/app/director/alerts/page.tsx` (362 lines)

Reads from live Supabase views (`v_player_summary`, `v_academy_priority_queue`, `sessions`, `v_reassessment_pipeline`, `private_lesson_requests`). Applies static alert rules per category. Renders alert items with severity. Not connected to `proposed_actions`. Not in sidebar. Has no approval mechanism.

### 3. Which should survive

`/director/review` for all approval actions.

`/director/alerts` content should either be absorbed into the `DonnaAlertsAndMomentum` component on Today (which already surfaces alerts from the attention engine) or merged into a signals sub-tab on `/director/review`.

`/director/ai-suggestions` is a candidate for deprecation if its suggestion types are covered by the `proposed_actions` pipeline.

### 4. Which should be deprecated

`/director/ai-suggestions` (pending confirmation that all suggestion types are covered by `proposed_actions`).

`/director/alerts` (pending merge of alert logic into `DonnaAlertsAndMomentum` or a review queue sub-tab).

### 5. Navigation links pointing to the wrong version

None — neither `/director/ai-suggestions` nor `/director/alerts` is in the sidebar.

### 6. Today actions pointing to the wrong version

None directly. `DonnaAlertsAndMomentum` on Today already surfaces alerts from the attention engine. The alerts page is not referenced from Today.

### 7. DONNA actions pointing to the wrong version

DONNA dispatcher routes all review/approval queries to `/director/review`. No wrong links.

---

## Workflow 6 — Player Intake / Creation

### 1. Canonical paths (three distinct intents — not duplicates)

These three routes serve genuinely different intents and are not duplicates:

| Route | File | Intent |
|---|---|---|
| `/director/players/new` | `src/app/director/players/new/page.tsx` | Add a single new player manually |
| `/director/players/import` | `src/app/director/players/import/page.tsx` | Bulk CSV import |
| `/director/placement` | `src/app/director/placement/page.tsx` | Review pending/unplaced players, run Placement Engine |

### 2. Overlap worth noting

`/director/onboarding/players-placement` (`src/app/director/onboarding/players-placement/page.tsx`) uses `PlayersPlacementForm` — a setup-phase variant of placement. It serves the same functional intent as `/director/placement` but is scoped to the initial onboarding wizard. Once an academy is live, this route is only reachable via the onboarding flow.

This is not a canonical/legacy conflict — it is a context split. However, if the placement logic diverges between the two forms, that is a maintenance risk.

### 3. Which should survive

All three canonical routes survive. The onboarding variant (`/director/onboarding/players-placement`) survives as part of the onboarding wizard only.

### 4. Which should be deprecated

None — but `PlayersPlacementForm` and `PlacementEngineClient` should be verified to share logic.

### 5–7. Wrong navigation links

None identified.

---

## Workflow 7 — Attention Queue

### 1. Canonical path (contested)

`/director/review` — the review queue is the canonical approval surface. `DonnaAlertsAndMomentum` on Today surfaces the top alerts inline.

### 2. Legacy path

`/director/attention` → `src/app/director/attention/page.tsx`

Full page with real Supabase queries. Filterable by: `all`, `players`, `reassessment`, `parent-updates`, `placements`, `onboarding`, `coach`. Uses `buildAttentionItems`, `AttentionQueueClient`, `DonnaScreenBriefStatic`. Functional and live.

Per `FABLE_SCREEN_PRIORITY_MAP.md`: "superseded by attention queue in review flow."

### 3. Which should survive

To be decided. Options:
- Merge `/director/attention` filter logic into a tab on `/director/review`
- Keep as a secondary surface (Tier 3) for director drill-down
- Delete after confirming all filter views are replicated in the review queue

### 4. Which should be deprecated

`/director/attention` — after its filter views are confirmed present in `/director/review`.

### 5. Navigation links pointing to the wrong version

None — `/director/attention` is not in the sidebar.

### 6. Today actions pointing to the wrong version

None.

### 7. DONNA actions pointing to the wrong version

| File | Line | Current link | Status |
|---|---|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | 108 | `/director/attention?filter=*` | DONNA navigates here for "who needs attention" — routes to deprecated page |

DONNA dispatcher sends "who needs attention" queries to `/director/attention` with filter parameters. If that page is deprecated without a replacement route, these DONNA commands break.

---

## Dead Routes

Routes that exist in the codebase but are not reachable from any nav, sidebar, Today action, or DONNA navigation.

| Route | File | Notes |
|---|---|---|
| `/director/improvement` | `src/app/director/improvement/page.tsx` | Purpose unclear. No inbound links. |
| `/director/donna-analytics` | `src/app/director/donna-analytics/page.tsx` | Analytics stub. No inbound links. |
| `/director/donna-coo-demo` | `src/app/director/donna-coo-demo/page.tsx` | Demo/dev only. No inbound links. |
| `/director/command-center` | `src/app/director/command-center/page.tsx` | Legacy platform-owner route. Superseded by Today. |
| `/director/friction` | `src/app/director/friction/` (directory only) | No `page.tsx`. Empty directory. |
| `/director/capture` | `src/app/director/capture/` (directory only) | No `page.tsx`. Empty directory. |
| `/director/private-lessons` | `src/app/director/private-lessons/page.tsx` | Feature exists, no sidebar link. |

`/director/today` is separately documented under Workflow 1 — it has inbound links from DONNA files (all wrong).

---

## Wrong Navigation Links — Consolidated

All wrong navigation links found across the codebase, by file:

| File | Line | Wrong link | Correct link | Workflow |
|---|---|---|---|---|
| `src/lib/donna/today/todayBriefEngine.ts` | 75 | `/onboarding` | `/director/onboarding` | Onboarding |
| `src/lib/donna/today/todayBriefEngine.ts` | 87 | `/director/templates` | `/director/class-templates` | Templates |
| `src/lib/donna/donnaInsightEngine.ts` | 154 | `/director/today` | `/director` | Dashboard |
| `src/lib/donna/donnaQuickActions.ts` | 51 | `/director/today` | `/director` | Dashboard |
| `src/lib/donna/briefings/directorBriefing.ts` | 44 | `/director/today` | `/director` | Dashboard |
| `src/app/director/_components/AcademyHealthBreakdown.tsx` | 251 | `/director/today` | `/director` | Dashboard |
| `src/app/director/sessions/page.tsx` | 116 | `/director/today` | `/director` | Dashboard |

**5 files contain wrong links. 7 link instances total.**

---

## Setup Step Integrity

The `buildSetupSteps()` function in `src/lib/donna/today/todayBriefEngine.ts` defines 4 setup steps shown in `TodaySetupCard` before an academy goes live.

| Step | Label | Current `actionHref` | Status |
|---|---|---|---|
| 1 | Academy identity set up | `/onboarding` | **WRONG** — routes to root `/onboarding`, not `/director/onboarding` |
| 2 | Players added | `/director/players/new` | Correct |
| 3 | Session templates created | `/director/templates` | **WRONG** — routes to demo-data Tree 1 hub, not canonical `/director/class-templates` |
| 4 | First session scheduled | `/director/sessions` | Correct |

The `src/app/director/setup/page.tsx` (legacy 12-step checklist) has steps 10–12 with no `href` — "Session Templates", "Demo Week", "Launch Checklist" all have inert CTAs.

---

## Template Pipeline Conflict (Architectural)

This conflict spans both Workflow 2 (Class Templates) and Workflow 3 (Fitness Templates).

| Tree | Create route | Create action | Pipeline |
|---|---|---|---|
| **Tree 2 (canonical)** | `/director/class-templates/new` | `createClassTemplateWithBlocksAction` | Direct DB write — **bypasses `proposed_actions`** |
| **Tree 2 (canonical)** | `/director/fitness/templates/new` | `fitnessTemplateActions` | Direct DB write — **bypasses `proposed_actions`** |
| **Tree 1 (legacy)** | `/director/templates/class/create` | `saveClassTemplateDraftFromWizardAction` | Routes through `proposed_actions` → review queue |
| **Tree 1 (legacy)** | `/director/templates/fitness/create` | `saveClassTemplateDraftFromWizardAction` | Routes through `proposed_actions` → review queue |

The core architecture rule (`CLAUDE.md`, `docs/AI_BACKEND_RULES.md`): "AI proposes → Director/Head Coach approves → System records → System executes."

The canonical tree violates this rule. The legacy tree respects it. This is the primary open question that must be resolved before Tree 1 is deprecated.

Decision required:
- **Option A:** Template creation by a Director does not require self-approval. Direct save is intentional. Tree 2 is correct; the rule applies only to AI-generated drafts.
- **Option B:** All template creation must go through `proposed_actions`. Tree 1 pipeline is correct; Tree 2 must be updated to route through `proposed_actions`.

---

## Prioritized Fix List

Items are ordered by blast radius and pilot risk. No code changes have been made.

| Priority | Fix | Files | Risk if left |
|---|---|---|---|
| P1 | Decide template pipeline model (Option A or B above) | `createClassTemplateWithBlocksAction.ts`, `fitnessTemplateActions.ts` | Architecture violation if B; confusion if A undocumented |
| P2 | Fix `todayBriefEngine.ts` setup step 1: `/onboarding` → `/director/onboarding` | `src/lib/donna/today/todayBriefEngine.ts:75` | New directors hit wrong page during setup |
| P2 | Fix `todayBriefEngine.ts` setup step 3: `/director/templates` → `/director/class-templates` | `src/lib/donna/today/todayBriefEngine.ts:87` | New directors see demo data, not their real templates |
| P3 | Fix 5 DONNA/legacy files linking to `/director/today` | Listed above | DONNA sends directors to superseded page |
| P4 | Determine canonical approval surface for `/director/ai-suggestions` content | `src/app/director/ai-suggestions/` | Two approval queues with no clear relationship |
| P4 | Determine canonical alert surface for `/director/alerts` content | `src/app/director/alerts/` | Alert logic exists twice (here + `DonnaAlertsAndMomentum`) |
| P5 | Determine fate of `/director/attention` and update DONNA dispatcher | `src/lib/donna/donnaUIActionDispatcher.ts:108` | DONNA routes to deprecated page |
| P6 | Deprecate Tree 1 template routes after P1 resolved | `src/app/director/templates/*` | Dead code serving demo data indefinitely |
| P7 | Delete confirmed dead routes | 7 routes listed above | Dead code confusion |

---

## What Is NOT Duplicated (Confirmed Clean)

These workflows have a single canonical path with no competing alternative:

| Workflow | Canonical route | Status |
|---|---|---|
| Player directory | `/director/players` | Single path ✓ |
| Player detail | `/director/players/[playerId]` | Single path ✓ |
| Player onboarding stepper | `/director/players/[playerId]/onboard` | Single path ✓ |
| Curriculum main | `/director/curriculum` | Single path ✓ |
| Curriculum builder | `/director/curriculum/builder` | Single path ✓ |
| Assessment template | `/director/assessment-template` | Single path ✓ |
| Coaches | `/director/coaches` | Single path ✓ |
| Settings | `/director/settings` | Single path ✓ |
| Sessions list | `/director/sessions` | Single path ✓ |
| Session from template | `/director/sessions/new` | Single path ✓ |
| Level up | `/director/level-up` | Single path ✓ |
| Signals | `/director/signals` | Single path ✓ |
| KPI | `/director/kpi` | Single path ✓ |

---

*Audit produced: Sprint 2140C — Director Workflow Integrity Audit V1*
*No files modified. Audit only.*
