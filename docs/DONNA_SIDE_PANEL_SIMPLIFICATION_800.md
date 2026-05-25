# Sprint 800 — DONNA Side Panel Simplification V1

**Date:** 2026-05-25
**Sprint:** 800
**Type:** UX simplification — header badge consolidation, chip trim, page context, typography
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 799 audit identified the DONNA side panel scored **58/100** with these specific blockers:

| Blocker | Impact |
|---|---|
| 8 mutually exclusive status badges visible simultaneously | Cognitive overload — user can't tell what's "important" |
| 6–7 scrolling chips with no visual hierarchy | Paralysis — no clear primary action |
| No page context in panel header | DONNA appears context-blind — low trust |
| All `text-[9px]` badges (below minimum readable size) | Typography violation |

Sprint 800 closes all four with zero backend risk.

---

## Changes

### 1. Header badge consolidation — 8 badges → 1 priority-driven badge

**Before:** Up to 8 conditional badges could show simultaneously in the header:
- Review-first (always)
- Speaking / Listening / Paused / Stopped / Ready / Mic blocked / Voice unavailable (voice state)
- Thinking… (loading)

**After:** A single ternary chain — only the highest-priority badge is shown at any time:

```
Priority order (highest first):
1. Thinking…     — async operation in progress
2. Speaking      — TTS active
3. Listening     — mic active
4. Paused        — voice paused
5. Mic blocked   — permission error
6. Ready         — voice idle + supported
7. (nothing)     — voice stopped or unsupported
```

"Stopped" and "Voice unavailable" are removed from the visible surface — they are internal states that don't require user attention or action.

---

### 2. Page context label in header

**Added below the `DONNA_PUBLIC_TITLE` subtitle:**

```tsx
{ctx.screenName && (
  <p className="text-[10px] text-text-muted leading-snug mt-0.5">
    <span style={{ color: 'rgba(200,255,0,0.55)' }}>↳</span>{' '}
    <span className="text-text-muted">{ctx.screenName}</span>
  </p>
)}
```

`ctx` is derived from `resolvePageContext(pathname)` — already computed per route change. `screenName` is a human-readable string like "Level Builder", "Player Profile", "Review Queue". 

When DONNA has no specific page context registered, `screenName` is falsy and the line hides itself.

---

### 3. Director chip trim — 6 chips → 3 core

**Before (director role, 6 chips + optional "Back to"):**
1. ↩ Back to [page] (conditional)
2. What do I need to do today?
3. What needs my attention?
4. What's on the agenda?
5. What should I review first?
6. Walk me through today.
7. What can you help me do here?

**After (3 core + optional "Back to" = max 4):**
1. ↩ Back to [page] (conditional — preserved)
2. What do I need to do today?
3. What needs my attention?
4. What can you help me do here?

**Removed chips:**
- "What's on the agenda?" — near-duplicate of "What do I need to do today?"
- "What should I review first?" — near-duplicate of "What needs my attention?"
- "Walk me through today." — lowest engagement in conversational patterns

**Preserved:** All 4 coach role chips unchanged.

---

### 4. Typography — all `text-[9px]` → `text-[10px]`

| Location | Before | After |
|---|---|---|
| "Review-first" badge | `text-[9px]` | `text-[10px]` |
| Voice status badges (all) | `text-[9px]` | `text-[10px]` (via new ternary) |
| Page-aware actions safety chip | `text-[9px]` | `text-[10px]` |
| Multi-step plan step number | `text-[9px]` | `text-[10px]` |
| Review Queue count badge | `text-[9px]` | `text-[10px]` |
| Pending approval chip | `text-[9px]` | `text-[10px]` |
| "Coming soon" chip | `text-[9px]` | `text-[10px]` |

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ UI-only changes |
| No RLS change | ✅ Not touched |
| No backend changes | ✅ None |
| No new packages | ✅ None |
| No migrations | ✅ None |
| Chip actions unchanged | ✅ `handleCommandSubmit()` path preserved |
| Voice state logic unchanged | ✅ Only rendering consolidated, not state |
| Coach role chips unchanged | ✅ 4 coach chips preserved exactly |
| "Back to" chip preserved | ✅ Conditional logic untouched |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift after Sprint 800

| Dimension | Sprint 799 audit | Sprint 800 estimate |
|---|---|---|
| DONNA Side Panel | 58/100 | ~68/100 |
| Panel clarity | Low | Medium-high |
| Page context | None | Visible |
| Typography | 9px violations | Clean |

**Key gains:**
- Cognitive load: 8-badge overload → 1 clear status (+8 pts)
- Page context: zero → present in header (+5 pts)
- Chips: 6 paralysis → 3 clear choices (+4 pts)
- Typography: violations eliminated (+3 pts)

---

## Recommended Sprint 801

**Suggested:** DONNA Persistence — Preserve `commandResponse` Across Route Changes

When the director navigates to another page, DONNA's answer currently disappears (Sprint audit finding: `commandResponse` cleared on route change at line ~1089). Fix: persist `commandResponse` in `DonnaSessionContextProvider` instead of local component state, or filter the clear logic to only reset on explicit panel close.

No DB changes. Local state architecture change only.
