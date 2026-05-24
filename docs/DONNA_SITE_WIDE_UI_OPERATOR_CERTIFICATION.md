# DONNA Site-Wide UI Operator Certification
**Sprint 756 — 2026-05-24**

---

## Certification Verdict

> ## ✅ FOUNDATION READY — NOT FULL SITE-WIDE CERTIFIED
>
> DONNA's UI operator infrastructure is complete and architecturally sound.
> DONNA can guide, navigate, draft, and block unsafe actions across the Director portal
> using a formally structured action registry, approval matrix, 6 guided operators,
> a safe dispatcher, and 36 regression cases.
>
> Full site-wide certification is withheld because runtime wiring of the dispatcher
> to the live panel is not yet implemented, and the coach/player/parent portal
> coverage is navigation-only rather than operator-guided.

---

## What Was Audited

| Layer | File | Lines | Status |
|---|---|---|---|
| UI Action Registry | `src/lib/donna/donnaUIActionRegistry.ts` | 1 051 | ✅ Complete |
| Approval Matrix | `src/lib/donna/donnaUIApprovalMatrix.ts` | 323 | ✅ Complete |
| Guided Operators | `src/lib/donna/donnaUIGuidedOperators.ts` | 649 | ✅ Complete |
| Safe Dispatcher | `src/lib/donna/donnaUIActionDispatcher.ts` | 513 | ✅ Complete |
| Regression Prompts | `src/lib/donna/donnaUIOperatorRegressionPrompts.ts` | 728 | ✅ Complete |
| Page Context Engine | `src/lib/donna/donnaPageContextEngine.ts` | 351 | ✅ Pre-existing |
| Safety Regression | `src/lib/donna/donnaSafetyRegressionPrompts.ts` | 593 | ✅ Pre-existing |
| Director Layout | `src/app/director/layout.tsx` | — | ✅ DONNA mounted site-wide |
| **Total certification infrastructure** | | **3 264** | |

---

## Requirement Checklist

### 1. Site-Wide UI Action Registry
**Status: ✅ PASS**

`donnaUIActionRegistry.ts` defines 39 UI actions across 10 domains and 6 safety classes.

| Safety Class | Count | Examples |
|---|---|---|
| `always_safe` | 12 | navigate, open panel, expand section, filter, search |
| `safe_with_context` | 10 | open builder, start guided flow, advance onboarding step |
| `draft_to_review` | 7 | draft attendance exception, propose level change, draft parent update |
| `director_approval` | 5 | approve review item, publish curriculum, invite coach |
| `platform_required` | 1 | change billing plan |
| `always_blocked` | 5 | send message directly, delete record, bypass queue, expose raw notes, cross-tenant access |

Domains covered: `navigation`, `panel_control`, `onboarding`, `curriculum`, `templates`, `sessions`, `players`, `coaches`, `parents`, `review_queue`, `blocked`.

All 5 roles registered: `academy_director`, `head_coach`, `coach`, `player`, `parent`.

---

### 2. Role/Action Approval Matrix
**Status: ✅ PASS**

`donnaUIApprovalMatrix.ts` provides a formal per-role × safety-class permission matrix.

| Safety Class | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| always_safe | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| safe_with_context | ALLOWED | ALLOWED | ALLOWED | NOT_APPLICABLE | NOT_APPLICABLE |
| draft_to_review | DRAFT_ONLY | DRAFT_ONLY | BLOCKED | BLOCKED | BLOCKED |
| director_approval | ROUTE_TO_REVIEW | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| platform_required | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| always_blocked | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

6 high-risk action summaries defined with exact `donnaResponse` strings and approval paths.
`evaluateUIAction(actionId, role)` resolves permission + approval path for any combination.

---

### 3. Page Capability Map
**Status: ✅ PASS (Director portal) / ⚠️ PARTIAL (coach/player/parent)**

`donnaPageContextEngine.ts` covers 16 Director routes with per-page capability summaries,
suggested prompts, approval-required actions, and out-of-scope declarations.

Director routes with full page-awareness:

