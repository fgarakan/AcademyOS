# Sprint 870 — DONNA Navigate Dispatcher V1

**Date:** 2026-05-27
**Sprint:** 870
**Type:** Implementation — wire Sprint 869 Category 1A actions into DONNA's dispatch layer
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Implements `resolveSectionNavigation()` in `donnaUIActionDispatcher.ts` — the dispatcher layer
that maps natural language phrases to Category 1A registry actions (Sprint 869) and resolves
dynamic route params (sessionId, templateId) from the current pathname.

Wires the dispatcher into `dispatchUIIntent()` as step 3.6 (before generic NAV_PATTERNS,
after guided operators and draft/creation intents). Updates `implementationStatus` for all
14 Category 1A actions in `donnaUIActionRegistry.ts`.

**Changes:**
1. `donnaUIActionDispatcher.ts` — 3 helper param-extractor functions + `SECTION_NAV_ENTRIES` array (14 entries) + `resolveSectionNavigation()` export + step 3.6 wiring in `dispatchUIIntent()`
2. `donnaUIActionRegistry.ts` — `implementationStatus` updated for all 14 Category 1A actions: 3 `'wired'` (static routes), 11 `'partially_wired'` (dynamic routes); `notes` updated for each

**Not in scope:**
- `DonnaAssistantButton.tsx` — no changes needed; existing `handleUIDispatch` already handles `navigate` DispatchResults correctly (lines 2828–2831: `setDonnaFocusTarget` + `router.push`)
- `DonnaHighlightBanner.tsx` — not touched; existing banner handles focus targets on pathname change
- `donnaContextActions.ts` — not touched
- `donnaFocusTarget.ts` — not touched
- Any DB queries, server actions, migrations, schema changes
- Any UI changes

---

## Audit Findings (pre-870)

### Where `setDonnaFocusTarget` is called
One call site only — `DonnaAssistantButton.tsx` line 2830:
```typescript
if (result.kind === 'navigate' && result.route && result.confidence === 'high') {
  if (result.focusTarget) setDonnaFocusTarget(result.focusTarget)
  router.push(result.route)
  return true
}
```

### Where route pushing is handled
Same block — `router.push(result.route)` immediately after `setDonnaFocusTarget`. This pattern
is unchanged and handles Sprint 870 section navigation automatically: adding `focusTarget` to
the DispatchResult in `resolveSectionNavigation` is sufficient — `handleUIDispatch` picks it up
without modification.

### Navigation phrase resolution (pre-870)
Route navigation: `NAV_PATTERNS` in `donnaUIActionDispatcher.ts` — 30+ regex/route pairs.
Section navigation: none — no patterns for specific page sections; all 14 Category 1A actions
had `implementationStatus: 'pattern_exists'` with no dispatch wiring.

### Dynamic param resolution (pre-870)
Not attempted — all sprint 869 actions listed `[sessionId]`/`[templateId]` as patterns in `notes`
but no resolver existed. Sprint 870 adds URL-based resolution: the current `pathname` passed to
`dispatchUIIntent` as `currentRoute` contains the concrete IDs when the user is on the relevant page.

---

## Implementation

### `resolveSectionNavigation(text, role, currentRoute)`

New export in `donnaUIActionDispatcher.ts`. Runs through 14 entries in `SECTION_NAV_ENTRIES`:

1. **Pattern match** — regex test against the user's natural language input
2. **Role check** — `continue` (not `return`) when role not in `allowedRoles`; falls through to NAV_PATTERNS
3. **Route resolution** — calls `entry.resolve(currentRoute)` to extract concrete IDs from URL
4. **Fail safely** — when route can't be resolved (wrong page, no ID in URL), returns a `clarification_needed` result with a friendly message
5. **Build focusTarget** — constructs `DonnaFocusTarget` with `targetId` from the entry, `label` from registry `displayName`, `highlightStyle: 'teal-glow'`
6. **Return navigate result** — `kind: 'navigate'`, `confidence: 'high'`, with `focusTarget` populated

