# DONNA God Mode Unification Audit V1
**Date:** 2026-05-29
**Sprint:** 937
**Auditor:** Claude Code (Sprint Execution)

---

## Executive Summary

DONNA has grown into a deeply capable assistant, but the implementation is **fragmented across two independent shell lineages**, four role surfaces, and dozens of context sub-systems. The core intelligence — intent routing, page context, highlight engine, approval gate, session memory — is solid and correct. The unification gap is primarily in the **shell layer** (two competing conversation shells) and in the **role surface layer** (coach, parent, player each use disconnected DONNA implementations with different personalities, input patterns, and persistence models).

**Current God Mode Readiness: 6.5/10**

The highlight system works for director surfaces but is absent from coach, parent, and player. The "What should I do next?" engine works for director surfaces but is absent from all other roles. The approval gate and proposed_actions pipeline are complete and must not be changed. The path to true God Mode requires shell unification, a role-aware context resolver, a per-page element registry extension, and highlight plumbing for non-director roles.

---

## Part 1 — Current DONNA Architecture Map

### 1.1 Shell Layer (Where Conversations Happen)

#### Shell A — `DonnaVoiceReadyShell` (primary / modern)
- **File:** `src/components/donna/DonnaVoiceReadyShell.tsx` (2,478 lines)
- **Sprint origin:** Sprint 1035 + Sprint 912 series
- **Used by:**
  - `/director/donna` → `DonnaDirectorShellClient.tsx` (Sprint 1038)
  - `/coach/donna` → `CoachDonnaShellClient.tsx` (Sprint 1039)
- **Architecture:** `DonnaChatThread` + `useVoiceDictation` + `donnaChatSessionMemory` + TTS auto-play + conversation mode state machine
- **Conversation mode:** Full god mode state machine (`useDonnaConversationMode`): listening → typing → speaking → auto-listen loop
- **Backend spine:** `getOrCreateDonnaSession`, `appendDonnaMessage`, `upsertDonnaMemory`, `buildDonnaContextPacketForSession` — fire-and-forget
- **Role awareness:** `DonnaAssistantRole` prop (`director` | `coach`) — routes to appropriate answer engines
- **Page awareness:** `usePathname` → `getPageCapabilityMap()` → page-specific greetings and answers
- **Highlight:** Not wired — no `setDonnaFocusTarget` calls in the shell itself (highlight triggers in `DonnaAssistantButton`)
- **Status:** The correct future-state shell for all roles.

#### Shell B — `DonnaAssistantButton` (legacy / floating panel)
- **File:** `src/components/assistant/DonnaAssistantButton.tsx` (4,870 lines)
- **Sprint origin:** Sprint 270+, grown incrementally through Sprint 870+
- **Mounted in:**
  - `/director` layout (via `DonnaSessionContextProvider` — full context + highlight)
  - `/coach` layout (no `DonnaSessionContextProvider`, no `DonnaHighlightBanner`)
- **Architecture:** Monolithic stateful floating panel with 15+ state variables, persistent `VoiceInputButton`, `donnaPageContextRegistry`, `donnaConversationController`, template draft panels, `donnaTaskRuntime`, `DonnaVoiceLayer`, etc.
- **Conversation mode:** Older persistent VoiceInputButton (up to 5 auto-retries on silence); no full god mode state machine
- **Backend spine:** Partial wiring — some event log calls; no systematic session/memory persistence at this layer
- **Role awareness:** `role` prop passed in from layout
- **Page awareness:** `resolvePageContext()` from `donnaPageContextRegistry.ts` (older sprint origin)
- **Highlight:** **Fully wired** — `setDonnaFocusTarget` + `window.dispatchEvent(new CustomEvent('donna:highlight'))` — the only shell that can currently highlight elements
- **Status:** Legacy path. Correct to migrate highlight capability to Shell A and retire Shell B progressively.

#### Shell C — `DonnaVoiceWrapUpShell` (wrap-up only)
- **File:** `src/components/donna/DonnaVoiceWrapUpShell.tsx`
- **Sprint origin:** Sprint 553
- **Used by:** Coach wrap-up flow (`CoachWrapUpDrawer`)
- **Architecture:** Voice dictation + spoken question TTS; no chat thread; no memory; no routing
- **Role awareness:** Coach-only; hardcoded to wrap-up question flow
- **Page awareness:** None — driven by `currentQuestion` prop
- **Status:** Legitimate specialized shell for the wrap-up interview flow. Not a general assistant — should stay separate.