| Route | Coverage |
|---|---|
| `/director/onboarding` | Full — setup flow, interview, curriculum |
| `/director/onboarding/interview` | Full |
| `/director/onboarding/curriculum` | Full |
| `/director` | Full — command center |
| `/director/donna` | Full — standalone DONNA shell |
| `/director/kpi` | Full |
| `/director/players` | Full |
| `/director/players/[playerId]` | Full |
| `/director/review` | Full |
| `/director/signals` | Full |
| `/director/curriculum` | Full |
| `/director/curriculum/builder` | Full |
| `/director/placement` | Full |
| `/director/level-up` | Full |
| `/director/support-diagnostics` | Full |
| `*` (fallback) | Graceful default |

Coach/player/parent portals: navigation-only guidance. Operator-guided flows not yet wired.

---

### 4. Onboarding Guided Operator
**Status: ✅ PASS**

`ONBOARDING_OPERATOR` in `donnaUIGuidedOperators.ts`:
- 5 steps: Academy Mode Selection → Placement Interview → Curriculum Setup → Player Placement → Academy Activation
- Entry phrases: `["help me set up the academy", "start onboarding", ...]`
- Roles: `academy_director` only
- Steps 4–5 require approval via proposed_actions
- Out-of-scope: billing, player-level moves, curriculum publishing without builder review

---

### 5. Curriculum Guided Operator
**Status: ✅ PASS**

`CURRICULUM_OPERATOR`:
- 5 steps: Curriculum Status Review → Gap Identification → Builder Launch → Draft Review → Publish Gate
- Publishing (step 5) routes to director confirmation — DONNA cannot publish directly
- Entry phrases: `["open the curriculum builder", "review curriculum", ...]`
- Roles: `academy_director` only

---

### 6. Template Guided Operator
**Status: ✅ PASS**

`TEMPLATE_OPERATOR`:
- 5 steps: Template Type Selection → Template Basics → Draft → Builder → Review
- Entry phrases: `["create a session template", "open the template builder", ...]`
- Roles: `academy_director`, `head_coach`

---

### 7. Session Guided Operator
**Status: ✅ PASS**

`SESSION_OPERATOR`:
- 5 steps: Session Planning → Today's Sessions Review → Session Start → Wrap-Up → Attendance Exception Draft
- Entry phrases: `["start session wrap-up", "help me run this session", ...]`
- Roles: `academy_director`, `head_coach`, `coach`
- Attendance exception (step 5) creates draft → review

---

### 8. Player/Profile Guided Operator
**Status: ✅ PASS**

`PLAYER_OPERATOR`:
- 6 steps: Player Status Review → Coach Note Draft → Level Advancement Assessment → Placement Proposal → Parent Update Draft → Finalization
- Entry phrases: `["review this player's progress", "help me assess a player", ...]`
- Roles: `academy_director`, `head_coach`
- Steps 3–6 require director approval via proposed_actions
- Parent update draft never auto-sends

---

### 9. Review Center Guided Operator
**Status: ✅ PASS**

`REVIEW_CENTER_OPERATOR`:
- 5 steps: Queue Overview → Priority Sort → Item Explanation → Detail Navigation → Approval Gate
- DONNA explains pending items and navigates to them — cannot approve directly
- Entry phrases: `["walk me through the review center", "what's in my review queue", ...]`
- Roles: `academy_director` only

---

### 10. Safe Action Dispatcher
**Status: ✅ PASS**

`donnaUIActionDispatcher.ts` implements a 6-priority dispatch pipeline:

```
1. Blocked phrases   → checkBlockedPhrase()  → hard refusal, no draft, no routing
2. Guided operators  → resolveGuidedOperator() → operator step 1, role check
3. Navigation        → resolveNavigation()    → route resolution, role guard
4. Draft intents     → resolveDraftIntent()   → proposed_actions route, approval flag
5. Approval routing  → inline pattern match   → /director/review, ROUTE_TO_REVIEW
6. Clarification     → default fallback       → asks one focused question
```

Key guarantees enforced by dispatcher:
- `execute_approved_action()` is never called by DONNA (no path reaches it in dispatcher)
- `finalize_player_placement()` is never called by DONNA
- Direct communication sends are always blocked (pattern match fires before any draft)
- Cross-tenant access is always blocked
- Approval bypass is always blocked with hard refusal