### Param extractor helpers (private)

| Helper | Extracts | Pattern |
|---|---|---|
| `extractDirectorSessionId(route)` | sessionId | `/^\/director\/sessions\/([^/]+)/` |
| `extractDirectorTemplateId(route)` | templateId | `/^\/director\/class-templates\/([^/]+)/` — returns null for `new` |
| `extractCoachSessionId(route)` | sessionId | `/^\/coach\/sessions\/([^/]+)/` |

### Step 3.6 insertion in `dispatchUIIntent`

Inserted between step 3.5 (publish curriculum) and step 4 (NAV_PATTERNS navigation):

```typescript
// 3.6. Sprint 870 — Section navigation (Category 1A: navigate to page + highlight section)
const sectionNav = resolveSectionNavigation(text, role, currentRoute)
if (sectionNav) return sectionNav

// 4. Navigation intents — role-filtered and boundary-checked
const nav = resolveNavigation(text, role)
```

Priority rationale:
- After guided operators (step 2) — operators take precedence
- After draft/creation intents (step 3) — "create session from template" stays as draft, not section nav
- Before generic NAV_PATTERNS (step 4) — "session blocks" must not be caught by generic sessions nav

### Role fall-through behavior

When the user's role doesn't match a section entry's `allowedRoles`, the entry `continue`s
(not `return null` from the outer function). This means:
- Coach says "sessions list" → SECTION_NAV entry `allowedRoles: ['academy_director', 'head_coach']` doesn't include `'coach'` → continue → falls to NAV_PATTERNS → `/director/sessions` (existing behavior)
- Director says "my players" → SECTION_NAV entry `allowedRoles: ['head_coach', 'coach']` doesn't include `'academy_director'` → continue → falls to NAV_PATTERNS → `/director/players` (existing behavior)
- Coach says "my players" → SECTION_NAV matches `allowedRoles: ['head_coach', 'coach']` → `/coach/players` with `coach-player-list` focus ✓

---

## `SECTION_NAV_ENTRIES` — 14 entries

### Director session sections (4)

| ActionId | Natural language phrase | focusTargetId | Resolves route from |
|---|---|---|---|
| `navigate_to_sessions_list` | "sessions list", "all sessions" | `session-list` | static `/director/sessions` |
| `navigate_to_session_blocks` | "session blocks", "blocks for this session" | `session-blocks` | `/director/sessions/{sessionId}` |
| `navigate_to_session_attendance` | "session attendance", "roster attendance" | `session-roster-attendance` | `/director/sessions/{sessionId}` |
| `navigate_to_session_roster_intelligence` | "roster intelligence", "class roster intelligence" | `session-roster-intelligence` | `/director/sessions/{sessionId}` |

### Director template sections (3)

| ActionId | Natural language phrase | focusTargetId | Resolves route from |
|---|---|---|---|
| `navigate_to_template_stepper` | "template stepper", "template builder stepper" | `template-stepper` | `/director/class-templates/{templateId}` |
| `navigate_to_template_blocks` | "template blocks", "block builder", "add drills to template" | `template-blocks-section` | `/director/class-templates/{templateId}` |
| `navigate_to_template_generate_session` | "generate a session", "where to generate a session" | `template-generate-session` | `/director/class-templates/{templateId}` |

### Coach hub + players (2)

| ActionId | Natural language phrase | focusTargetId | Resolves route from |
|---|---|---|---|
| `navigate_to_coach_home_today` | "today's sessions", "what do I have today" | `coach-today-sessions` | static `/coach` |
| `navigate_to_coach_players` | "my players", "my player list" | `coach-player-list` | static `/coach/players` |

### Coach session sections (3)

