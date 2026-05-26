# Sprint 858 — DONNA Context Loading Indicator V1

**Date:** 2026-05-26
**Sprint:** 858
**Type:** UI — context loading feedback for auto-fetch (panel open + route change)
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Problem

**Source:** Sprint 857 known limitation + Sprint 858 roadmap goal.

Sprint 856 added auto-context fetch on panel open. Sprint 857 added auto-context fetch on route change while panel remains open. Both sprints correctly trigger `handleContextSummary()` automatically — but neither added director-facing feedback that the fetch was happening.

### Pre-858 loading state gaps

| Location | Pre-858 state | Gap |
|---|---|---|
| DONNA header | Global "Thinking…" badge fires when `isLoadingContext` is true — shared with 4 other loading states (`isProcessingCommand`, `isLoadingReviewQueue`, `isDailyBriefLoading`, `isAttentionLoading`) | Director can't tell context is loading vs. anything else is loading |
| Context pill | Static teal dot when `contextSummary && !showContextSection` only | No indicator during loading — dot absent while DONNA is actively fetching |
| Context section (open, loading) | Shows disabled "Reading…" text on the "Ask about this page" button | Button is invisible unless section was already open; on fresh panel open, section is closed so button never shows; on route change the section goes blank (contextSummary cleared to null, DonnaWorkflowCards renders nothing) |

### The blank-section problem (route change with panel open)

Before Sprint 858, when Sprint 857 triggered a route-change context refresh:
1. `handleContextSummary()` called → `contextSummary` cleared to null immediately
2. `DonnaWorkflowCards` gets `contextSummary: null` → renders nothing
3. `showContextSection` remains `true` (was opened by Sprint 823 on prior route)
4. Director sees: context section open → goes blank → content reappears after fetch

This brief blank state with no indicator was the main UX gap.

---

## Audit Findings (Sprint 858)

| Component | Line | Pre-858 behavior |
|---|---|---|
| Context pill dot | 4440–4442 | `{contextSummary && !showContextSection && (<span ... />)}` — static dot, no loading state |
| Context section body | 4480–4498 | Always shows "Ask about this page" button; text changes to "Reading…" (disabled) during `isLoadingContext` |
| `DonnaWorkflowCards` context slot | 4059 | `contextSummary={showContextSection ? contextSummary : null}` — null during load; renders nothing |
| `isLoadingContext` state | 753 | Already exists; wired into global "Thinking…" badge and button disabled state — never used for dedicated context feedback |

---

## Implementation

### `src/components/assistant/DonnaAssistantButton.tsx`

#### Change 1 — Context pill loading dot

**Before:**
```tsx
{contextSummary && !showContextSection && (
  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 ml-0.5" />
)}
```

**After:**
```tsx
{/* Sprint 858 — loading pulse when fetching; static dot when loaded + collapsed */}
{isLoadingContext ? (
  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 ml-0.5 animate-pulse" />
) : (contextSummary && !showContextSection) ? (
  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 ml-0.5" />
) : null}
```

**Dot state matrix:**

| `isLoadingContext` | `contextSummary` | `showContextSection` | Dot shown |
|---|---|---|---|
| `true` | any | any | Pulsing teal dot ✅ |
| `false` | not null | `false` | Static teal dot ✅ |
| `false` | null | any | No dot ✅ |
| `false` | not null | `true` | No dot (section already open, dot not needed) ✅ |

#### Change 2 — Context section body: skeleton while loading

**Before:**
```tsx
{showContextSection && (
  <div className="space-y-2">
    <button disabled={isLoadingContext} ...>
      <Sparkles ... />
      {isLoadingContext ? 'Reading…' : 'Ask about this page'}
    </button>
  </div>
)}
```

**After:**
```tsx
{showContextSection && (
  <div className="space-y-2">
    {isLoadingContext ? (
      <div className="rounded-xl px-3.5 py-3 space-y-2.5" style={{ teal border }}>
        <p className="... animate-pulse">Refreshing context…</p>
        <div className="space-y-1.5 animate-pulse">
          {/* three skeleton lines at 72%, 50%, 62% width */}
        </div>
      </div>
    ) : (
      <button onClick={() => void handleContextSummary()} ...>
        <Sparkles ... />
        Ask about this page
      </button>
    )}
  </div>
)}
```

