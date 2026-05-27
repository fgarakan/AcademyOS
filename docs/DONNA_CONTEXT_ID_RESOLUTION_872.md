# Sprint 872 — DONNA Context ID Resolution V1

**Date:** 2026-05-27
**Sprint:** 872
**Type:** Implementation — cross-page section navigation ID resolution via context params
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Problem (pre-872)

Sprint 870 wired 11 dynamic Category 1A section-navigation actions with `implementationStatus: 'partially_wired'`.
The limitation: `sessionId` and `templateId` were extracted **only from the current URL pathname**.

This meant:
- Director on `/director/sessions/abc-123` → `extractDirectorSessionId('/director/sessions/abc-123')` → `'abc-123'` ✅
- Director navigates to `/director` (dashboard) → `extractDirectorSessionId('/director')` → `null` → `clarification_needed` ❌

DONNA could not navigate to a session section if the user was anywhere other than the target session URL —
even if they had just been on that session page.

---

## Solution

Track session/template IDs from `deriveContextRequest(pathname)` in a persistent ref in
`DonnaAssistantButton`. The ref is updated on every pathname change but **never cleared** —
IDs survive navigation away from the detail page. These cached params are passed into
`dispatchUIIntent` → `resolveSectionNavigation` as a fallback source when URL extraction returns null.

### ID Resolution Order (post-872)

1. **Current URL param** — `extractDirectorSessionId(currentRoute)` / `extractDirectorTemplateId` / `extractCoachSessionId`
2. **Context params fallback** — `ctxParams?.sessionId` / `ctxParams?.templateId` from `lastKnownContextParamsRef`
3. **Clarification** — when both sources return null/undefined: `clarification_needed` (unchanged Sprint 870 fallback)

---

## Implementation

### `donnaUIActionDispatcher.ts`

**New exported type:**
```typescript
export type DonnaSectionNavParams = {
  sessionId?: string
  templateId?: string
}
```

**Updated `SectionNavEntry.resolve` signature:**
```typescript
resolve: (currentRoute: string, ctxParams?: DonnaSectionNavParams) => { route: string; focusTargetId: string } | null
```

**Updated 11 dynamic resolve functions — pattern:**
```typescript
// Before:
resolve: (route) => {
  const id = extractDirectorSessionId(route)
  if (!id) return null
  return { route: `/director/sessions/${id}`, focusTargetId: 'session-blocks' }
},

// After (Sprint 872):
resolve: (route, ctxParams) => {
  const id = extractDirectorSessionId(route) ?? ctxParams?.sessionId ?? null
  if (!id) return null
  return { route: `/director/sessions/${id}`, focusTargetId: 'session-blocks' }
},
```

Same pattern for all 11 entries:
- Director session (3): `extractDirectorSessionId(route) ?? ctxParams?.sessionId ?? null`
- Director template (3): `extractDirectorTemplateId(route) ?? ctxParams?.templateId ?? null`
- Coach session (3): `extractCoachSessionId(route) ?? ctxParams?.sessionId ?? null`
- Coach wrap-up (2): `extractCoachSessionId(route) ?? ctxParams?.sessionId ?? null`

**Updated `resolveSectionNavigation` signature:**
```typescript
export function resolveSectionNavigation(
  text: string,
  role: UIActionRole,
  currentRoute: string,
  ctxParams?: DonnaSectionNavParams,
): DispatchResult | null
```
Internal call: `entry.resolve(currentRoute, ctxParams)`.

**Updated `dispatchUIIntent` signature:**
```typescript
export function dispatchUIIntent(
  text: string,
  role: UIActionRole,
  currentRoute: string,
  ctxParams?: DonnaSectionNavParams,
): DispatchResult
```
Internal call: `resolveSectionNavigation(text, role, currentRoute, ctxParams)`.

---

### `DonnaAssistantButton.tsx`

**New ref:**
```typescript
// Sprint 872 — Track last known session/template ID for cross-page section navigation.
const lastKnownContextParamsRef = useRef<{ sessionId?: string; templateId?: string }>({})
```

**New useEffect — updates ref on every pathname change:**
```typescript
useEffect(() => {
  const req = deriveContextRequest(pathname, role)
  if (req.params?.sessionId) lastKnownContextParamsRef.current.sessionId = req.params.sessionId
  if (req.params?.templateId) lastKnownContextParamsRef.current.templateId = req.params.templateId
}, [pathname, role])
```