### 1.2 Page-Level DONNA Panels (Embedded, Not Floating)

These are page-specific DONNA panels embedded directly in route pages:

| Component | Page | Role | Type |
|---|---|---|---|
| `DonnaTodayBriefPanel.tsx` | `/director/today` | Director | Static brief card |
| `TodayDonnaSuggestionChip.tsx` | `/director/today` | Director | Quick action chips |
| `DonnaReviewBriefPanel.tsx` | `/director/review` | Director | Review queue summary |
| `DonnaReviewTabGuide.tsx` | `/director/review` | Director | Tab-by-tab guidance |
| `DonnaReviewFeedbackChip.tsx` | `/director/review` | Director | Feedback micro-interaction |
| `DonnaDraftCard.tsx` | `/director/review` | Director | Draft review card |
| `DonnaReviewContextPanel.tsx` | `/director/review/[actionId]` | Director | Per-action context |
| `DonnaDashboardOpenCard.tsx` | `/director` dashboard | Director | Open-DONNA CTA card |
| `DonnaExecutiveCard.tsx` | `/director` dashboard | Director | Executive summary |
| `TemplatesDonnaPanel.tsx` | `/director/templates` | Director | Template suggestions |
| `DonnaCurriculumNodeAddCard.tsx` | `/director/curriculum` | Director | Curriculum node add |
| `CurriculumDonnaPanel.tsx` | Curriculum builder | Director | Builder DONNA panel |
| `DonnaLevelMovementDraftButton.tsx` | `/director/level-up` | Director | Level movement draft |
| `LevelUpDonnaCTA.tsx` | `/director/level-up` | Director | CTA card |
| `CoachDonnaSessionPanel.tsx` | Coach session | Coach | Session-context panel |
| `DonnaWrapUpCoverageTracker.tsx` | Coach wrap-up | Coach | Wrap-up coverage |
| `DONNADirectorMobileCommandBar.tsx` | Director mobile | Director | Mobile command bar |
| `DirectorDonnaDailyBrief.tsx` | Director | Director | Daily brief card |
| `DirectorDonnaReviewPanel.tsx` | Director review | Director | Review panel |

**Risk:** These panels have their own static copy, response logic, and style. Some share source material with Shell A/B; others are independent. This creates personality fragmentation.

### 1.3 Role-Specific Ask-DONNA Pages

| Route | Role | Architecture | Persistence |
|---|---|---|---|
| `/director/donna` | Director | Shell A (DonnaVoiceReadyShell) | Full backend spine |
| `/coach/donna` | Coach | Shell A (DonnaVoiceReadyShell) | Partial (director-only spine) |
| `/player/ask-donna` | Player | Chip-based static chat (`DonnaChat`) | None |
| `/parent/ask-donna` | Parent | Chip-based static chat (`ParentDonnaChat`) | None |

**Gap:** Player and parent DONNA are not connected to Shell A. They use a completely different component architecture — pre-baked question chips with static context-aware responses. No voice, no memory, no routing engine, no highlight capability.

### 1.4 Context Sources

| Source | File | What it provides |
|---|---|---|
| `DirectorDonnaContext` | `directorDonnaContext.ts` | Live academy counts, pending items, KPIs, coach health, roster signals |
| `CoachDonnaContext` | `coachDonnaContext.ts` | Coach's sessions today, pending wrap-ups, recent players |
| `donnaPageContextEngine.ts` | — | Per-route capability maps, suggested prompts, approval requirements, safety blocks |
| `donnaPageContextRegistry.ts` (legacy) | `src/components/assistant/` | Older per-route context resolver used by Shell B |
| `donnaContextCache.ts` | `src/lib/donna/` | In-session context cache |
| `donnaContextPacketBuilder.ts` | `src/lib/donna/` | Full context packet (page + conversation + working memory) |
| `donnaSessionContext.ts` | `src/lib/donna/` | Cross-page session state (route, module, last prompt, panel open) |
| `donnaChatSessionMemory.ts` | `src/lib/donna/` | In-process chat history, pending nav offers, pending actions, slot-fill state |
| `donnaSafeSessionMemory.ts` | `src/lib/donna/` | Persisted session memory (conversation ID, working memory) |

