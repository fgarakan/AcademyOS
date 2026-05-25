# DONNA Daily Brief Natural Walkthrough V1 — Sprint 789

**Date:** 2026-05-25
**Sprint:** 789
**Status:** COMPLETE

---

## Goal

Make the daily brief experience conversational — not just visual. When the brief loads, DONNA speaks a natural 1–2 sentence summary aloud. Directors can also request a full narrated walkthrough via a "Walk me through it" button on the brief card.

---

## Problem Before Sprint 789

The daily brief was a purely visual card. When a director asked "What do I need to do today?", the brief would load and render — but DONNA said nothing. There was no spoken acknowledgment, no priority signal, no entry point to a narrated overview.

---

## What Changed

### 1. Auto-narrated summary on brief load

In `handleFetchDailyBrief()`, after `setDailyBrief(json.brief)`, `speakDonna()` is called with a contextual 1–2 sentence summary built from the brief data.

**Example outputs:**

| Scenario | Spoken text |
|---|---|
| 3 areas, 2 high priority | "You've got 3 areas today. 2 areas look higher priority — starting with Review Queue." |
| 1 high-priority area | "You've got 5 areas today. One area needs your attention first: Player Flags." |
| 0 high-priority areas | "You've got 4 areas today — nothing is marked urgent." |
| Empty brief | "Today's brief is ready — nothing needs your attention right now." |

### 2. New utility: `buildBriefVoiceSummary(brief)`

Pure function (no DB, no API, no side effects). Builds a natural 1–2 sentence summary from brief structural metadata. Never includes player names, raw coach notes, or sensitive content.

### 3. New utility: `buildBriefWalkthroughText(brief)`

Builds a full narration string from all brief sections:
- Each section contributes: `{title}[— urgent]: {firstItem} and {N} more`
- Sections joined with `. `

**Example:** "Review Queue — urgent: 3 notes need approval and 2 more. Player Flags: Check Level 2 assessment readiness."

### 4. `handleBriefWalkthrough()`

Called when director clicks "Walk me through it" button. Combines summary + details into one spoken narration:
```
"{summary} Here's the breakdown: {details} Want me to open the Review Queue?"
```

Sets `commandResponse`, pushes to `cooThread`, calls `speakDonna()`, resets idle timer.

### 5. "Walk me through it" button on the brief card

Added to `DonnaDailyBriefCard.tsx` CTA section (leftmost position, with `PlayCircle` icon).

**Wiring chain:**
```
DonnaDailyBriefCard.onWalkthrough
  → DonnaWorkflowCards.onDailyBriefWalkthrough
    → DonnaAssistantButton.handleBriefWalkthrough()
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | + `buildBriefVoiceSummary`, + `buildBriefWalkthroughText`, + `handleBriefWalkthrough`, auto-speak in `handleFetchDailyBrief`, wire `onDailyBriefWalkthrough` |
| `src/components/assistant/DonnaDailyBriefCard.tsx` | + `onWalkthrough` prop, + `PlayCircle` icon import, + "Walk me through it" button in CTAs |
| `src/components/assistant/DonnaWorkflowCards.tsx` | + `onDailyBriefWalkthrough` prop, wire to brief card `onWalkthrough` |

---

## What Was Not Changed

- No routing logic
- No DB/API behavior  
- No new state
- No migrations
- Existing brief card visual layout unchanged (button added to existing CTA row)
- All existing brief card props remain optional/unchanged

---

## Sprint 786 Style Alignment

`buildBriefVoiceSummary` output follows the Sprint 786 persona standard:
- 1–2 sentences max
- Warm, direct, specific
- No robotic data-dump ("The brief has N sections with M items")
- Ends with a clear next-action signal (which area to start with)

---

## TypeScript

Clean — `npx tsc --noEmit` passes with zero errors.