Design notes:
- Only **writes** params when the new route yields an ID (e.g., session detail, template detail, coach session).
- Never clears — so `{ sessionId: 'abc-123' }` persists after navigating to `/director` (dashboard).
- `deriveContextRequest` validates UUID format for director routes (P3/P4 UUID_RE check) before returning params.
  Coach session routes use non-empty string check (same as before). Prevents stale/malformed IDs from entering the ref.

**Updated `handleUIDispatch` call:**
```typescript
const result = dispatchUIIntent(text, uiActionRole, pathname, lastKnownContextParamsRef.current)
```

---

### `donnaUIActionRegistry.ts`

All 11 dynamic Category 1A actions upgraded from `'partially_wired'` → `'wired'`.

| Action | Pre-872 | Post-872 |
|---|---|---|
| `navigate_to_session_blocks` | `partially_wired` | `wired` |
| `navigate_to_session_attendance` | `partially_wired` | `wired` |
| `navigate_to_session_roster_intelligence` | `partially_wired` | `wired` |
| `navigate_to_template_stepper` | `partially_wired` | `wired` |
| `navigate_to_template_blocks` | `partially_wired` | `wired` |
| `navigate_to_template_generate_session` | `partially_wired` | `wired` |
| `navigate_to_coach_lesson_plan` | `partially_wired` | `wired` |
| `navigate_to_coach_run_session` | `partially_wired` | `wired` |
| `navigate_to_coach_wrap_up_link` | `partially_wired` | `wired` |
| `navigate_to_wrapup_question` | `partially_wired` | `wired` |
| `navigate_to_wrapup_actions` | `partially_wired` | `wired` |

**All 14 Category 1A actions are now `'wired'`.**

`'wired'` rationale: the dispatch + ID resolution mechanism is fully connected. URL extraction (first choice)
works when on the target page. Context param fallback (second choice) works cross-page after the user has
visited the detail page at least once in the session. Both trigger the same highlight + navigation flow.

---

## End-to-End Flow (post-872)

### Cross-page case (the improvement)

**Example: Director visits `/director/sessions/abc-123`, then navigates to `/director`, says "session blocks"**

1. Pathname changes: `/director/sessions/abc-123`
   → `deriveContextRequest('/director/sessions/abc-123', 'director')` → `{ params: { sessionId: 'abc-123' } }`
   → `lastKnownContextParamsRef.current = { sessionId: 'abc-123' }`

2. Pathname changes: `/director`
   → `deriveContextRequest('/director', 'director')` → no sessionId param
   → ref unchanged → still `{ sessionId: 'abc-123' }`

3. Director says "session blocks" → `handleUIDispatch("session blocks")`
   → `dispatchUIIntent("session blocks", 'academy_director', '/director', { sessionId: 'abc-123' })`
   → step 3.6: `resolveSectionNavigation("session blocks", 'academy_director', '/director', { sessionId: 'abc-123' })`
   → matches `session\s+blocks?`, role passes
   → `entry.resolve('/director', { sessionId: 'abc-123' })`
   → `extractDirectorSessionId('/director')` → null
   → `null ?? 'abc-123' ?? null` → `'abc-123'`
   → returns `{ route: '/director/sessions/abc-123', focusTargetId: 'session-blocks' }`

4. `handleUIDispatch`: `result.route ('/director/sessions/abc-123') !== pathname ('/director')`
   → `setDonnaFocusTarget(...)` → `router.push('/director/sessions/abc-123')`

5. On `/director/sessions/abc-123` mount: `DonnaHighlightBanner` fires, queries `[data-donna-focus-id="session-blocks"]` → applies teal glow

### On-page case (unchanged Sprint 870 + 871 behaviour)

Director already on `/director/sessions/abc-123`, says "session blocks":
- `extractDirectorSessionId('/director/sessions/abc-123')` → `'abc-123'` (first choice)
- ctxParams not needed
- `result.route === pathname` → Sprint 871 `donna:highlight` custom event fires
- Highlight without navigation

### First-time user (no prior navigation)

Director on `/director` (fresh session), never visited a session page, says "session blocks":
- `extractDirectorSessionId('/director')` → null
- `ctxParams?.sessionId` → undefined (ref is empty `{}`)
- `null ?? undefined ?? null` → null
- Returns `clarification_needed`: "I can take you to Session Blocks, but I need more context. Open a specific session or template first, then ask again."