**Gap:** Two separate page context registries (`donnaPageContextEngine.ts` vs `donnaPageContextRegistry.ts`) serve Shell A and Shell B respectively. They are not synchronized.

### 1.5 Intent and Action Routing

| System | File | Status |
|---|---|---|
| `routeDonnaIntentV1` | `donnaIntentRouterV1.ts` | Active — classifies intents for metadata/logging |
| `routeDonnaPrompt` | `donnaConversationalRouter.ts` | Partial — used by Shell B |
| `donnaCommandRouter.ts` | `src/lib/donna/` | Director command routing |
| `donnaUIActionRegistry.ts` | `src/lib/donna/` | 40+ UI actions with safety class and page guard |
| `donnaUIActionDispatcher.ts` | `src/lib/donna/` | Builds focus targets for navigation actions |
| `donnaProtectedActionRegistry.ts` | `src/components/assistant/` | Protected action list (older) |
| `donnaProtectedActionRouter.ts` | `src/components/assistant/` | Protected action routing (older) |

**Gap:** Two action routing layers exist: the modern `donnaUIActionRegistry` + `donnaUIActionDispatcher` (Shell A path) and the older `donnaProtectedActionRegistry` + `donnaProtectedActionRouter` (Shell B path). Both are active.

### 1.6 Highlight / Focus System

| Component | File | Status |
|---|---|---|
| `DonnaFocusTarget` (store) | `donnaFocusTarget.ts` | sessionStorage-backed, 8-second TTL |
| `DonnaHighlightBanner` | `DonnaHighlightBanner.tsx` | Mounted in director layout only |
| `donna-focus-ring` CSS | `globals.css` | Teal glow ring — director pages only |
| `data-donna-focus-id` attrs | Various director pages | ~60 elements across director + coach pages |
| `buildFocusTargetForRoute` | `donnaUIActionDispatcher.ts` | Maps route → focus target |
| `setDonnaFocusTarget` + `donna:highlight` event | `DonnaAssistantButton.tsx` | Dispatched from Shell B only |

**Gap:** `DonnaHighlightBanner` is mounted only in the director layout. Coach pages have `data-donna-focus-id` attributes and `donna-focus-ring` CSS, but the highlight banner component is not mounted in the coach layout and `DonnaSessionContextProvider` is not present in coach layout. Highlight does not function for coach role.

---

## Part 2 — Duplicate and Competing Implementations

### 2.1 Two Shell Implementations (Highest Risk)

| Dimension | Shell A (DonnaVoiceReadyShell) | Shell B (DonnaAssistantButton) |
|---|---|---|
| Conversation mode | Full god mode state machine | Older persistent voice retries |
| Chat persistence | Backend spine (fire-and-forget) | None systematic |
| Highlight triggering | Not wired | Fully wired |
| Page context engine | `donnaPageContextEngine.ts` (modern) | `donnaPageContextRegistry.ts` (legacy) |
| Action routing | Modern UIActionRegistry path | Legacy ProtectedActionRegistry path |
| File size | 2,478 lines | 4,870 lines |
| Status | Future-state | Should be migrated then retired |

**Risk:** A director can interact with DONNA through two completely different pipelines on the same page (the floating panel from Shell B plus the /director/donna page from Shell A). These pipelines have different routing logic, different memory, and different context resolution. They cannot share state and will give inconsistent answers.

### 2.2 Two Page Context Registries

- `src/components/assistant/donnaPageContextRegistry.ts` — legacy (Sprint 625+)
- `src/lib/donna/donnaPageContextEngine.ts` — modern (Sprint 687+)

Shell B uses the legacy registry. Shell A uses the modern engine. They have diverged.

### 2.3 Two Action Routing Layers

- Legacy: `donnaProtectedActionRegistry.ts` + `donnaProtectedActionRouter.ts` (Shell B)
- Modern: `donnaUIActionRegistry.ts` + `donnaUIActionDispatcher.ts` (Shell A)

Both are active. New actions should only be added to the modern registry.

### 2.4 Fragmented Role Personality

Each embedded panel (DonnaTodayBriefPanel, DonnaReviewBriefPanel, etc.) contains its own static copy describing DONNA's persona, tone, and guidance. There is no single source of truth for DONNA's personality across roles and pages.

### 2.5 Separate Parent/Player DONNA Systems

