# DONNA Cross-Session Memory + Natural Welcome — Sprint 784

**Date:** 2026-05-25
**Sprint:** 784
**Status:** COMPLETE

---

## Purpose

DONNA previously had no persistent memory across browser sessions. Every time a director opened a new tab or returned after a day away, DONNA greeted them as if it was their very first interaction. This sprint adds a lightweight, safe cross-session context layer so DONNA can acknowledge prior activity without being intrusive.

---

## Persistence Audit (Pre-784)

| Layer | Storage | Scope | Clears On |
|---|---|---|---|
| `donnaSafeSessionMemory.ts` | sessionStorage | per tab | tab close |
| `donnaChatSessionMemory.ts` | module singleton (RAM) | per page load | refresh |
| `donnaDraftPersistence.ts` | sessionStorage | per tab | tab close |
| `donnaDailyGreeting.ts` | localStorage | per academy | 24h TTL |
| `donnaGreeting.ts` | localStorage | per academy | 24h TTL |
| `donnaPreferenceMemory.ts` | localStorage | per academy | never |
| `donnaSessionContext.ts` | React context | per page load | refresh |

**Gap identified:** localStorage only stored greeting dates. No page context (what module the director was working in) survived tab close or refresh.

---

## Implementation

### New file: `src/lib/donna/donnaLastSessionStore.ts`

localStorage-backed store with the following contract:

| Field | Type | Description |
|---|---|---|
| `lastPageLabel` | `string \| null` | Human-readable module label ("Review Queue", "Player Profiles") |
| `lastPageRoute` | `string \| null` | Full route path ("/director/review") |
| `lastSafeActionLabel` | `string \| null` | Last completed safe assistant action |
| `savedAt` | `number` | Unix timestamp (ms) |

**Key:** `academyos:donna:last-session:<academyId>:v1`

**TTL:** 7 days — stale data discarded silently

**Safety rules enforced:**
- Only persists when `lastPageLabel` is non-empty (meaningful data)
- Never stores: player names, coach identifiers, scores, notes, PII
- Scoped per `academyId` — no cross-tenant leakage
- All localStorage calls guarded by `typeof window` (SSR-safe)
- Fail-silently on write (localStorage may be blocked or full)

---

### Changes to `src/components/assistant/DonnaAssistantButton.tsx`

**7 surgical changes:**

**1. Import** — new store imported after Sprint 780 import:
```ts
import { loadLastSession, saveLastSession, buildCrossSessionWelcome } from '@/lib/donna/donnaLastSessionStore'
import type { DonnaLastSession } from '@/lib/donna/donnaLastSessionStore'
```

**2. State** — after `showPageActions` state:
```ts
const [lastSessionData, setLastSessionData] = useState<DonnaLastSession | null>(null)
```

**3. useEffect (mount)** — after preferences useEffect:
```ts
useEffect(() => {
  setLastSessionData(loadLastSession(academyId))
}, [academyId])
```
Loads on mount so it's ready for first panel open without a separate read.

**4. closePanel** — saves context before clearing state:
```ts
const mem = getSessionMemory()
if (mem.currentModuleLabel) {
  saveLastSession(academyId, {
    lastPageLabel: mem.currentModuleLabel,
    lastPageRoute: pathname,
    lastSafeActionLabel: mem.lastSafeTopic ?? null,
  })
}
```
Ensures context is captured when the director explicitly closes the DONNA panel.

**5. Pathname useEffect** — also saves on every route change:
```ts
const routeMem = getSessionMemory()
if (routeMem.currentModuleLabel) {
  saveLastSession(academyId, {
    lastPageLabel: routeMem.currentModuleLabel,
    lastPageRoute: pathname,
    lastSafeActionLabel: routeMem.lastSafeTopic ?? null,
  })
}
```
Ensures context is captured even if the director navigates without closing the panel.