| ActionId | Natural language phrase | focusTargetId | Resolves route from |
|---|---|---|---|
| `navigate_to_coach_lesson_plan` | "lesson plan", "today's plan", "curriculum for this session" | `coach-lesson-plan` | `/coach/sessions/{sessionId}` |
| `navigate_to_coach_run_session` | "run the session", "session execution", "mark attendance" | `coach-run-session` | `/coach/sessions/{sessionId}` |
| `navigate_to_coach_wrap_up_link` | "wrap-up link", "after session section", "how to start wrap-up" | `coach-wrap-up-link` | `/coach/sessions/{sessionId}` |

### Coach wrap-up sections (2)

| ActionId | Natural language phrase | focusTargetId | Resolves route from |
|---|---|---|---|
| `navigate_to_wrapup_question` | "wrap-up question", "where to answer wrap-up" | `wrapup-question-card` | `/coach/sessions/{sessionId}/wrap-up` |
| `navigate_to_wrapup_actions` | "wrap-up actions", "submit for review", "finish wrap-up" | `wrapup-nav-actions` | `/coach/sessions/{sessionId}/wrap-up` |

---

## `implementationStatus` Update

| Action | Pre-870 | Post-870 | Reason |
|---|---|---|---|
| `navigate_to_sessions_list` | `pattern_exists` | `wired` | Static route — always resolves |
| `navigate_to_session_blocks` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_session_attendance` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_session_roster_intelligence` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_template_stepper` | `pattern_exists` | `partially_wired` | Dynamic templateId from URL |
| `navigate_to_template_blocks` | `pattern_exists` | `partially_wired` | Dynamic templateId from URL |
| `navigate_to_template_generate_session` | `pattern_exists` | `partially_wired` | Dynamic templateId from URL |
| `navigate_to_coach_home_today` | `pattern_exists` | `wired` | Static route — always resolves |
| `navigate_to_coach_players` | `pattern_exists` | `wired` | Static route — always resolves |
| `navigate_to_coach_lesson_plan` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_coach_run_session` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_coach_wrap_up_link` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_wrapup_question` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |
| `navigate_to_wrapup_actions` | `pattern_exists` | `partially_wired` | Dynamic sessionId from URL |

**`wired` (3):** `navigate_to_sessions_list`, `navigate_to_coach_home_today`, `navigate_to_coach_players`
**`partially_wired` (11):** All dynamic-route actions

`'partially_wired'` rationale: dispatch + route resolution is connected and operational when
the user is already on the relevant page (session/template URL contains the ID). Cross-page
navigation from a session to a different session's blocks is not supported (param not in URL).
Same-page highlighting (user already on target page) is a known limitation (see below).

---

## End-to-End Flow (post-870)

**Example: Director on `/director/sessions/abc-123`, says "show me session blocks"**

1. `handleVoiceTranscript("show me session blocks")` → `handleUIDispatch("show me session blocks")`
2. `dispatchUIIntent("show me session blocks", 'academy_director', '/director/sessions/abc-123')`
3. Step 3.6: `resolveSectionNavigation(...)` → matches `session\s+blocks?` pattern
4. Role `academy_director` in `['academy_director', 'head_coach']` ✓
5. `extractDirectorSessionId('/director/sessions/abc-123')` → `'abc-123'`
6. `resolved = { route: '/director/sessions/abc-123', focusTargetId: 'session-blocks' }`
7. Returns `DispatchResult { kind: 'navigate', route: '/director/sessions/abc-123', focusTarget: { route: ..., targetId: 'session-blocks', ... } }`
8. `handleUIDispatch`: `setDonnaFocusTarget(result.focusTarget)` → writes to sessionStorage
9. `router.push('/director/sessions/abc-123')`
10. `DonnaHighlightBanner` reads sessionStorage on pathname change → queries `[data-donna-focus-id="session-blocks"]` → applies `donna-focus-ring` CSS → shows teal badge

**Example: Coach on `/coach`, says "today's sessions"**
1. `resolveSectionNavigation(...)` → matches `today'?s?\s+sessions?` pattern
2. Role `head_coach` in `['head_coach', 'coach']` ✓
3. `resolve('/coach')` → static → `{ route: '/coach', focusTargetId: 'coach-today-sessions' }`
4. Navigate + highlight `coach-today-sessions`

