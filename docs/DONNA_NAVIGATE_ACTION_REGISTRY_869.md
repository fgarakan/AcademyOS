# Sprint 869 — DONNA Navigate Action Registry V1

**Date:** 2026-05-27
**Sprint:** 869
**Type:** Implementation — register Sprint 868 focus targets as typed navigate actions in `donnaUIActionRegistry.ts`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Wires the 18 `data-donna-focus-id` targets added in Sprint 868 into DONNA's UI action registry
so the dispatcher layer can navigate users to specific page sections, not just to pages.

**Changes:**
1. `UIAction` interface — one new optional field: `focusTargetId?: string`
2. `DONNA_UI_ACTIONS` — 14 new navigate-to-section actions in new Category 1A

**Not in scope:**
- `donnaContextActions.ts` — not touched
- `donnaFocusTarget.ts` — not touched (setDonnaFocusTarget/getDonnaFocusTarget unchanged)
- `DonnaHighlightBanner.tsx` — not touched
- `donnaPageContextEngine.ts` — not touched
- Any DB queries, server actions, migrations, schema changes
- Dispatcher wiring (calling `setDonnaFocusTarget` before `router.push`) — Sprint 870 scope
- Any UI changes

---

## Audit Findings (pre-869)

### Existing navigate actions (2)
| ID | Status | Notes |
|---|---|---|
| `navigate_to_page` | `wired` | General router.push — no section targeting |
| `navigate_to_player_profile` | `partially_wired` | Specific player route; no section |
| `navigate_back` | `pattern_exists` | router.back(); no section |

### Missing
- No actions targeted specific DOM sections (`focusTargetId` not a field)
- No action could encode both route + highlight target in a single typed registry entry
- 18 Sprint 868 DOM targets had no corresponding action registry entries

### UIAction interface before Sprint 869
```typescript
pageGuard: string[]         // Routes where this action is valid ([] = any page)
blockedReason: string | null
```

### UIAction interface after Sprint 869
```typescript
pageGuard: string[]         // Routes where this action is valid ([] = any page)
focusTargetId?: string      // Sprint 869 — data-donna-focus-id of the section to highlight after navigation (undefined for page-level actions)
blockedReason: string | null
```

**Backward compatibility:** The field is optional. All 25 pre-869 actions remain valid without it — TypeScript does not require optional fields.

---

## New Actions — Category 1A (14 entries)

All Category 1A actions share these properties:
- `safetyClass: 'always_safe'` — navigation only, no mutation
- `method: 'route_push'` — same method as existing navigate actions
- `requiresApproval: false`
- `approvalRoute: null`
- `blockedReason: null`
- `implementationStatus: 'pattern_exists'` — DOM targets exist (Sprint 868), dispatcher wiring is Sprint 870 scope
- `pageGuard: []` — callable from any page (DONNA uses context to resolve route params)

### Director session actions

| ID | focusTargetId | Route | allowedRoles |
|---|---|---|---|
| `navigate_to_sessions_list` | `session-list` | `/director/sessions` | `['academy_director', 'head_coach']` |
| `navigate_to_session_blocks` | `session-blocks` | `/director/sessions/[sessionId]` | `['academy_director', 'head_coach']` |
| `navigate_to_session_attendance` | `session-roster-attendance` | `/director/sessions/[sessionId]` | `['academy_director', 'head_coach']` |
| `navigate_to_session_roster_intelligence` | `session-roster-intelligence` | `/director/sessions/[sessionId]` | `['academy_director', 'head_coach']` |

### Director template actions

| ID | focusTargetId | Route | allowedRoles |
|---|---|---|---|
| `navigate_to_template_stepper` | `template-stepper` | `/director/class-templates/[templateId]` | `['academy_director', 'head_coach']` |
| `navigate_to_template_blocks` | `template-blocks-section` | `/director/class-templates/[templateId]` | `['academy_director', 'head_coach']` |
| `navigate_to_template_generate_session` | `template-generate-session` | `/director/class-templates/[templateId]` | `['academy_director', 'head_coach']` |

### Coach hub + players

| ID | focusTargetId | Route | allowedRoles |
|---|---|---|---|
| `navigate_to_coach_home_today` | `coach-today-sessions` | `/coach` | `['head_coach', 'coach']` |
| `navigate_to_coach_players` | `coach-player-list` | `/coach/players` | `['head_coach', 'coach']` |

### Coach session actions

| ID | focusTargetId | Route | allowedRoles |
|---|---|---|---|
| `navigate_to_coach_lesson_plan` | `coach-lesson-plan` | `/coach/sessions/[sessionId]` | `['head_coach', 'coach']` |
| `navigate_to_coach_run_session` | `coach-run-session` | `/coach/sessions/[sessionId]` | `['head_coach', 'coach']` |
| `navigate_to_coach_wrap_up_link` | `coach-wrap-up-link` | `/coach/sessions/[sessionId]` | `['head_coach', 'coach']` |

### Coach wrap-up actions

| ID | focusTargetId | Route | allowedRoles |
|---|---|---|---|
| `navigate_to_wrapup_question` | `wrapup-question-card` | `/coach/sessions/[sessionId]/wrap-up` | `['head_coach', 'coach']` |
| `navigate_to_wrapup_actions` | `wrapup-nav-actions` | `/coach/sessions/[sessionId]/wrap-up` | `['head_coach', 'coach']` |

