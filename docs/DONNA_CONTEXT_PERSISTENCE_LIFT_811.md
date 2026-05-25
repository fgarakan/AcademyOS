# Sprint 811 — DONNA Context Persistence Lift V1

**Date:** 2026-05-25
**Sprint:** 811
**Type:** UX fix — contextSummary, suggestions, and reviewQueueData persistence across route changes
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 810 certification gap (Persistence dimension: 72/100):

> **"`contextSummary`, `reviewQueueData`, `suggestions` still clear on route change"** — director must re-ask for context summary after navigation. When a director asks DONNA to brief them on the current page, then clicks a link to a player profile, then returns — DONNA has forgotten the context. The director must re-ask. This is the same re-ask friction that Sprint 801 eliminated for `commandResponse`.

Sprint 811 removes these three values from the route-change `useEffect` clear list using the same safe approach established in Sprint 801.

---

## Audit Findings

### Route-change useEffect location
Lines 1072–1148 in `DonnaAssistantButton.tsx`. Triggered by `[pathname]` dependency array.

### `commandResponse` status
Already NOT cleared on route change (Sprint 801 fix). Comment at line 1089 confirms. ✅

### Three target values — type and sensitivity analysis

| State | Type | Contains | Sensitive? | Safe to preserve? |
|---|---|---|---|---|
| `contextSummary` | `DonnaContextSummary \| null` | Title, summary, keyFacts, openQuestions, suggestedNextSteps, dataUsed, missingData, safetyNotes — all derived text, no raw PII | No | ✅ Yes |
| `suggestions` | `DonnaSuggestion[]` | id, label, reason, confidence, evidencePoints, taskId?, navigationHref? — derived from contextSummary | No | ✅ Yes |
| `reviewQueueData` | `DonnaReviewQueueSummary \| null` | Counts + `DonnaReviewItem[]` with `playerLabel` and `previewText` (truncated). Director has RLS-backed access. Same data visible in DONNA panel. Same risk level as preserved `commandResponse`. | Low — director-accessible only | ✅ Yes |

### Note on `contextSummary` being page-specific

`contextSummary` is derived from `pathname` via `deriveContextRequest()`. After navigation, the preserved context is from the prior page until the director requests a fresh one. This is the same tradeoff already accepted for `commandResponse` (which also references prior-page content). The director can click "Ask about this page" to refresh.

### Note on `reviewQueueData` being academy-wide

Unlike `contextSummary`, `reviewQueueData` is not page-specific — it's the same queue regardless of which director route is active. Preserving it across navigation is therefore the correct default behavior (queue items don't change per page).

---

## What changed

**Single change:** Removed 3 state clear calls from the route-change `useEffect`. Replaced with explanatory comments.

**Before Sprint 811 (route-change useEffect):**
```tsx
setActionPreview(null)
setContextSummary(null)       // ← REMOVED
setSuggestions([])            // ← REMOVED
setIsLoadingContext(false)
setResolutionContext(null)
setResolvedObjects({})
setReviewQueueData(null)      // ← REMOVED
setIsLoadingReviewQueue(false)
```

**After Sprint 811 (route-change useEffect):**
```tsx
setActionPreview(null)
// Sprint 811 — contextSummary intentionally NOT cleared on route change.
// DONNA's page context persists when the director navigates so they don't have to re-ask.
// Context may be from the previous page until the director explicitly re-requests it.
// It clears on: panel close (closePanel()), explicit dismiss (onDismissContextSummary),
// or when handleContextSummary() fires a fresh fetch (clears before re-fetching).
// Sprint 811 — suggestions intentionally NOT cleared on route change.
// Suggestions are derived from contextSummary — preserving both keeps them coherent.
// They clear on: panel close, individual dismiss, or new context fetch.
setIsLoadingContext(false)
setResolutionContext(null)
setResolvedObjects({})
// Sprint 811 — reviewQueueData intentionally NOT cleared on route change.
// Review queue is academy-wide (not page-specific) — stale data is low-risk and
// preferable to forcing the director to re-fetch on every navigation.
// It clears on: panel close (closePanel()), fetch error, or next successful fetch.
setIsLoadingReviewQueue(false)
```

---

## Persistence matrix after Sprint 811