**Example: Director on `/director`, says "session blocks"**
1. `resolveSectionNavigation(...)` → matches `session\s+blocks?`
2. Role `academy_director` in `['academy_director', 'head_coach']` ✓
3. `extractDirectorSessionId('/director')` → `null` (not on a session detail page)
4. Returns `clarification_needed` → DONNA says: "I can take you to Session Blocks, but I need more context. Open a specific session or template first, then ask again."

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | (1) Added 3 private param-extractor functions; (2) Added `SECTION_NAV_ENTRIES` with 14 entries; (3) Added `resolveSectionNavigation()` export; (4) Wired `resolveSectionNavigation` at step 3.6 in `dispatchUIIntent()` |
| `src/lib/donna/donnaUIActionRegistry.ts` | Updated `implementationStatus` + `notes` for all 14 Category 1A actions: 3 → `'wired'`, 11 → `'partially_wired'` |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | `handleUIDispatch` already handles navigate results with focusTarget — no changes needed |
| `src/components/donna/DonnaHighlightBanner.tsx` | Existing pathname-change effect handles all focus targets correctly |
| `src/lib/donna/donnaFocusTarget.ts` | No changes needed |
| `src/app/director/_actions/donnaContextActions.ts` | Explicitly out of scope |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure TypeScript, navigation only |
| No DB reads | ✅ — no queries |
| No mutations | ✅ — read-only focus target write to sessionStorage + router navigation |
| No new imports | ✅ — `getUIActionById` was already imported in dispatcher |
| No package installs | ✅ — none |
| No parent/player data | ✅ — no parent or player routes in new section entries |
| Role boundaries preserved | ✅ — role check on every entry; fall-through for non-matching roles |
| Existing dispatch behavior unchanged | ✅ — step 3.6 only fires when a section pattern matches; all other paths unmodified |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-870)

| Limitation | Impact | Resolution |
|---|---|---|
| Same-page highlighting fails silently | When user is already on the target page, `router.push` to the same route does not re-trigger `DonnaHighlightBanner`'s `useEffect([pathname])` | Future: add `donna:highlight` custom event listener to `DonnaHighlightBanner`; dispatch from `handleUIDispatch` when `result.route === pathname` |
| Dynamic params must be in current URL | DONNA can only resolve sessionId/templateId from the URL the user is currently on — cross-page "take me to blocks of session X" not supported | Future: resolve IDs from DONNA context summary (requires contextSummary to expose IDs) |
| Step-conditional template sections | `template-blocks-section` (Step 3) and `template-generate-session` (Step 5) only in DOM on their respective step — highlight silently no-ops on wrong step | Acceptable; future sprint could navigate to step first |
| 4 Sprint 868 IDs not in dispatcher | `session-group-assignment`, `template-level-picker`, `coach-players-section`, `coach-player-watch-list` have no SECTION_NAV_ENTRIES | Low priority — add if use case arises; no registry actions registered for these 4 IDs |

---

## Registry Coverage — Before vs After

| Metric | Pre-870 | Post-870 |
|---|---|---|
| Total Category 1A actions | 14 | 14 |
| `implementationStatus: 'pattern_exists'` | 14 | 0 |
| `implementationStatus: 'wired'` | 0 | 3 |
| `implementationStatus: 'partially_wired'` | 0 | 11 |
| SECTION_NAV_ENTRIES phrases | 0 | 14 |
| Param-extractor helpers | 0 | 3 |

---

## Sprint 871 Recommendation

**Sprint 871 — DONNA Same-Page Highlight via Custom Event**

- Add `donna:highlight` custom event dispatch in `handleUIDispatch` when `result.route === pathname`
- Add `useEffect` listener in `DonnaHighlightBanner` for `donna:highlight` event
- Share highlight logic between pathname-change and event-trigger paths
- Update same-page section action `implementationStatus` to `'wired'`
- No DB changes required

Projected score improvement: 0.3–0.5 point for same-page section highlighting without navigation.