---

## Registry Coverage — Before vs After

| Metric | Pre-872 | Post-872 |
|---|---|---|
| Category 1A `'wired'` | 3 | **14** |
| Category 1A `'partially_wired'` | 11 | **0** |
| Actions using URL-only ID resolution | 11 | 0 |
| Actions using URL + context-param fallback | 0 | 11 |
| Static-route actions (always resolve) | 3 | 3 |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | (1) Added `DonnaSectionNavParams` exported type; (2) Updated `SectionNavEntry.resolve` signature to accept `ctxParams?`; (3) Updated all 11 dynamic entries to use `?? ctxParams?.sessionId/templateId ?? null` fallback; (4) Updated `resolveSectionNavigation` signature + internal call; (5) Updated `dispatchUIIntent` signature + call to `resolveSectionNavigation` |
| `src/components/assistant/DonnaAssistantButton.tsx` | (1) Added `lastKnownContextParamsRef` ref; (2) Added `useEffect([pathname, role])` that updates ref via `deriveContextRequest`; (3) Updated `handleUIDispatch` to pass ref value as `ctxParams` to `dispatchUIIntent` |
| `src/lib/donna/donnaUIActionRegistry.ts` | Updated `implementationStatus` from `'partially_wired'` → `'wired'` for all 11 dynamic Category 1A actions; updated `notes` to reference Sprint 872 context-param fallback |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/donnaContextTypes.ts` | No changes needed — `deriveContextRequest` used as-is; no new exports required |
| `src/components/donna/DonnaHighlightBanner.tsx` | Sprint 871 changes sufficient; no new event paths needed |
| `src/lib/donna/donnaFocusTarget.ts` | No changes needed |
| `src/app/director/_actions/donnaContextActions.ts` | Explicitly out of scope |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — ref is in-memory only (React useRef) |
| No DB reads | ✅ — `deriveContextRequest` is a pure function; no DB access |
| No server actions | ✅ — `deriveContextRequest` is a client-side utility |
| No mutations | ✅ — navigation + visual guidance only |
| No new packages | ✅ — none |
| No parent/player route additions | ✅ — no new routes |
| No fake IDs | ✅ — IDs come from `deriveContextRequest` which validates UUID format for director routes |
| Role boundaries preserved | ✅ — allowedRoles check unchanged in `resolveSectionNavigation` |
| Backward compatible | ✅ — `ctxParams` optional in all updated signatures; existing call sites without ctxParams work unchanged |
| URL-based resolution still first | ✅ — `extractDirectorSessionId(route) ?? ctxParams?.sessionId` — URL is always tried first |
| Sprint 871 same-page event preserved | ✅ — `donna:highlight` event path and Sprint 871 `result.route === pathname` check unchanged |
| Sprint 870 clarification preserved | ✅ — when both URL and ctxParams give null, still returns `clarification_needed` |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-872)

| Limitation | Impact | Resolution |
|---|---|---|
| Ref persists across sessions | If a director visits session A, then a different director logs in without refreshing, the ref still has session A's ID | Acceptable: ref is in-memory, cleared on page reload; multi-user on same browser tab is an edge case |
| Step-conditional template targets | `template-blocks-section`/`template-generate-session` only in DOM on their stepper step | Acceptable; no change from Sprint 870 |
| 4 Sprint 868 IDs not registered | `session-group-assignment`, `template-level-picker`, `coach-players-section`, `coach-player-watch-list` | Low priority |
| Director-scoped ctxParams used for cross-role navigation | A head_coach visiting `/director/sessions/X` stores `sessionId: X`, then saying "lesson plan" (coach action) uses that ID for `/coach/sessions/X` — correct, same session ID works for both routes | By design — session IDs are role-agnostic |

---

## Sprint 873 Recommendation

**Sprint 873 — DONNA COO Router Context Awareness**

Currently the COO (conversational router) does not pass context params. The next gap is that
AI-generated responses from the COO that include route navigation do not benefit from `ctxParams`.
Sprint 873 should wire `lastKnownContextParamsRef` into the COO routing path as well, so that
AI-generated navigation suggestions also resolve cross-page IDs correctly.

No DB changes or migrations required.