`DispatchResult` carries: `kind`, `actionId`, `message`, `route`, `operatorId`, `stepNumber`, `filterParams`, `requiresApproval`, `approvalRoute`, `matrixPermission`, `confidence`, `safetyClass`.

---

### 11. Regression Prompts
**Status: ✅ PASS**

`donnaUIOperatorRegressionPrompts.ts` defines 36 structured test cases:

| Category | Count | Risk Focus |
|---|---|---|
| navigation | 8 | safe — all roles |
| guided_operator | 6 | safe/medium — operator launch |
| draft_action | 5 | medium/high — proposed_actions path |
| approval_routing | 3 | high — director-only approval |
| blocked_always | 6 | high — architecture invariants |
| role_boundary | 4 | medium/high — role enforcement |
| filter_search | 2 | safe — no state change |
| clarification | 2 | safe — vague input handling |

Each case specifies:
- Input: `text`, `role`, `currentRoute`
- Expected: `kind`, `matrixPermission`, `requiresApproval`, `confidence`, `messageContains[]`, `messageNotContains[]`
- `riskClass`: safe / medium / high
- `notes`: auditor guidance for QA

Critical invariant tests:
- `block-001`: DONNA never sends messages directly — `messageNotContains: ['sent', 'message sent', 'delivered']`
- `block-003`: Parent cannot see raw coach notes — `messageNotContains: ['here are the notes', 'coach said']`
- `block-004`: Approval queue cannot be bypassed — `messageNotContains: ['executing', 'bypassed', 'done']`
- `draft-004`: Parent update is drafted, never sent automatically — `messageNotContains: ['send', 'sent']`

---

## Architecture Invariant Verification

The following invariants are confirmed **intact** across all certification sprint files:

| Invariant | Location | Status |
|---|---|---|
| `execute_approved_action()` only executes approvals | `donnaUIApprovalMatrix.ts` HIGH_RISK_ACTIONS + dispatcher | ✅ No path around it |
| `finalize_player_placement()` only activates players | dispatcher + approval matrix | ✅ Never called by dispatcher |
| DONNA never sends communications directly | `always_blocked` registry + dispatcher pattern | ✅ Hard-blocked |
| All draft actions → proposed_actions | dispatcher `resolveDraftIntent()` | ✅ `requiresApproval: true` |
| Cross-tenant access blocked | dispatcher blocked patterns | ✅ Hard-blocked |
| Parent/player raw data blocked | registry + role matrix | ✅ `always_blocked` class |
| No DB calls in certification layer | all 5 certification files | ✅ Pure TypeScript, no Supabase imports |
| No external AI calls in certification layer | all 5 certification files | ✅ No fetch, no OpenAI |
| No migrations in certification sprint | git diff | ✅ No migration files touched |
| academy_id scoping (not applicable) | certification files are pure logic | ✅ N/A — no queries |

---

## What DONNA Can Do (Certified Capabilities)

### Director Portal — Full Operator Coverage
- ✅ Navigate to any Director route by voice or text
- ✅ Open/close the DONNA panel
- ✅ Filter and search players, sessions, coaches by spoken criteria
- ✅ Launch the curriculum builder, template builder, placement flow
- ✅ Guide onboarding setup step by step (5-step operator)
- ✅ Guide curriculum review and draft submission (5-step operator)
- ✅ Guide session planning and wrap-up (5-step operator)
- ✅ Guide player progress review and advancement proposals (6-step operator)
- ✅ Walk through the review center queue (5-step operator)
- ✅ Draft attendance exceptions, coach notes, parent progress updates
- ✅ Propose level changes (draft → review, never direct)
- ✅ Route director-approval items to `/director/review`
- ✅ Explain what changed and what requires human approval
- ✅ Ask one focused clarification for ambiguous intent
- ✅ Refuse architecture invariant violations with clear explanation

### Coach Portal — Navigation + Session Guidance
- ✅ Navigate to sessions, players, recap
- ✅ Start session wrap-up via SESSION_OPERATOR
- ✅ Draft attendance exceptions (proposed_actions path)
- ⚠️ Template creation blocked at coach level (head_coach required)
- ⚠️ Player-level actions blocked (director approval required)

### Player/Parent Portals — Navigation Only
- ✅ Navigate to all portal pages
- ✅ All consequential actions blocked with clear role explanation
- ✅ Raw coach notes and cross-portal data always blocked

