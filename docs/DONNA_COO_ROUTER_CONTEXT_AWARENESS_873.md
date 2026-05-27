# Sprint 873 — DONNA COO Router Context Awareness V1

**Date:** 2026-05-27
**Sprint:** 873
**Type:** Implementation — follow-up context propagation for section-navigation results + clarification surfacing
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Sprint Goal

Wire DONNA's last-known session/template context into the COO routing path so that:
1. Section-navigation results from `handleUIDispatch` update `sessionIntentContext` (enabling anaphoric follow-ups like "show me", "take me there")
2. Section-nav clarification messages (missing required ID) are surfaced to the user instead of silently suppressed

---

## Audit Finding — COO Path vs UI Dispatch Path

The Sprint 872 recommendation stated: "Sprint 873 should wire `lastKnownContextParamsRef` into the COO routing path."

After reading `src/lib/donna/donnaConversationalRouter.ts` and `src/components/assistant/DonnaAssistantButton.tsx`:

**Finding:** Section navigation commands ("show me session blocks", "go to attendance") are caught by `handleUIDispatch` **before** the COO (`handleDonnaCooPrompt`) ever runs. The COO only executes when `handleUIDispatch` returns `false`.

**COO path (`handleDonnaCooPrompt`) does NOT:**
- Call `dispatchUIIntent`
- Generate dynamic section routes (only static `nextStepHref` links)
- Need access to `lastKnownContextParamsRef`

**Conclusion:** Wiring `lastKnownContextParamsRef` into the COO path itself is not needed — the COO never handles section navigation. However, two related gaps existed in `handleUIDispatch`'s handling of section-nav results:

### Gap 1 — `sessionIntentContext` not updated by navigate results

`handleUIDispatch` called `router.push(result.route)` or dispatched `donna:highlight` but **never called `setSessionIntentContext`**.

`resolveFollowUp` in `donnaFollowUpResolver.ts` uses `sessionIntentContext.lastSuggestedNavigationHref` to resolve anaphoric phrases ("show me", "take me there", "go there"). Previously, this only received hrefs from COO suggestions — not from `handleUIDispatch` section-nav results. If a user said "session blocks" → DONNA navigated → user said "show me" — the follow-up resolver had no record of where DONNA just went.

**Fix:** After `setDonnaFocusTarget(result.focusTarget)`, set `sessionIntentContext` with `lastSuggestedNavigationHref: result.route` and `lastSuggestedNavigationLabel: result.focusTarget?.label ?? 'that section'`.

### Gap 2 — Section-nav clarification silently suppressed