**Section state matrix:**

| `showContextSection` | `isLoadingContext` | `contextSummary` | What shows |
|---|---|---|---|
| `false` | any | any | Nothing (section collapsed) |
| `true` | `true` | any | "Refreshing context…" skeleton ✅ |
| `true` | `false` | null | "Ask about this page" button ✅ |
| `true` | `false` | not null | "Ask about this page" button + context card (via DonnaWorkflowCards) ✅ |

**Why skeleton replaces the button (not shown alongside):**
- Avoids two simultaneous loading signals
- Button "Reading…" (disabled) was invisible on fresh panel open anyway
- Skeleton is more informative — shows explicit "Refreshing context…" label
- Button restores when idle so manual re-fetch is always available

---

## Full Loading Experience (post-858)

### Panel open (Sprint 856 auto-trigger)
1. Panel opens → `isLoadingContext: true`
2. Context pill → pulsing teal dot
3. Context section body → section is closed (Sprint 823 hasn't fired yet); pill dot is the only feedback
4. Context loads → `contextSummary` set → Sprint 823 opens section → content appears
5. Pill dot changes: loading pulse → no dot (section now open, static dot not shown when section is open)

### Route change with panel open (Sprint 857 auto-trigger)
1. Director navigates → Sprint 857 fires → `handleContextSummary()` → `contextSummary: null`, `isLoadingContext: true`
2. Context pill → pulsing teal dot (replaces static dot that was showing prior content)
3. Context section (already open from prior route) → skeleton with "Refreshing context…"
4. Context loads → skeleton replaced by context card → pill dot returns to static (section open, dot not shown)

### Manual "Ask about this page"
1. Director clicks button → `handleContextSummary()` → `isLoadingContext: true`
2. Pill → pulsing dot
3. Section body → skeleton
4. Context loads → skeleton gone, context card shows, button restores below

### Panel closed (Sprint 811 path)
- Sprint 857 guard blocks fetch when panel is closed
- No loading indicators fire
- No UX change ✅

---

## Files Created

### `docs/DONNA_CONTEXT_LOADING_INDICATOR_858.md`
This file.

---

## Files Modified

### `src/components/assistant/DonnaAssistantButton.tsx`
- Context pill: pulsing dot during `isLoadingContext` (Change 1)
- Context section body: skeleton during `isLoadingContext` when section open (Change 2)

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `handleContextSummary()` | Unchanged |
| `fetchDonnaContext` | Unchanged |
| `deriveContextRequest()` | Unchanged |
| Sprint 856 `[panelOpen]` effect | Unchanged |
| Sprint 857 `[pathname]` effect | Unchanged |
| `closePanel()` | Unchanged |
| Sprint 823 auto-expand effect | Unchanged — still auto-opens section when context loads |
| Global "Thinking…" header badge | Unchanged — still fires for all loading states including context |
| `DonnaWorkflowCards` | Unchanged |
| `DonnaSessionContext` | Unchanged |
| SQL / RLS / migrations / seed / env | Unchanged |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ pure UI change |
| No data mutations | ✅ |
| No role boundary changes | ✅ |
| No new state variables | ✅ uses existing `isLoadingContext` |
| No new imports | ✅ `animate-pulse` is standard Tailwind |
| No TypeScript risk | ✅ pure JSX, no new types |

---

## Known Limitations (post-858)

| Limitation | Impact | Resolution path |
|---|---|---|
| Global "Thinking…" badge still fires for all loading states | Director can't distinguish context load from review queue load at the header level | Sprint 917 performance pass — consider separating copy per loading source |
| Skeleton shows for the full fetch duration (no progress stages) | Acceptable for V1 — fetches are fast (~300–800ms) | Future: add progressive reveal when context arrives |
| Section doesn't auto-open during loading on fresh panel open | Director sees only the pill pulse on first open; section opens after load | By design — auto-opening on load-start would be disruptive; Sprint 823 auto-open on completion is the right UX |