`DonnaChat` (player) and `ParentDonnaChat` (parent) are independent chip-based components with no connection to Shell A, the conversation mode system, the intent router, or the backend spine. They share the "DONNA" brand but are a fundamentally different product.

---

## Part 3 — Role-Awareness Assessment

| Role | Shell | Context loaded | Page-aware | Highlight | "What next?" |
|---|---|---|---|---|---|
| `director` | Shell A + Shell B (both active) | `DirectorDonnaContext` (live) | Yes (Shell A: modern engine; Shell B: legacy registry) | Shell B only, director layout | Shell A: `whatIsTheBestNextStep()` |
| `coach` | Shell A (dedicated /coach/donna page) + Shell B (floating, layout) | `CoachDonnaContext` | Shell A: Yes; Shell B: partial | Not functional (no banner in coach layout) | Partial (Shell A only, coach page) |
| `player` | Chip-based (`DonnaChat`) | Mission, level, next level | No | No | No |
| `parent` | Chip-based (`ParentDonnaChat`) | Child name, focus category, level | No | No | No |
| `platform_owner` | None | None | No | No | No |

---

## Part 4 — "What Should I Do Next?" Engine Assessment

### Current Capability (Director)

`whatIsTheBestNextStep(pathname)` in `donnaPageContextEngine.ts` answers this for 20+ director routes. When a director asks "what should I do here?", Shell A intercepts the question via `PAGE_NEXT_STEP` pattern and calls `whatIsTheBestNextStep(currentPath)`.

**What it does:**
1. Maps `pathname` → `DonnaPageCapabilityMap`
2. Returns `directorIntent` + first `suggestedPrompts[0]`
3. Does **not** consult live data (no `directorCtx` needed)
4. Does **not** highlight a UI element
5. Does **not** provide a step-by-step click path

**Gap: No visual highlight.** The answer is text-only. DONNA describes where to click but cannot point to it. The `donnaUIActionRegistry` has `focusTargetId` fields that could enable highlight on "what next?" answers, but this is not wired.

**Gap: No live-data priority.** The answer uses static page intent, not actual pending items. If a director asks "what should I do next?" on the review page, DONNA describes the review page generally — it does not say "there are 3 pending wrap-ups; click the first one."

### Current Capability (Coach)

When a coach asks "what should I do here?" on `/coach/donna` (Shell A), the same `PAGE_NEXT_STEP` pattern fires. Coach pages have capability maps in `donnaPageContextEngine.ts`. This works textually.

**Gap:** No highlight, no live-data coaching.

### Current Capability (Player/Parent)

Not implemented. The chip-based interface does not route "what should I do next?" questions through any engine.

---

## Part 5 — Highlight Capability Assessment

### What Works Today

1. `DonnaHighlightBanner` is mounted in the **director layout only**.
2. When Shell B (`DonnaAssistantButton`) calls `setDonnaFocusTarget()` + dispatches `donna:highlight`, the banner reads sessionStorage and applies `donna-focus-ring` to the target element.
3. ~60 elements have `data-donna-focus-id` attributes across director and coach pages.
4. The focus target store has 8-second TTL and auto-dismiss.
5. Navigation-triggered highlights work cross-page (set before `router.push`, read on mount by `DonnaHighlightBanner`).

### What Doesn't Work

1. **Coach layout:** No `DonnaSessionContextProvider` and no `DonnaHighlightBanner` mounted. Coach pages have `data-donna-focus-id` attrs but highlight is non-functional.
2. **Shell A highlight:** `DonnaVoiceReadyShell` (Shell A) does not call `setDonnaFocusTarget`. Highlight is only triggered through Shell B.
3. **"What next?" highlight:** No wiring between `whatIsTheBestNextStep()` and `donnaUIActionRegistry`'s `focusTargetId` fields. Text answer is given but nothing glows.
4. **Parent/Player:** No highlight system.

---

## Part 6 — Pages Where DONNA Can Currently Guide

### Director (via Shell A)