---

## Dynamic Route Convention

`focusTargetId` values match `data-donna-focus-id` attributes exactly. Routes encoded in `notes`
follow the `[param]` naming convention already in use across the registry (e.g. `[sessionId]`,
`[templateId]`). The existing `getUIActionsForPage()` lookup uses
`guard.replace(/\[.*?\]/g, '[^/]+')` to resolve parameterized patterns — unchanged.

The dispatcher (Sprint 870) is responsible for:
1. Resolving `[sessionId]`/`[templateId]` from DONNA context (e.g. `params.sessionId`)
2. Calling `setDonnaFocusTarget({ route: resolvedRoute, targetId: focusTargetId, label: displayName })`
3. Calling `router.push(resolvedRoute)` — DonnaHighlightBanner handles the rest on mount

---

## Role Safety

| Action group | Director routes | Coach routes |
|---|---|---|
| `navigate_to_sessions_list`, `navigate_to_session_*`, `navigate_to_template_*` | `['academy_director', 'head_coach']` ✅ | ❌ not in allowedRoles |
| `navigate_to_coach_*`, `navigate_to_wrapup_*` | ❌ not in allowedRoles | `['head_coach', 'coach']` ✅ |

No coach action targets a director route. No director action targets a coach route. No parent or player routes touched.

---

## Registry Coverage — Before vs After

| Metric | Pre-869 | Post-869 |
|---|---|---|
| Total actions | 25 | 39 |
| Category 1A (navigate to section) | 0 | 14 |
| navigate_to_* actions | 2 | 16 |
| Actions with focusTargetId | 0 | 14 |
| `implementationStatus: 'pattern_exists'` count | 8 | 22 |
| `implementationStatus: 'wired'` count | 11 | 11 (unchanged) |

---

## Dispatcher Pattern (for Sprint 870)

For each Category 1A action, the dispatcher should:

```typescript
import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import { getUIActionById } from '@/lib/donna/donnaUIActionRegistry'

function dispatchNavigateToSection(actionId: string, resolvedRoute: string) {
  const action = getUIActionById(actionId)
  if (!action?.focusTargetId) return
  setDonnaFocusTarget({
    route: resolvedRoute,
    targetId: action.focusTargetId,
    label: action.displayName,
  })
  router.push(resolvedRoute)
}
```

This pattern:
- Never reads private data (route + element id + display name only)
- Is always safe (sessionStorage write + navigation)
- Handles the existing `getDonnaFocusTarget` → `DonnaHighlightBanner` flow with no changes

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaUIActionRegistry.ts` | (1) Added `focusTargetId?: string` to `UIAction` interface; (2) Added Category 1A with 14 new navigate-to-section actions |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/lib/donna/donnaFocusTarget.ts` | No changes needed — types and utilities unchanged |
| `src/components/donna/DonnaHighlightBanner.tsx` | Unchanged — already handles all focus targets correctly |
| `src/app/director/_actions/donnaContextActions.ts` | Explicitly out of scope |
| `src/lib/donna/donnaPageContextEngine.ts` | No changes needed this sprint |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure TypeScript registry |
| No DB reads | ✅ — no queries |
| No mutations | ✅ — navigation + visual guidance only |
| No new imports | ✅ — no new dependencies |
| No package installs | ✅ — none |
| No parent/player data | ✅ — no parent or player routes in new actions |
| Role boundaries preserved | ✅ — director/coach roles separate in allowedRoles |
| Existing 25 actions unchanged | ✅ — only one optional field added to interface |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-869)

| Limitation | Impact | Resolution |
|---|---|---|
| `implementationStatus: 'pattern_exists'` for all 14 new actions | DONNA cannot dispatch these actions yet — dispatcher wiring (calling `setDonnaFocusTarget` before `router.push`) not deployed | Sprint 870 |
| Dynamic route params not resolved in registry | Registry stores pattern (`[sessionId]`), not concrete IDs — dispatcher must resolve from DONNA context | Sprint 870 dispatcher |
| Step-conditional template targets | `template-blocks-section` and `template-generate-session` only in DOM on Steps 3 and 5 respectively — highlight silently no-ops on wrong step | Acceptable; future sprint could add step-navigation |
| 4 Sprint 868 IDs not yet registered | `session-group-assignment`, `template-level-picker`, `coach-players-section`, `coach-today-sessions` (partially — `navigate_to_coach_home_today` covers the section) | Low priority — add if dispatcher use case arises |

---

## Sprint 870 Recommendation

**Sprint 870 — DONNA Navigate Dispatcher V1**

- Implement `dispatchDonnaNavigateToSection(actionId, resolvedRoute)` utility
- Wire to DONNA answer layer: when DONNA answer includes a navigate-to-section intent, resolve the route from context params (sessionId, templateId) and call dispatcher
- Update `implementationStatus` of wired actions to `'wired'`
- No DB changes required
- No new DOM attributes required

Projected score improvement: 0.5–1.0 point for actionable section navigation across director and coach surfaces.