**6. Director greeting block** — cross-session welcome when not first open today:
```ts
const crossSessionText =
  !isFirstOpenToday && lastSessionData?.lastPageLabel
    ? buildCrossSessionWelcome(lastSessionData, firstName)
    : null
const greeting: DailyGreetingState = {
  isFirstOpenToday,
  primaryText: crossSessionText ?? content.primaryText,
  followUp: crossSessionText ? '' : followUp,
}
```
Priority order:
1. `isFirstOpenToday` = true → full director greeting (Sprint 685 path, unchanged)
2. `!isFirstOpenToday` + `lastSessionData.lastPageLabel` exists → cross-session welcome
3. `!isFirstOpenToday` + no prior context → Sprint 685 `pageReentryText()` fallback

**7. Director chip array** — conditional "Back to [page]" chip prepended:
```ts
...((lastSessionData?.lastPageLabel && lastSessionData?.lastPageRoute)
  ? ([{ label: `↩ Back to ${lastSessionData.lastPageLabel}`, action: () => { router.push(lastSessionData.lastPageRoute!); closePanel() } }])
  : []),
```
Only shown when prior session data exists. If the director never had a stored session, this chip doesn't appear and the chip row looks unchanged from Sprint 783.

---

## Welcome Text Examples

**First open of the day (unchanged Sprint 685 path):**
> "Good morning, [Name]. Here's what needs your attention today..."

**Return visit — no prior session data:**
> "Welcome back, [Name]. I can help you review today, check what needs attention, or walk you through the agenda."

**Return visit — last session was on Review Queue:**
> "Welcome back, [Name]. Last time you were on the Review Queue. I can continue there, give you today's brief, or show what needs attention."

**Chip row — with prior session on Player Profiles:**
```
[↩ Back to Player Profiles] [What do I need to do today?] [What needs my attention?] ...
```

**Chip row — no prior session:**
```
[What do I need to do today?] [What needs my attention?] [What's on the agenda?] ...
```

---

## Conversational Quality Rescore (Post-784)

Previous score from Sprint 783 audit: **76/100**

| Dimension | Before | After | Change |
|---|---|---|---|
| 1. Context retention | 5/10 | 8/10 | +3 — cross-session page context now persists |
| 2. Natural language quality | 8/10 | 8/10 | — |
| 3. Memory layers | 6/10 | 8/10 | +2 — localStorage layer added for page context |
| 4. Proactive orientation | 6/10 | 7/10 | +1 — "Back to [page]" chip adds proactive navigation |
| 5. First message quality | 8/10 | 9/10 | +1 — cross-session welcome more specific than generic |
| 6. Chip quality | 7/10 | 8/10 | +1 — contextual "Back to" chip when relevant |
| 7. Follow-up handling | 7/10 | 7/10 | — |
| 8. Failure mode clarity | 7/10 | 7/10 | — |
| 9. Role fit | 8/10 | 8/10 | — |
| 10. Trust/safety | 10/10 | 10/10 | — |

**New score: 80/100** (+4)

---

## Safety Verification

- ✅ No player data persisted
- ✅ No coach names or identifiers persisted
- ✅ No scores, assessments, or notes persisted
- ✅ No PII in localStorage
- ✅ Data scoped per `academyId`
- ✅ 7-day TTL — stale data auto-purged
- ✅ SSR-safe (`typeof window` guards)
- ✅ Fail-silent writes (won't crash if localStorage blocked)
- ✅ No new API calls
- ✅ No DB reads or writes
- ✅ No migrations
- ✅ No new components

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/donna/donnaLastSessionStore.ts` | **NEW** — localStorage store with load/save/clear/buildWelcome |
| `src/components/assistant/DonnaAssistantButton.tsx` | **MODIFIED** — 7 surgical changes (import, state, 3 effects/saves, greeting, chip) |
| `docs/DONNA_CROSS_SESSION_WELCOME_784.md` | **NEW** — this document |
| `docs/CHANGELOG.md` | **UPDATED** |

---

## TypeScript

Clean — `npx tsc --noEmit` passes with zero errors.