| Page | Text guidance | Highlight | Live data |
|---|---|---|---|
| `/director/donna` | Full | No (Shell A not wired) | Yes |
| `/director` | Full | Shell B only | Yes |
| `/director/review` | Full | Shell B only | Yes |
| `/director/players` | Full | Shell B only | Yes |
| `/director/players/[id]` | Full | Shell B only | Yes |
| `/director/curriculum` | Full | Shell B only | Yes |
| `/director/curriculum/builder` | Full | Shell B only | Yes |
| `/director/sessions` | Full | Shell B only | Yes |
| `/director/sessions/[id]` | Full | Shell B only | Yes |
| `/director/templates` | Full | Shell B only | Partial |
| `/director/class-templates/[id]` | Full | Shell B only | Partial |
| `/director/today` | Full | Shell B only | Yes |
| `/director/level-up` | Full | Shell B only | Yes |
| `/director/placement` | Full | Shell B only | Partial |
| `/director/kpi` | Full | Shell B only | Partial |
| `/director/onboarding` | Full | Shell B only | No |

### Coach (via Shell A at /coach/donna, Shell B floating)

| Page | Text guidance | Highlight | Live data |
|---|---|---|---|
| `/coach/donna` | Full (Shell A) | No | Partial |
| `/coach` | Shell B floating | No | Partial |
| `/coach/sessions/[id]` | Shell B floating | No | Partial |
| `/coach/sessions/[id]/wrap-up` | Wrap-up shell + Shell B | No | Partial |
| `/coach/players` | Shell B floating | No | Partial |

### Player/Parent

| Page | Text guidance | Highlight | Live data |
|---|---|---|---|
| `/player/ask-donna` | Chip-based only | No | Partial (level, mission) |
| `/parent/ask-donna` | Chip-based only | No | Partial (child name, level) |

---

## Part 7 — Recommended God Mode Unification Architecture

### 7.1 Single-Source-of-Truth Shell: DonnaVoiceReadyShell

`DonnaVoiceReadyShell` is the recommended single shell for all conversational DONNA surfaces going forward. It has:

- Full god mode state machine
- Backend spine persistence
- Modern page context engine
- Role-aware routing
- TTS + auto-listen loop

**Plan:** Wire highlight capability into Shell A. Retire Shell B's routing/chat path progressively while preserving its highlight-dispatch mechanism until Shell A wires its own.

### 7.2 Single Voice/Personality Source

DONNA's personality should come from a single module. Proposed: `src/lib/donna/donnaPersonality.ts` (new file, Sprint 938).

