# Sprint 802 — DONNA Command Understanding V1

**Date:** 2026-05-25
**Sprint:** 802
**Type:** UX fix — command understanding: "Close Donna" + follow-up resolver for COO responses
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 799 audit tested 21 commands and scored **55/100** with two blocker-class failures:

| Failure | Audit finding |
|---|---|
| "Close Donna" typed → no effect | Typed command not wired; only the X button closes the panel |
| "Go there" / "Open that" after a COO answer | `resolveFollowUp` had no coverage for `coo_answer` intent — fell through to generic "are you asking about today's brief?" clarification |

Sprint 802 closes both gaps with zero backend risk.

---

## Changes

### 1. "Close Donna" text command

**Added at the very top of `handleCommandSubmit`** — before onboarding, before draft routing, before any intent classification:

```tsx
// Sprint 802 — "Close Donna" text command
{
  const lc = text.toLowerCase().trim()
  if (
    lc === 'close donna' || lc === 'close panel' || lc === 'hide donna' ||
    lc === 'dismiss donna' || lc === 'dismiss' || lc === 'close this' ||
    lc === 'close assistant' || lc === 'exit donna' || lc === 'stop donna'
  ) {
    closePanel()
    return
  }
}
```

**Phrase list chosen conservatively** — only unambiguous explicit close intent. Excluded: "bye" (could be conversational), "close" alone (too broad), "thanks" (could prefix other intents).

**Runs before `updatePrompt()`** — these phrases are not logged as DONNA prompts (they are UI commands, not questions).

---

### 2. COO follow-up context wiring

**The problem:** When a director asked a COO question (e.g., "What curriculum changes are pending?") and DONNA answered, then typed "go there" or "open that", `resolveFollowUp` had no context to work with — `sessionIntentContext` was only populated by daily brief, review queue, and attention loads. COO answers left it null.

**The fix:** After every non-blocked COO response, set `sessionIntentContext` with:
- `lastIntentFamily: 'coo_answer'`
- `lastSuggestedNavigationHref`: the composed response's `nextStepHref` (e.g., `/director/review`, `/director/curriculum`)
- `lastSuggestedNavigationLabel`: the composed response's `nextStepLabel`

```tsx
// Sprint 802 — record intent context so follow-up phrases resolve after COO responses
if (!composed.isBlocked) {
  setSessionIntentContext({
    lastIntentFamily: 'coo_answer',
    lastResultSectionCount: null,
    lastResultHighPriorityCount: null,
    lastResultItemCount: null,
    lastSuggestedNavigationHref: composed.nextStepHref ?? null,
    lastSuggestedNavigationLabel: composed.nextStepLabel ?? null,
    lastTopicLabel: composed.nextStepLabel ?? null,
    setAt: Date.now(),
  })
}
```

**`resolveFollowUp` already handles this** — the existing fallback at line 335 (`lastSuggestedNavigationHref` check) fires correctly for `coo_answer`. No change to `donnaFollowUpResolver.ts` was needed.

---

## Before/after: command understanding test

| Command | Before Sprint 802 | After Sprint 802 |
|---|---|---|
| "close donna" | ❌ No effect (input cleared, panel stays open) | ✅ Panel closes |
| "close panel" | ❌ No effect | ✅ Panel closes |
| "dismiss donna" | ❌ No effect | ✅ Panel closes |
| "exit donna" | ❌ No effect | ✅ Panel closes |
| "Go there" (after COO answer with nav hint) | ❌ Generic clarification | ✅ Navigates to `nextStepHref` |
| "Open that" (after COO answer with nav hint) | ❌ Generic clarification | ✅ Navigates to `nextStepHref` |
| "Show me" (after COO answer with nav hint) | ❌ Generic clarification | ✅ Navigates to `nextStepHref` |
| "Which ones?" (after COO answer with nav hint) | ❌ Generic clarification | ✅ Navigates to `nextStepHref` |

Commands where COO answer has no `nextStepHref` (not all do) still produce the helpful clarification — no regression.

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ Local state only |
| No RLS change | ✅ Not touched |
| Close command runs before `updatePrompt()` | ✅ Not logged as a DONNA prompt |
| `sessionIntentContext` contains only safe data | ✅ nextStepHref + nextStepLabel (no raw content, no player names) |
| `resolveFollowUp` TTL guard still active (10 min) | ✅ Not touched |
| `resolveFollowUp` only fires on ≤12-word inputs | ✅ Not touched |
| COO blocked responses do NOT set intent context | ✅ `if (!composed.isBlocked)` guard |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift after Sprint 802

| Dimension | Sprint 799 audit | Sprint 802 estimate |
|---|---|---|
| Command Understanding | 55/100 | ~68/100 |

**Key gains:**
- "Close Donna" now works (+5 pts for explicit close)
- COO follow-ups now navigate correctly for 8+ anaphoric phrases (+8 pts for follow-up resolver)

---

## Recommended Sprint 803

**Suggested:** Director Dashboard Rebuild V1

Sprint 799 audit scored dashboard cognitive load at **40/100**. Root causes:
- 8-card KPI section above fold (compete equally, no priority)
- 3 separate "needs attention" surfaces
- No clear primary action area

Sprint 803: Move KPI cards below the action surface. Consolidate the 3 attention surfaces into 1. Surface DONNA's most recent answer at the top of the dashboard.