| State | Route change | Panel close | Explicit dismiss | New fetch / submission |
|---|---|---|---|---|
| `commandResponse` | ✅ Preserved (Sprint 801) | 🗑 Cleared (`closePanel()` line 893) | 🗑 Cleared (`onDismissCommandResponse`) | 🗑 Cleared (before each new response) |
| `contextSummary` | ✅ **Preserved (Sprint 811)** | 🗑 Cleared (`closePanel()` line 896) | 🗑 Cleared (`onDismissContextSummary` line 3860) | 🗑 Cleared before re-fetch (`handleContextSummary()` line 2212) |
| `suggestions` | ✅ **Preserved (Sprint 811)** | 🗑 Cleared (`closePanel()` line 897) | 🗑 Individual dismiss (line 4243) | 🗑 Cleared before re-fetch (`handleContextSummary()` line 2213) |
| `reviewQueueData` | ✅ **Preserved (Sprint 811)** | 🗑 Cleared (`closePanel()` line 901) | — | 🗑 Cleared on fetch error (line 2201) |
| `cooThread` | ✅ Preserved (Sprint 683) | 🗑 Cleared (`closePanel()` line 895) | — | — |

---

## Clear paths confirmed intact after Sprint 811

| Clear path | `contextSummary` | `suggestions` | `reviewQueueData` |
|---|---|---|---|
| Panel close (`closePanel()`) | ✅ Line 896 | ✅ Line 897 | ✅ Line 901 |
| Explicit context dismiss (`onDismissContextSummary`) | ✅ Line 3860 | — | — |
| New context fetch (`handleContextSummary()`) | ✅ Line 2212 clears before re-fetch | ✅ Line 2213 clears before re-fetch | — |
| Review queue fetch error | — | — | ✅ Line 2201 |
| Individual suggestion dismissed | — | ✅ Line 4243 | — |

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ Local React state only |
| No RLS change | ✅ Not touched |
| No localStorage | ✅ Not used |
| No sessionStorage | ✅ Not used |
| `closePanel()` still clears all three | ✅ Lines 896, 897, 901 unchanged |
| Explicit dismiss still clears `contextSummary` | ✅ Line 3860 unchanged |
| `handleContextSummary()` still clears before re-fetch | ✅ Lines 2212–2213 unchanged |
| Fetch error still clears `reviewQueueData` | ✅ Line 2201 unchanged |
| No prompts, transcripts, raw notes preserved | ✅ Not changed |
| No player/parent/private content stored | ✅ Same data already shown to director in DONNA panel |
| No routing logic changed | ✅ `handleCommandSubmit` not touched |
| No backend mutation | ✅ Server Actions not touched |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift

| Dimension | Sprint 810 | Sprint 811 estimate |
|---|---|---|
| DONNA Persistence | 72/100 | ~83/100 |

**Sub-dimension breakdown:**

| Sub-dimension | Before | After | Change |
|---|---|---|---|
| `commandResponse` persists across nav | 80/100 | 80/100 | 0 |
| `contextSummary` / `suggestions` persist across nav | 45/100 | 85/100 | +40 |
| `reviewQueueData` persists across nav | 50/100 | 85/100 | +35 |
| `cooThread` persists across nav | ✅ | ✅ | 0 |
| SessionStorage restore | ✅ | ✅ | 0 |

**Composite (Persistence at 20% weight):**
Sprint 810 composite: (82×0.4) + (72×0.2) + (80×0.2) + (80×0.2) = **79.2/100**
Sprint 811 estimate: (82×0.4) + (83×0.2) + (80×0.2) + (80×0.2) = **81.8/100**

**Net lift: +2.6 composite pts** — from **79.2** to **~81.8/100**

---

## Recommended Sprint 812

**Target:** Push composite to 85+

Two options:

**Option A — DONNA panel mobile usability (+6 pts on Panel dimension)**
Panel is 6/10 on mobile. Responsive improvements to the DONNA side panel (touch targets, panel height, input sizing) could lift Panel from 82 → 88, adding +2.4 composite pts.

**Option B — Stop/Start listening text commands (+5 pts on Commands dimension)**
"Stop listening" and "Start listening" are button-only — no text-command path. Adding phrase detection to `handleCommandSubmit` would lift Commands from 80 → 85, adding +1.0 composite pts.

**Option C — Final 85+ certification sprint**
Re-audit all 4 dimensions after Sprint 811. If composite is confirmed at ~82, plan 2 further improvement sprints before a target 85+ certification.

**Recommended: Option C (re-audit after Sprint 811 lands)**

---

## Files changed in Sprint 811

- **Modified** `src/components/assistant/DonnaAssistantButton.tsx` — removed `setContextSummary(null)`, `setSuggestions([])`, and `setReviewQueueData(null)` from route-change `useEffect`; added Sprint 811 comments explaining intentional persistence for each
- **Created** `docs/DONNA_CONTEXT_PERSISTENCE_LIFT_811.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 811 entry