---

## What Is Not Yet Certified

| Gap | Impact | Suggested Sprint |
|---|---|---|
| ~~`dispatchUIIntent()` is not wired to live panel~~ | ~~Dispatcher logic exists but not called from running UI~~ | ✅ **CLOSED — Sprint 757** |
| ~~Guided operator step progression has no runtime state~~ | ~~No component tracks which step the user is on~~ | ✅ **CLOSED — Sprint 757** (`currentOperatorId` + `currentOperatorStep` state added) |
| Coach/player/parent portals have no guided operators | Only navigation is DONNA-assisted; no multi-step operator flows | Sprint 759–760: SESSION_OPERATOR already supports coach role; wire to `/coach` layout |
| `getUIActionsForPage()` not yet called from page components | Each page could pass its current route and receive DONNA's available action set for context-aware suggestions | Sprint 761: Pass current route to DONNA panel for per-page quick action surfacing |
| Regression cases are not run in CI | 36 cases defined but no automated runner; QA is manual | Sprint 762: Build lightweight test harness runner against `dispatchUIIntent()` |

---

## Certification Evidence Summary

| Requirement | Files | Lines | Result |
|---|---|---|---|
| Site-wide UI action registry | `donnaUIActionRegistry.ts` | 1 051 | ✅ |
| Role/action approval matrix | `donnaUIApprovalMatrix.ts` | 323 | ✅ |
| Page capability map (Director) | `donnaPageContextEngine.ts` | 351 | ✅ |
| Onboarding guided operator | `donnaUIGuidedOperators.ts` | 649 | ✅ |
| Curriculum guided operator | `donnaUIGuidedOperators.ts` | (above) | ✅ |
| Template guided operator | `donnaUIGuidedOperators.ts` | (above) | ✅ |
| Session guided operator | `donnaUIGuidedOperators.ts` | (above) | ✅ |
| Player/profile guided operator | `donnaUIGuidedOperators.ts` | (above) | ✅ |
| Review center guided operator | `donnaUIGuidedOperators.ts` | (above) | ✅ |
| Safe action dispatcher | `donnaUIActionDispatcher.ts` | 513 | ✅ |
| Regression prompts | `donnaUIOperatorRegressionPrompts.ts` | 728 | ✅ |
| Architecture invariants intact | all 5 certification files | — | ✅ |
| TypeScript clean | `npx tsc --noEmit` | — | ✅ |
| No migrations | git diff | — | ✅ |
| No package installs | package.json unchanged | — | ✅ |
| Dispatcher wired to live panel | `DonnaAssistantButton.tsx` Sprint 757 | — | ✅ |
| Runtime operator step tracking | `currentOperatorId`/`currentOperatorStep` state Sprint 757 | — | ✅ |
| Coach/player/parent operators | not yet wired to `/coach` layout | — | ❌ |

---

## Final Verdict — Updated Sprint 757

```
FOUNDATION READY BUT NOT FULL SITE-WIDE

Sprint 757 closed the two primary blockers:
  ✅ dispatchUIIntent() is now live-wired in DonnaAssistantButton.tsx
  ✅ Guided operator runtime state (currentOperatorId + currentOperatorStep) is tracked

What works after Sprint 757:
  - Architecture invariant violations (direct sends, deletions, bypass queue, cross-tenant)
    are intercepted by the structured dispatcher BEFORE the COO router fires
  - Explicit navigation commands route via the dispatcher's 16-pattern NAV_PATTERNS
  - Guided operator phrases launch the 6 domain operators with step 1 prompt displayed
  - GODmode dispatch, COO router, draft/approval, and all legacy routing are unchanged

Remaining gap preventing full site-wide certification:
  - Coach/player/parent portals are not yet wired to the dispatcher
    (only the Director layout has DonnaAssistantButton — the primary panel)

No architecture invariants were weakened. No protected files were modified.
No migrations, no package installs, no AI/DB calls in certification files.
```

---

*Produced by Sprint 756 — 2026-05-24*
*Dispatcher wired: Sprint 757 — 2026-05-24*
*Infrastructure: Sprints 753–755*
*Godmode base certification: Sprint 744 (9.3/10)*