`dispatchUIIntent` returns `{ kind: 'clarification_needed', actionId: string, confidence: 'partial' }` when a Category 1A section phrase matched but the required dynamic param (sessionId / templateId) was unavailable from both URL and ctxParams (Sprint 872's "first-time user" case).

`handleUIDispatch` previously had **no handler for `clarification_needed`** — it fell through to `return false`, causing the COO to handle the phrase as a general query. The user never received DONNA's guidance: *"I can take you to Session Blocks, but I need more context. Open a specific session or template first, then ask again."*

**Fix:** Added `clarification_needed` handler guarded by `result.actionId !== null && result.confidence === 'partial'` — distinguishes section-nav clarification from the generic dispatcher fallback (`actionId: null`, which must still fall through to the COO).

---

## Implementation

### `src/components/assistant/DonnaAssistantButton.tsx`

**1. Navigate case — add `setSessionIntentContext` (Sprint 873):**

Before Sprint 873, the navigate block was:
```typescript
if (result.focusTarget) setDonnaFocusTarget(result.focusTarget)
// Sprint 871 same-page event / router.push ...
```

After Sprint 873:
```typescript
if (result.focusTarget) setDonnaFocusTarget(result.focusTarget)
// Sprint 873 — update follow-up resolver context so anaphoric follow-ups ("show me",
// "take me there", "go there") after a section navigation command re-navigate to the
// same place DONNA just went. Previously handleUIDispatch navigate results were invisible
// to sessionIntentContext — follow-up resolver used the last COO suggestion instead.
setSessionIntentContext({
  lastIntentFamily: 'coo_answer',
  lastResultSectionCount: null,
  lastResultHighPriorityCount: null,
  lastResultItemCount: null,
  lastSuggestedNavigationHref: result.route,
  lastSuggestedNavigationLabel: result.focusTarget?.label ?? 'that section',
  lastTopicLabel: result.focusTarget?.label ?? null,
  setAt: Date.now(),
})
// Sprint 871 same-page / cross-page branch (unchanged)
if (result.route === pathname) {
  window.dispatchEvent(new CustomEvent('donna:highlight'))
} else {
  router.push(result.route)
}
return true
```

**2. Clarification case — new handler block (Sprint 873):**

Inserted between navigate block and guided_operator block:
```typescript
// Sprint 873 — surface section-nav clarification to the user.
// Fires when a Category 1A phrase matched (actionId !== null) but the required dynamic
// param (sessionId / templateId) was unavailable from both URL and ctxParams.
// Guard: actionId !== null distinguishes section-nav clarification from the generic
// dispatchUIIntent fallback (actionId: null), which must still fall through to the COO.
if (result.kind === 'clarification_needed' && result.actionId !== null && result.confidence === 'partial') {
  setCommandResponse({ message: result.message, type: 'info', label: 'DONNA' })
  setCooThread(prev => [...prev.slice(-4), { user: text, donna: result.message, type: 'info' as const }])
  speakDonna(result.message)
  return true
}
```

---

## End-to-End Flow Examples

### Example 1 — Anaphoric follow-up after section navigation (the improvement)

**Scenario:** Director on `/director/sessions/abc-123` says "session blocks" → DONNA navigates → Director says "show me"

**Before Sprint 873:**
1. "session blocks" → `handleUIDispatch` → navigate result → `router.push('/director/sessions/abc-123')`
2. `sessionIntentContext` NOT updated — still holds last COO suggestion (or null)
3. "show me" → `resolveFollowUp` → `context.lastSuggestedNavigationHref` → null or wrong href
4. Follow-up falls through to COO → generic response

**After Sprint 873:**
1. "session blocks" → `handleUIDispatch` → navigate result → `setSessionIntentContext({ lastSuggestedNavigationHref: '/director/sessions/abc-123', ... })`
2. `router.push('/director/sessions/abc-123')` (same as before)
3. "show me" → `resolveFollowUp` → `context.lastSuggestedNavigationHref` = `/director/sessions/abc-123`
4. Returns navigation result → `handleDonnaCooPrompt` executes → DONNA navigates again

### Example 2 — Section-nav clarification surfaced (the improvement)

**Scenario:** Director on `/director` (fresh session, never visited a session), says "session blocks"

**Before Sprint 873:**
1. `dispatchUIIntent` → `clarification_needed` (no sessionId in URL or ctxParams)
2. `handleUIDispatch` → no handler for `clarification_needed` → returns `false`
3. COO runs → treats "session blocks" as general query → generic response
4. User gets wrong answer, no guidance

**After Sprint 873:**
1. `dispatchUIIntent` → `clarification_needed` (`actionId: 'navigate_to_session_blocks'`, `confidence: 'partial'`)
2. `handleUIDispatch` → handler fires: `result.kind === 'clarification_needed' && result.actionId !== null`
3. `setCommandResponse({ message: "I can take you to Session Blocks, but I need more context. Open a specific session or template first, then ask again.", type: 'info', label: 'DONNA' })`
4. `speakDonna(...)` → user hears guidance
5. Returns `true` → COO does NOT run

### Example 3 — Generic clarification still falls through (unchanged)

**Scenario:** Ambiguous phrase that `dispatchUIIntent` cannot match → `clarification_needed` with `actionId: null`

1. `dispatchUIIntent` → `{ kind: 'clarification_needed', actionId: null, confidence: 'partial' }`
2. `handleUIDispatch` → guard `result.actionId !== null` → **false** → handler skipped
3. Returns `false` → COO runs (unchanged behaviour)

---

## Files Modified

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | (1) Added `setSessionIntentContext` call in navigate block to make section-nav results visible to follow-up resolver; (2) Added `clarification_needed` handler block (guard: `actionId !== null && confidence === 'partial'`) to surface section-nav guidance to the user instead of falling through to COO |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/lib/donna/donnaConversationalRouter.ts` | COO path does not call `dispatchUIIntent` and does not handle section navigation — no change needed |
| `src/lib/donna/donnaUIActionDispatcher.ts` | Sprint 872 changes sufficient; signatures already accept `ctxParams?` |
| `src/lib/donna/donnaUIActionRegistry.ts` | No new actions needed |
| `src/lib/donna/donnaFollowUpResolver.ts` | `resolveFollowUp` already uses `lastSuggestedNavigationHref` — now populated by Sprint 873 fix |
| `src/components/donna/DonnaHighlightBanner.tsx` | Sprint 871 changes sufficient |
| `src/lib/donna/donnaFocusTarget.ts` | No changes needed |
| `src/app/director/_actions/donnaContextActions.ts` | Explicitly out of scope |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — `setSessionIntentContext` is React state only |
| No DB reads | ✅ — no queries added |
| No server actions | ✅ — all client-side |
| No mutations | ✅ — navigation + context state only |
| No new packages | ✅ — none |
| No parent/player route additions | ✅ — no new routes |
| No fake IDs | ✅ — `result.route` comes from dispatcher which validates IDs |
| Role boundaries preserved | ✅ — role checks unchanged in dispatcher |
| Backward compatible | ✅ — both new code paths are additions; existing paths unmodified |
| COO still runs when needed | ✅ — clarification handler guard ensures generic fallback still reaches COO |
| Sprint 872 ctxParams intact | ✅ — `lastKnownContextParamsRef` usage unchanged |
| Sprint 871 same-page event intact | ✅ — `donna:highlight` event dispatch unchanged |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-873)

| Limitation | Impact | Resolution |
|---|---|---|
| `sessionIntentContext.lastIntentFamily` set to `'coo_answer'` for navigate results | Semantic mismatch — navigate results are not COO answers, but `resolveFollowUp` only checks `lastSuggestedNavigationHref`, not `lastIntentFamily` | Low impact; follow-up navigation works correctly. Sprint 874+ could add `'section_nav'` as a dedicated family |
| Anaphoric follow-up requires COO path | After a section navigation, saying "show me" routes through `handleDonnaCooPrompt` → `resolveFollowUp` — not through `handleUIDispatch` | By design — follow-up resolver lives in the COO path |
| `lastSuggestedNavigationHref` is overwritten | Each new section nav result overwrites the previous href in `sessionIntentContext` | Expected; only the most recent nav is tracked |

---

## Sprint 874 Recommendation

**Sprint 874 — DONNA Context Memory Depth V1**

As the session grows, `sessionIntentContext` holds only the last COO/navigate result. Consider persisting a short DONNA-specific navigation history (last 3 routes) so that multi-step follow-ups ("and the one before that") can be resolved. Alternatively, Sprint 874 could focus on populating `openQuestions` from page context into the DONNA input placeholder for proactive guidance.

No DB changes or migrations required.