Contents:
- DONNA name, tagline, role descriptions per role
- Tone guidelines (direct, calm, factual, never condescending)
- Boundary language patterns (what DONNA says when it can't act)
- Role badge copy

All embedded panels (`DonnaTodayBriefPanel`, etc.) should import from this module rather than containing their own copy.

### 7.3 Single Context Resolver

Proposed: `src/lib/donna/donnaContextResolver.ts` (Sprint 939)

Resolves the complete DONNA context packet from all sources:

```typescript
interface DonnaResolvedContext {
  role: DonnaRole
  pathname: string
  pageCapability: DonnaPageCapabilityMap
  directorCtx: DirectorDonnaContext | null
  coachCtx: CoachDonnaContext | null
  sessionMemory: DonnaSafeSessionMemory | null
  workingMemory: Record<string, unknown>
  focusableElements: DonnaPageElementEntry[]
  pendingNavOffer: PendingNavOffer | null
  pendingAction: PendingAction | null
}
```

Both Shell A and embedded panels should resolve context from this single function.

### 7.4 Role-Awareness Model (Recommended)

```
Role hierarchy:
  academy_director → Full DONNA access + highlight + approve/reject + all page guidance
  head_coach       → Full coach DONNA + session guidance + highlight (when wired)
  coach            → Coach DONNA + session/wrap-up guidance + highlight (when wired)
  player           → Chip-based + level/mission context + no mutations
  parent           → Chip-based + child context + no coach notes + no mutations
  platform_owner   → Not yet built

Safety invariants:
  parent → never sees coach notes, raw scores, peer comparisons
  player → never sees director assessments, coach concerns
  coach  → never approves own submissions
  DONNA  → never calls execute_approved_action() directly
```

### 7.5 Page Element Registry (God Mode Extension)

The existing `donnaUIActionRegistry.ts` has `focusTargetId` fields. The gap is that the registry entry does not contain enough data for DONNA to generate a "What next?" answer that includes a visual pointer.

Proposed extension: add a `donnaElementRegistry` export to each route page file:

```typescript
// In /director/review/page.tsx or equivalent
export const DONNA_ELEMENT_REGISTRY: DonnaPageElement[] = [
  {
    id: 'review-wrap-up-draft',
    label: 'Review wrap-up draft',
    selector: "[data-donna-focus-id='review-wrap-up-draft']",
    priority: 'high',
    actionType: 'review',
    safetyLevel: 'approval_required',
    explanation: 'This coach wrap-up needs director review before it affects player records.',
    dataDependent: true,          // only show if pending items exist
    showWhen: (ctx) => (ctx.directorCtx?.pendingWrapUps ?? 0) > 0,
  },
]
```

DONNA's "What should I do next?" engine can then:
1. Pull the `DONNA_ELEMENT_REGISTRY` for the current route.
2. Filter by `showWhen(ctx)` using live context.
3. Sort by `priority`.
4. Return the top element's `explanation` + `id` (for highlight).
5. Call `setDonnaFocusTarget({ route, targetId: element.id, label: element.label })`.
6. Dispatch `donna:highlight`.

### 7.6 Highlight/Focus System Extension

**Immediate (Sprint 938):**
- Mount `DonnaSessionContextProvider` and `DonnaHighlightBanner` in coach layout.
- Wire `setDonnaFocusTarget` + `donna:highlight` dispatch into Shell A's navigation answer path.

**Sprint 939:**
- Connect the `donnaElementRegistry` (above) to the "What next?" engine.
- When DONNA answers "What should I do next?" with a specific element, trigger highlight automatically.

### 7.7 "What Should I Do Next?" Decision Engine (Ranking Standard)

Priority order for next-action selection:

1. **Safety/review urgency** — items with `status = 'pending_review'` and `risk_level = 'high'`
2. **Pending approvals** — items in `proposed_actions` with `status = 'pending_review'`
3. **Incomplete setup** — missing onboarding steps, unconfigured curriculum, unplaced players
4. **Current page primary CTA** — first high-priority element in `DONNA_ELEMENT_REGISTRY` for this route
5. **Role-specific daily workflow** — daily brief suggestions from `getDailyBriefForRole(role, ctx)`
6. **Lower-priority insights** — KPI anomalies, attention signals, curriculum gaps

When live context is available (`directorCtx` or `coachCtx`), levels 1–3 use live counts. When context is null, levels 4–6 are text-only.

### 7.8 Safe CTA Routing Model

All DONNA CTAs follow this invariant:

```
DONNA describes → DONNA highlights → User clicks → System records → Director approves
```

DONNA never:
- Auto-clicks UI elements
- Submits forms on behalf of the user
- Calls `execute_approved_action()` directly
- Auto-sends communications

DONNA can:
- Navigate (router.push with confirmation)
- Highlight (setDonnaFocusTarget)
- Draft (proposed_actions row)
- Explain + warn (text response)

---

## Part 8 — Implementation Sequence: Sprints 938–946

### Sprint 938 — Shell Highlight Unification
**Goal:** Wire highlight capability into Shell A. Mount `DonnaHighlightBanner` in coach layout.
- Add `DonnaSessionContextProvider` + `DonnaHighlightBanner` to coach layout
- Wire `setDonnaFocusTarget` + `donna:highlight` dispatch into Shell A's navigation answer handler (when DONNA says "Take me to X" and director says "yes")
- No Shell B changes, no routing changes

### Sprint 939 — Context Resolver + Personality Module
**Goal:** Single context resolver. Single personality source.
- Create `src/lib/donna/donnaPersonality.ts` — tone, role descriptions, boundary language
- Create `src/lib/donna/donnaContextResolver.ts` — resolves full context from all sources
- Migrate `DonnaTodayBriefPanel` and `DonnaReviewBriefPanel` to use personality module
- No shell changes

### Sprint 940 — Page Element Registry Foundation
**Goal:** Define the `DonnaPageElement` type and register the first page (Director Review Queue).
- Add `DonnaPageElement` type to `donnaUIActionRegistry.ts`
- Add `DONNA_ELEMENT_REGISTRY` export to `/director/review/page.tsx` (or companion file)
- Connect to `whatIsTheBestNextStep()` for review page only
- Wire highlight on "What next?" answer for review page

### Sprint 941 — "What Should I Do Next?" Full Engine
**Goal:** Live-data "What next?" engine using page element registry + context.
- Extend `donnaPageContextEngine.ts` with `whatShouldIDoNextLive(pathname, ctx)` function
- Returns top prioritized element from `DONNA_ELEMENT_REGISTRY` filtered by live context
- Returns highlight target ID + explanation + safety level
- Wire into Shell A `PAGE_NEXT_STEP` pattern handler

### Sprint 942 — Coach Shell Highlight + What Next
**Goal:** Bring coach DONNA to parity with director for highlight + "what next?".
- Extend page element registry to coach pages (session, wrap-up)
- Wire `whatShouldIDoNextLive` for coach context
- Verify highlight banner working in coach layout (from Sprint 938)

### Sprint 943 — Legacy Context Registry Retirement
**Goal:** Migrate Shell B to use `donnaPageContextEngine.ts` (modern). Retire legacy registry.
- Migrate `DonnaAssistantButton` context resolution from `donnaPageContextRegistry.ts` to `donnaPageContextEngine.ts`
- After migration, mark `donnaPageContextRegistry.ts` as deprecated

### Sprint 944 — Legacy Action Router Retirement
**Goal:** Migrate Shell B's action routing to modern UIActionRegistry path.
- Migrate `DonnaAssistantButton` action routing from `donnaProtectedActionRouter.ts` to `donnaUIActionDispatcher.ts`
- After migration, mark `donnaProtectedActionRegistry.ts` + `donnaProtectedActionRouter.ts` as deprecated

### Sprint 945 — Player/Parent DONNA Bridge
**Goal:** Connect player/parent DONNA to Shell A intent engine (read-only, text-only).
- No voice for player/parent (correct for mobile)
- Add intent routing to `DonnaChat` and `ParentDonnaChat` — route freeform questions through the same answer engine that Shell A uses for those roles
- No highlight (mobile, no layout-level banner)
- No mutations

### Sprint 946 — Shell B Retirement + God Mode Certification
**Goal:** Shell B (`DonnaAssistantButton`) retired as the conversation engine. Shell A is the single shell.
- Shell B becomes a thin launcher: opens `/director/donna` or `/coach/donna`
- All conversation state lives in Shell A
- Certification: audit confirms single shell, single context resolver, single personality, highlight working for director + coach, "What next?" engine live
- Issue completion badge

---

## Part 9 — Current God Mode Readiness Ratings

| Dimension | Rating | Notes |
|---|---|---|
| One assistant identity | 5/10 | Two shells, fragmented panels |
| One voice/personality | 5/10 | No single source; each panel has own copy |
| Role-aware | 8/10 | Director + coach wired; player/parent chip-only |
| Page-aware | 8/10 | Modern engine covers 20+ routes |
| Academy-aware | 8/10 | `directorCtx` / `coachCtx` load live data |
| Context-aware | 7/10 | Session memory + context packet built; not fully connected to routing |
| Persistent across pages | 7/10 | Shell A: partial; Shell B: panel state in sessionStorage |
| "What should I do next?" | 5/10 | Text-only, static page intent; no live data, no highlight |
| Highlight UI elements | 4/10 | Director only via Shell B; coach wired but banner absent |
| Explain why + safety warnings | 8/10 | Strong boundary responses + approval gate |
| Safe routing (no auto-mutate) | 10/10 | Fully enforced; architecture invariant |
| Distinguish all 5 roles | 7/10 | Director/coach strong; player/parent limited |
| **Overall** | **6.5/10** | |

---

## Part 10 — Protected Systems (Do Not Touch in This Audit Sprint)

The following systems are confirmed stable and must not be changed:

- Sprint 904 approve/reject paths (`WrapUpDraftDecisionControls.tsx`, `actions.ts`)
- `proposed_actions` state machine
- `execute_approved_action()` RPC
- `DonnaVoiceReadyShell` routing/chat logic
- `donnaChatSessionMemory` + context cache
- Event ledger (`donnaEventLedger.ts`)
- Intent router V1 (`donnaIntentRouterV1.ts`)
- Approval gate (`donnaApprovalGate.ts`)
- Recommendation feedback (`donnaRecommendationFeedback.ts`)
- Semantic memory safety (`donnaSemanticMemory.ts`)
- Coach wrap-up loop Sprints 926–936 (all files in wrap-up path)
- Parent/player communication safety (`parentSafeResponseRules.ts`)
- Player level movement safety (`finalize_player_placement()`)
- Roster/placement/billing/curriculum mutation safety
- RLS/multi-tenant boundaries (all tables)

---

## Appendix A — Full DONNA File Inventory (by layer)

### Shell Layer
- `src/components/donna/DonnaVoiceReadyShell.tsx` — Shell A (primary)
- `src/components/assistant/DonnaAssistantButton.tsx` — Shell B (legacy)
- `src/components/donna/DonnaVoiceWrapUpShell.tsx` — Shell C (wrap-up only)
- `src/app/director/donna/DonnaDirectorShellClient.tsx` — Shell A wrapper for director
- `src/app/coach/donna/CoachDonnaShellClient.tsx` — Shell A wrapper for coach

### Context Layer
- `src/lib/donna/directorDonnaContext.ts`
- `src/lib/donna/coachDonnaContext.ts`
- `src/lib/donna/donnaPageContextEngine.ts` (modern)
- `src/components/assistant/donnaPageContextRegistry.ts` (legacy)
- `src/lib/donna/donnaContextCache.ts`
- `src/lib/donna/donnaContextPacketBuilder.ts`
- `src/lib/donna/donnaSessionContext.ts`
- `src/lib/donna/donnaChatSessionMemory.ts`
- `src/lib/donna/donnaSafeSessionMemory.ts`

### Intent/Action Routing Layer
- `src/lib/donna/donnaIntentRouterV1.ts` (modern)
- `src/lib/donna/donnaConversationalRouter.ts`
- `src/lib/donna/donnaCommandRouter.ts`
- `src/lib/donna/donnaUIActionRegistry.ts` (modern)
- `src/lib/donna/donnaUIActionDispatcher.ts` (modern)
- `src/components/assistant/donnaProtectedActionRegistry.ts` (legacy)
- `src/components/assistant/donnaProtectedActionRouter.ts` (legacy)

### Highlight Layer
- `src/lib/donna/donnaFocusTarget.ts`
- `src/components/donna/DonnaHighlightBanner.tsx`
- `src/lib/donna/donnaUIActionDispatcher.ts` (buildFocusTargetForRoute)

### Answer Engines
- `src/lib/donna/directorDashboardDonnaAnswer.ts`
- `src/lib/donna/directorPlayersDonnaIntelligence.ts`
- `src/lib/donna/coachHealthDonnaAnswer.ts`
- `src/lib/donna/coachCueDonnaAnswer.ts`
- `src/lib/donna/curriculumLevelDonnaAnswer.ts`
- `src/lib/donna/curriculumImpactDonnaAnswer.ts`
- `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts`
- `src/lib/donna/sessionAdjustmentDonnaAnswer.ts`
- `src/lib/donna/templateDraftDonnaAnswer.ts`
- `src/lib/donna/fitnessDraftDonnaAnswer.ts`
- `src/lib/donna/donnaReviewQueueAnswer.ts`
- `src/lib/donna/donnaOnboardingGuideAnswer.ts`
- `src/lib/donna/donnaSafeReadActions.ts`
- `src/lib/donna/donnaNBAEngine.ts`
- `src/lib/donna/donnaAttentionRankingEngine.ts`

### Safety Layer
- `src/lib/donna/donnaBoundaryResponses.ts`
- `src/lib/donna/donnaRoleBoundaries.ts`
- `src/lib/donna/donnaRoleBlocks.ts`
- `src/lib/donna/donnaVisibilityGuardrail.ts`
- `src/lib/donna/donnaParentSafeRules.ts` (+ `src/lib/communications/parentSafeResponseRules.ts`)
- `src/lib/donna/donnaApprovalGate.ts`
- `src/lib/donna/donnaTrustBoundaryValidator.ts`
- `src/lib/donna/donnaSafetyRegressionPrompts.ts`
- `src/components/assistant/donnaPermissionGuard.ts`

### Memory/Persistence Layer
- `src/lib/donna/donnaChatSessionMemory.ts` (in-process)
- `src/lib/donna/donnaSemanticMemory.ts`
- `src/lib/donna/donnaConversationPersistence.ts`
- `src/lib/donna/donnaRecommendationFeedback.ts`
- `src/lib/actions/donnaConversationActions.ts`
- `src/lib/actions/donnaEventActions.ts`
- `src/lib/donna/donnaEventLedger.ts`

### Player/Parent Layer
- `src/app/player/ask-donna/page.tsx`
- `src/app/parent/ask-donna/page.tsx`
- `src/components/player/DonnaChat.tsx`
- `src/components/player/ParentDonnaChat.tsx`
